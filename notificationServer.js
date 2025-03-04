const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_SERVICE_ROLE_KEY');
const expo = new Expo();

const listenForChanges = () => {
  const subscription = supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, handleChange)
    .subscribe();
};

const handleChange = async (payload) => {
  if (payload.table === 'messages' && payload.eventType === 'INSERT') {
    const message = payload.new;
    const { data: receiver } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', message.receiver_id)
      .single();

    if (receiver && receiver.push_token) {
      sendPushNotification(receiver.push_token, 'New Message', message.content);
    }
  }
  // Add similar conditions for photos and miss_you_counts
};

const sendPushNotification = (pushToken, title, body) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
  }];

  expo.sendPushNotificationsAsync(messages)
    .then(ticketChunk => {
      console.log('Notification sent:', ticketChunk);
    })
    .catch(error => {
      console.error('Error sending notification:', error);
    });
};

listenForChanges();
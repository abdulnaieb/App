import { supabase } from "./supabase"
import NotifService from 'react-native-notifications';

const notifService = new NotifService();

export async function schedulePushNotification(title, body) {
  try {
    notifService.localNotification({
      title,
      message: body,
      playSound: true,
      soundName: 'default',
    });
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    throw new Error('Failed to schedule notification');
  }
}

export async function registerForPushNotificationsAsync() {
  try {
    notifService.requestPermissions();
    const token = await notifService.getToken();
    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    throw new Error('Failed to register for push notifications');
  }
}


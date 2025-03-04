import { Notifications } from '@notifee/react-native';
import { Platform } from 'react-native';

// Initialize notifications
Notifications.registerRemoteNotifications();

// Configure notification appearance for Android
if (Platform.OS === 'android') {
  Notifications.createChannelAndroid({
    channelId: 'default',
    channelName: 'Default Channel',
    channelDescription: 'Default notification channel',
    soundName: 'default',
    importance: 5,
    vibrate: true,
  });
}

// Configure notification handling
Notifications.events().registerNotificationReceivedForeground((notification, completion) => {
  completion({ alert: true, sound: true, badge: true });
});

Notifications.events().registerNotificationOpened((notification, completion) => {
  completion();
});

// Configure notification appearance for iOS
if (Platform.OS === 'ios') {
  Notifications.setCategories([
    {
      identifier: 'message',
      actions: [
        {
          identifier: 'read',
          title: 'Read',
          activationMode: 'foreground',
          authenticationRequired: false,
        },
      ],
    },
  ]);
}
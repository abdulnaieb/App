import { Alert as RNAlert } from 'react-native';

export const Alert = {
  show: (title: string, message: string) => {
    RNAlert.alert(title, message);
  }
};
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

const getProjectId = () => (
  Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || null
);

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C'
  });
};

const requestPushPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const registerUserPushToken = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  if (!Device.isDevice) return null;

  await ensureAndroidChannel();
  const granted = await requestPushPermission();
  if (!granted) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;
  if (!token) return null;

  await setDoc(
    doc(db, 'users', userId),
    {
      expoPushTokens: arrayUnion(token),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return token;
};

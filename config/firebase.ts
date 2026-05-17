import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string>;

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const initAuth = () => {
  if (Platform.OS !== 'web' && getApps().length === 1) {
    const { getReactNativePersistence } = require('firebase/auth');
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
    return initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });
  }
  return getAuth(app);
};

export const auth = initAuth();

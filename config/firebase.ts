import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCjJfvGyxZp22ZoE4zW1tFZYN_EG4jKNh4',
  authDomain: 'appls-552bd.firebaseapp.com',
  projectId: 'appls-552bd',
  storageBucket: 'appls-552bd.firebasestorage.app',
  messagingSenderId: '123724643020',
  appId: '1:123724643020:web:2e593537c81d8db804a069',
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

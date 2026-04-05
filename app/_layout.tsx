import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from '@/store';
import { AuthProvider, useAuth } from '@/context/auth';

function RootGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(app)/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    // Provider makes Redux store available to all components
    <Provider store={store}>
      {/* PersistGate delays rendering until persisted state is rehydrated */}
      <PersistGate
        loading={
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        }
        persistor={persistor}
      >
        <AuthProvider>
          <RootGuard />
          <StatusBar style="auto" />
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

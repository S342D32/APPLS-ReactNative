import { Stack } from 'expo-router';
import AppHeader from '@/components/AppHeader';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tab screens — header handled inside tabs layout */}
      <Stack.Screen name="(tabs)" />

      {/* Quiz play — custom header with back button */}
      <Stack.Screen
        name="quiz-play"
        options={{
          header: () => <AppHeader title="Assessment" showBack />,
          headerShown: true,
          // Smooth slide animation
          animation: 'slide_from_right',
        }}
      />

      {/* Quiz results — no header, no back gesture */}
      <Stack.Screen
        name="quiz-results"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

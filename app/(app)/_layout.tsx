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

      {/* Attempt detail — custom header with back button */}
      <Stack.Screen
        name="attempt-detail"
        options={{
          header: () => <AppHeader title="Attempt Details" showBack />,
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />

      {/* PDF Quiz — custom header with back button */}
      <Stack.Screen
        name="pdf-quiz"
        options={{
          header: () => <AppHeader title="Doc Intelligence" showBack />,
          headerShown: true,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

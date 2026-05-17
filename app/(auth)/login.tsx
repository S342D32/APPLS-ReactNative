import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
        <Text className="text-base text-gray-500 mb-8">Sign in to your account</Text>

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-2 text-base text-gray-900"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text className="text-red-500 text-sm mb-4">{error}</Text>
        ) : (
          <View className="mb-4" />
        )}

        <TouchableOpacity
          className="w-full bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>
        <View className="mt-4 items-center">
          <Text className="text-gray-500">
            Don't have an account?{' '}
            <Text
              className="text-blue-400 font-medium"
              onPress={() => router.replace('/(auth)/signup')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

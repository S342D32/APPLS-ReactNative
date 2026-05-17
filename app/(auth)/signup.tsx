import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      // Auth context (onAuthStateChanged) handles firebase-sync automatically
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Email already registered.');
      } else {
        setError(e.message ?? 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Text className="text-white text-2xl font-black">S</Text>
            </View>
            <Text className="text-3xl font-bold text-white mb-1">Create Account</Text>
            <Text className="text-gray-400 text-base">Join our learning community</Text>
          </View>

          {/* Error */}
          {!!error && (
            <View className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {/* Fields */}
          <View className="gap-4">
            <View>
              <Text className="text-gray-400 text-sm font-medium mb-2">Full Name</Text>
              <TextInput
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-base"
                placeholder="Enter your name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-gray-400 text-sm font-medium mb-2">Email Address</Text>
              <TextInput
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-base"
                placeholder="Enter your email"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-gray-400 text-sm font-medium mb-2">Password</Text>
              <TextInput
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-base"
                placeholder="Create a password (min. 6 chars)"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            className="mt-6 w-full bg-blue-600 rounded-xl py-4 items-center"
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Stats strip */}
          <View className="flex-row justify-around mt-8 pt-6 border-t border-gray-800">
            {[
              { value: '50K+', label: 'Learners' },
              { value: '95%', label: 'Success' },
              { value: '10x', label: 'Faster' },
            ].map((s) => (
              <View key={s.label} className="items-center">
                <Text className="text-white font-bold text-lg">{s.value}</Text>
                <Text className="text-gray-500 text-xs">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Login link */}
          <View className="mt-6 items-center">
            <Text className="text-gray-500">
              Already have an account?{' '}
              <Text
                className="text-blue-400 font-medium"
                onPress={() => router.replace('/(auth)/login')}
              >
                Login here
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

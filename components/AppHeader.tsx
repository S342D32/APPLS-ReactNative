import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  // Show hamburger menu button (for main tab screens)
  showMenu?: boolean;
  onMenuPress?: () => void;
  // Show back button (for stack screens like quiz-play)
  showBack?: boolean;
  // Optional right-side action
  rightAction?: { label: string; onPress: () => void };
};

export default function AppHeader({
  title,
  showMenu = false,
  onMenuPress,
  showBack = false,
  rightAction,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white border-b border-gray-100"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View className="flex-row items-center px-4 h-14">

        {/* Left — back button or hamburger */}
        <View className="w-10">
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              {/* Back chevron */}
              <Text className="text-gray-700 text-lg font-bold" style={{ marginLeft: -2 }}>
                ‹
              </Text>
            </TouchableOpacity>
          )}
          {showMenu && (
            <TouchableOpacity
              onPress={onMenuPress}
              className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              {/* Hamburger lines */}
              <View className="gap-1">
                <View className="w-4 h-0.5 bg-gray-700 rounded-full" />
                <View className="w-4 h-0.5 bg-gray-700 rounded-full" />
                <View className="w-3 h-0.5 bg-gray-700 rounded-full" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Center — title */}
        <Text className="flex-1 text-center text-base font-bold text-gray-900">
          {title}
        </Text>

        {/* Right — optional action */}
        <View className="w-10 items-end">
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              className="px-2 py-1"
              activeOpacity={0.7}
            >
              <Text className="text-blue-600 text-sm font-semibold">
                {rightAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

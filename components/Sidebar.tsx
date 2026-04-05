import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.78;

const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: '⊞',  route: '/(app)/(tabs)'           },
  { label: 'Quiz',        icon: '✎',  route: '/(app)/(tabs)/quiz'      },
  { label: 'AI Chat',     icon: '💬', route: '/(app)/(tabs)/chat'      },
  { label: 'PDF Upload',  icon: '📄', route: '/(app)/(tabs)/pdf'       },
  { label: 'Analytics',   icon: '📊', route: '/(app)/(tabs)/analytics' },
  { label: 'Path Finder', icon: '🗺️', route: '/(app)/(tabs)/pathfinder'},
  { label: 'Profile',     icon: '👤', route: '/(app)/(tabs)/profile'   },
];

// ─── NavItem as its own component so useAnimatedStyle is at top level ─────────
// This fixes the Rules of Hooks violation (hooks can't be called inside .map())
function NavItem({
  item,
  index,
  isActive,
  progress,
  onPress,
}: {
  item: (typeof NAV_ITEMS)[0];
  index: number;
  isActive: boolean;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  // Hook called at top level of this component — no violation
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.3 + index * 0.06, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 0.3 + index * 0.06, 1],
          [-24, -24, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.65}
        className={`flex-row items-center gap-4 px-4 py-3.5 rounded-xl mb-1 ${
          isActive ? 'bg-blue-50' : ''
        }`}
      >
        <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
          {item.icon}
        </Text>
        <Text
          className={`text-sm font-semibold flex-1 ${
            isActive ? 'text-blue-600' : 'text-gray-700'
          }`}
        >
          {item.label}
        </Text>
        {isActive && <View className="w-1.5 h-5 bg-blue-600 rounded-full" />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Logout item ──────────────────────────────────────────────────────────────
function LogoutItem({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.3 + NAV_ITEMS.length * 0.06, 1],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 0.3 + NAV_ITEMS.length * 0.06, 1],
          [-24, -24, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.65}
        className="flex-row items-center gap-4 px-4 py-3.5 rounded-xl"
      >
        <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🚪</Text>
        <Text className="text-sm font-semibold text-red-500">Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  currentRoute?: string;
};

export default function Sidebar({ visible, onClose, currentRoute }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const backendUser = useAppSelector((s) => s.auth.backendUser);

  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withSpring(1, SPRING_CONFIG);
    } else {
      progress.value = withTiming(0, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-SIDEBAR_WIDTH, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 260);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  if (!mounted) return null;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
      pointerEvents="box-none"
    >
      <StatusBar barStyle="light-content" />

      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.52)' },
            backdropStyle,
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0, bottom: 0, left: 0,
            width: SIDEBAR_WIDTH,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 6, height: 0 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 24,
          },
          drawerStyle,
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
        >
          {/* User header */}
          <View className="bg-blue-600 px-6 pt-14 pb-6">
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-3 border-2 border-white/30">
              <Text className="text-white text-2xl font-bold">
                {backendUser?.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {backendUser?.name ?? 'User'}
            </Text>
            <Text className="text-blue-200 text-xs mt-0.5" numberOfLines={1}>
              {backendUser?.email}
            </Text>
          </View>

          {/* Nav items */}
          <View className="px-3 pt-4 flex-1">
            {NAV_ITEMS.map((item, index) => (
              <NavItem
                key={item.route}
                item={item}
                index={index}
                isActive={currentRoute === item.route}
                progress={progress}
                onPress={() => handleNavigate(item.route)}
              />
            ))}
          </View>

          {/* Logout */}
          <View className="px-3 pb-10 pt-4 border-t border-gray-100 mx-3 mt-4">
            <LogoutItem progress={progress} onPress={handleLogout} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

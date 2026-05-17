import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_TITLES: Record<string, string> = {
  index: "Dashboard",
  quiz: "MCQ Quiz",
  chat: "Messages",
  analytics: "Analytics",
  pathfinder: "Path Finder",
  profile: "Profile",
  assistant: "AI Assistant",
};

const QUOTES = [
  { text: "Every expert was once a beginner.", emoji: "🚀" },
  { text: "Knowledge is the new superpower.", emoji: "⚡" },
  { text: "One quiz at a time.", emoji: "🎯" },
  { text: "Your future self is watching.", emoji: "🌟" },
  { text: "Progress over perfection.", emoji: "📈" },
  { text: "Learn today. Lead tomorrow.", emoji: "🏆" },
];

export default function TabsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Rotating quote
  const [quoteIndex, setQuoteIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[quoteIndex];
  // Only show the strip when there's meaningful bottom inset (tall phones with home indicator)
  const showStrip = insets.bottom >= 20;

  return (
    // Use absolute positioning so sidebar overlays the entire screen
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          header: () => (
            <AppHeader
              title={TAB_TITLES[route.name] ?? route.name}
              showMenu
              onMenuPress={() => setSidebarOpen(true)}
            />
          ),
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#9ca3af",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#f3f4f6",
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="quiz"
          options={{
            title: "Quiz",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="assistant"
          options={{
            title: "Assistant",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" size={size} color={color} />
            ),
          }}
        /> */}
      </Tabs>

      {/* Motivational strip — fills the safe-area gap on tall phones */}
      {showStrip && (
        <View
          style={{
            height: insets.bottom,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            paddingHorizontal: 16,
          }}
        >
          <Animated.Text style={{ opacity: fadeAnim, fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600', letterSpacing: 0.3 }}>
            {quote.emoji}  {quote.text}
          </Animated.Text>
        </View>
      )}

      {/* Sidebar rendered outside Tabs so it overlays tab bar too */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute={pathname}
      />
    </View>
  );
}


import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { Tabs, usePathname } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TAB_TITLES: Record<string, string> = {
  index: "Dashboard",
  quiz: "MCQ Quiz",
  chat: "Messages",
  analytics: "Analytics",
  pathfinder: "Path Finder",
  profile: "Profile",
};

export default function TabsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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
      </Tabs>

      {/* Sidebar rendered outside Tabs so it overlays tab bar too */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute={pathname}
      />
    </View>
  );
}

import { Text } from "react-native";
function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 20, color, lineHeight: 26 }}>{label}</Text>;
}

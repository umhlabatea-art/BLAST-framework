import { Text, View } from "react-native";
import { Tabs } from "expo-router";
import { palette } from "../../src/theme";
import { MiniPlayer } from "../../src/components/MiniPlayer";

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette["burnt-orange"],
          tabBarInactiveTintColor: palette["earth-brown"],
          tabBarStyle: {
            backgroundColor: palette.cream,
            borderTopColor: palette.ochre,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontFamily: "Ubuntu", fontSize: 11 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: ({ color }) => <TabIcon icon="🎧" color={color} /> }} />
        <Tabs.Screen name="generate" options={{ title: "Generate", tabBarIcon: ({ color }) => <TabIcon icon="✨" color={color} /> }} />
        <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color }) => <TabIcon icon="🌍" color={color} /> }} />
        <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }} />
      </Tabs>
      {/* Floats just above the tab bar, visible on every tab. */}
      <View className="absolute bottom-[62px] left-0 right-0">
        <MiniPlayer />
      </View>
    </View>
  );
}

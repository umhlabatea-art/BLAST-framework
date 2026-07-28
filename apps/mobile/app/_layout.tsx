import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts, Ubuntu_400Regular, Ubuntu_700Bold } from "@expo-google-fonts/ubuntu";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { View } from "react-native";
import { palette } from "../src/theme";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    Ubuntu: Ubuntu_400Regular,
    Ubuntu_700Bold,
  });

  useEffect(() => {
    // Keep the async audio session friendly on all platforms.
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette["earth-dark"] }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.cream } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="player" options={{ presentation: "modal" }} />
          <Stack.Screen name="track/[id]" options={{ headerShown: true, title: "Track" }} />
          <Stack.Screen name="subscriptions" options={{ headerShown: true, title: "Subscriptions" }} />
          <Stack.Screen name="compliance" options={{ headerShown: true, title: "Rights Hub" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

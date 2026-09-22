import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from "@expo-google-fonts/ibm-plex-mono";
import { View } from "react-native";
import { palette } from "../src/theme";
import { useSettings } from "../src/store/settings";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  // Never block the UI indefinitely on font loading — if fonts fail or stall,
  // render anyway (the system monospace stands in for IBM Plex Mono).
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    // Restore the saved OpenRouter key/model so AI tasks can run live.
    useSettings.getState().load();
    const t = setTimeout(() => setFontTimeout(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return <View style={{ flex: 1, backgroundColor: palette.paper }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.paper },
            headerStyle: { backgroundColor: palette.paper },
            headerShadowVisible: false,
            headerTintColor: palette.ink,
            headerTitleStyle: { fontFamily: "IBMPlexMono_600SemiBold", fontSize: 16 },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" options={{ presentation: "modal" }} />
          <Stack.Screen name="player" options={{ presentation: "modal" }} />
          <Stack.Screen name="track/[id]" options={{ headerShown: true, title: "Track" }} />
          <Stack.Screen name="subscriptions" options={{ headerShown: true, title: "Plans" }} />
          <Stack.Screen name="compliance" options={{ headerShown: true, title: "Rights Hub" }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings" }} />
          <Stack.Screen name="tasks" options={{ headerShown: true, title: "Agent Tasks" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

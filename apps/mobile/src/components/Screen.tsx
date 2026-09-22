/** Themed screen wrapper: safe-area padding + brand background + scroll. */
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children, scroll = true, padded = true }: { children: React.ReactNode; scroll?: boolean; padded?: boolean }) {
  const pad = padded ? "px-5" : "";
  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className={`flex-1 ${pad}`}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className={`flex-1 ${pad}`}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

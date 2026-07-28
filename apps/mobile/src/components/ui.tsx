/**
 * Core design-system primitives, all NativeWind-styled from the shared theme.
 * Kept in one module so screens import a small, consistent vocabulary.
 */
import { Text, View, Pressable, ActivityIndicator, ViewProps, TextProps } from "react-native";
import { coverGradient } from "../theme";

// --- Typography ------------------------------------------------------------

export function Display({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-display text-earth-dark ${className}`} {...p} />;
}
export function Heading({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-display text-earth-dark text-2xl ${className}`} {...p} />;
}
export function Body({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-body text-earth-brown ${className}`} {...p} />;
}

// --- Surfaces --------------------------------------------------------------

export function Card({ className = "", children, ...p }: ViewProps & { className?: string }) {
  return (
    <View className={`bg-surface rounded-2xl p-4 shadow-lg shadow-black/10 ${className}`} {...p}>
      {children}
    </View>
  );
}

export function Badge({ label, tone = "primary" }: { label: string; tone?: "primary" | "accent" | "sage" | "muted" }) {
  const tones: Record<string, string> = {
    primary: "bg-burnt-orange",
    accent: "bg-gold",
    sage: "bg-sage",
    muted: "bg-ochre",
  };
  return (
    <View className={`self-start rounded-full px-3 py-1 ${tones[tone]}`}>
      <Text className="font-body text-xs font-bold uppercase tracking-wide text-white">{label}</Text>
    </View>
  );
}

// --- Buttons ---------------------------------------------------------------

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline" | "dark";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const base = "rounded-xl py-3 px-5 items-center justify-center";
  const styles: Record<string, string> = {
    primary: "bg-burnt-orange active:bg-vibrant-red",
    dark: "bg-earth-dark active:bg-earth-brown",
    outline: "border-2 border-burnt-orange bg-transparent",
  };
  const textColor = variant === "outline" ? "text-burnt-orange" : "text-white";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${disabled || loading ? "opacity-60" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#FF6B35" : "#fff"} />
      ) : (
        <Text className={`font-body font-bold uppercase tracking-wide ${textColor}`}>{label}</Text>
      )}
    </Pressable>
  );
}

// --- Section header --------------------------------------------------------

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <View>
        <Heading className="text-3xl">{title}</Heading>
        <View className="mt-1 h-1 w-16 rounded-full bg-burnt-orange" />
      </View>
      {action}
    </View>
  );
}

// --- Cover art placeholder (deterministic gradient) ------------------------

export function CoverArt({ seed, size = 56, rounded = "rounded-xl", label }: { seed: string; size?: number; rounded?: string; label?: string }) {
  const [from, to] = coverGradient(seed);
  return (
    <View
      className={`${rounded} items-center justify-center overflow-hidden`}
      style={{ width: size, height: size, backgroundColor: from }}
    >
      <View className="absolute inset-0 opacity-60" style={{ backgroundColor: to }} />
      {label ? (
        <Text className="font-display text-cream" style={{ fontSize: size / 3 }}>
          {label.slice(0, 2).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

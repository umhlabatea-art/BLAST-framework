/**
 * Design-system primitives — a restrained, minimalist set built on IBM Plex
 * Mono. Paper surfaces, hairline borders, one accent. Screens compose from this
 * small vocabulary so the whole app reads as one calm system.
 */
import { Text, View, Pressable, ActivityIndicator, ViewProps, TextProps } from "react-native";
import { coverGradient } from "../theme";

// --- Typography ------------------------------------------------------------

/** Screen / section titles. */
export function Display({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-display text-ink ${className}`} {...p} />;
}
/** Sub-heads and card titles. */
export function Heading({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-medium text-ink text-base ${className}`} {...p} />;
}
/** Body / secondary copy. */
export function Body({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-body text-muted text-[13px] leading-5 ${className}`} {...p} />;
}
/** Small uppercase label for section eyebrows. */
export function Label({ className = "", ...p }: TextProps & { className?: string }) {
  return <Text className={`font-body text-[11px] uppercase tracking-[2px] text-muted ${className}`} {...p} />;
}

// --- Surfaces --------------------------------------------------------------

export function Card({ className = "", children, ...p }: ViewProps & { className?: string }) {
  return (
    <View className={`rounded-2xl border border-line bg-surface p-4 ${className}`} {...p}>
      {children}
    </View>
  );
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "accent" | "success" }) {
  const tones: Record<string, string> = {
    neutral: "bg-black/[0.04] border-line text-muted",
    accent: "bg-accent-soft border-transparent text-accent",
    success: "bg-sage/15 border-transparent text-sage",
  };
  return (
    <View className={`self-start rounded-md border px-2 py-0.5 ${tones[tone]}`}>
      <Text className={`font-body text-[11px] ${tone === "neutral" ? "text-muted" : tone === "accent" ? "text-accent" : "text-sage"}`}>
        {label}
      </Text>
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
  variant?: "primary" | "accent" | "outline";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-ink active:opacity-80",
    accent: "bg-accent active:opacity-80",
    outline: "border border-line bg-surface active:bg-black/[0.03]",
  };
  const textColor = variant === "outline" ? "text-ink" : "text-white";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center rounded-xl px-5 py-3 ${styles[variant]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#1C1917" : "#fff"} />
      ) : (
        <Text className={`font-medium text-[13px] ${textColor}`}>{label}</Text>
      )}
    </Pressable>
  );
}

// --- Section header --------------------------------------------------------

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between">
      <Display className="text-lg">{title}</Display>
      {action}
    </View>
  );
}

// --- Cover art placeholder (soft two-tone) --------------------------------

export function CoverArt({ seed, size = 52, rounded = "rounded-xl", label }: { seed: string; size?: number; rounded?: string; label?: string }) {
  const [from, to] = coverGradient(seed);
  return (
    <View className={`${rounded} items-center justify-center overflow-hidden border border-line`} style={{ width: size, height: size, backgroundColor: from }}>
      <View className="absolute inset-0 opacity-40" style={{ backgroundColor: to }} />
      {label ? (
        <Text className="font-display text-white/90" style={{ fontSize: size / 3.4 }}>
          {label.slice(0, 2).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

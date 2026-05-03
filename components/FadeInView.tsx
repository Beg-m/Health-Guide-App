import { useEffect, useRef } from "react";
import { Animated, type ViewProps, StyleSheet } from "react-native";

type Props = ViewProps & {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
};

export function FadeInView({
  children,
  style,
  delayMs = 0,
  durationMs = 380,
  ...rest
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: durationMs,
        useNativeDriver: true,
      }).start();
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs, durationMs, opacity]);

  return (
    <Animated.View style={[styles.wrap, style, { opacity }]} {...rest}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
});

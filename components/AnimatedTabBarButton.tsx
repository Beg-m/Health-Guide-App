import { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";

/** Sekme düğmesi: basışta yaylı sıçrama ve sekme geçişinde haptik */
export function AnimatedTabBarButton(props: BottomTabBarButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = (e: GestureResponderEvent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.12,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    props.onPress?.(e);
  };

  const { children, onPress: _onPress, ref: _ref, ...rest } = props;

  return (
    <Pressable {...rest} onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

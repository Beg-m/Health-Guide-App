import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Gradients, Colors } from "@/constants/theme";

type Glyph = keyof typeof Ionicons.glyphMap;

type Props = {
  focused: boolean;
  outline: Glyph;
  solid: Glyph;
};

export function GradientTabIcon({ focused, outline, solid }: Props) {
  if (focused) {
    return (
      <LinearGradient
        colors={[...Gradients.tabActive]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        <Ionicons name={solid} size={26} color="#FFFFFF" />
      </LinearGradient>
    );
  }
  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 9 }}>
      <Ionicons name={outline} size={26} color={Colors.textSecondary} />
    </View>
  );
}

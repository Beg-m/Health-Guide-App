import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

export default function RootIndex() {
  // Root flow is controlled from app/_layout.tsx.
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});

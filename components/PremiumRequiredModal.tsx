import { Modal, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors, Gradients, Radii, Shadows, ScreenPadding } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPremiumPress: () => void;
};

export function PremiumRequiredModal({ visible, onClose, onPremiumPress }: Props) {
  const handlePremium = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPremiumPress();
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Kapat" />
        <View style={styles.cardWrap} pointerEvents="box-none">
          <View style={[styles.card, Shadows.cardMedium]}>
            <LinearGradient
              colors={[...Gradients.header]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardHero}
            >
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.badge}>Premium Özellik</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={styles.title}>Bu özellik Premium üyelere özeldir</Text>
              <Text style={styles.subtitle}>
                Blog gönderisi ve yorum gibi özellikleri kullanmak için Premium&apos;a geçin.
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.85 }]}
                  onPress={handleClose}
                >
                  <Text style={styles.btnSecondaryText}>Vazgeç</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.btnPrimaryWrap, pressed && { opacity: 0.94 }]}
                  onPress={handlePremium}
                  accessibilityRole="button"
                  accessibilityLabel="Premium'a geç, hatırlatmalar sayfasına git"
                >
                  <LinearGradient
                    colors={[...Gradients.button]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnPrimary}
                  >
                    <Text style={styles.btnPrimaryText}>Premium&apos;a Geç</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: ScreenPadding,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHero: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  badge: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  actions: {
    marginTop: 22,
    gap: 12,
  },
  btnSecondary: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  btnPrimaryWrap: {
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#00A86B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { StoryItem } from "@/constants/blogStories";
import { ScreenPadding } from "@/constants/theme";

const BLOG_GREEN = "#16a34a";
const RING_SIZE = 76;
const AVATAR_INNER = 68;

type Props = {
  stories: StoryItem[];
  showTitle?: boolean;
};

export function BlogStoryReelsStrip({ stories, showTitle = true }: Props) {
  const [active, setActive] = useState<StoryItem | null>(null);

  const open = useCallback((s: StoryItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActive(s);
  }, []);

  const close = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <>
      <View style={styles.stripWrap}>
        {showTitle ? <Text style={styles.stripTitle}>Hikayeler</Text> : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripScroll}
        >
          {stories.map((item) => (
            <Pressable
              key={item.id}
              style={styles.storyItem}
              onPress={() => open(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.username} reels`}
            >
              <LinearGradient
                colors={["#22c55e", BLOG_GREEN, "#15803d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyAvatar}>
                  <Text style={styles.storyInitial} numberOfLines={1}>
                    {item.initial}
                  </Text>
                </View>
              </LinearGradient>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {item.username}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <StoryFullscreenModal story={active} onClose={close} />
    </>
  );
}

function StoryFullscreenModal({
  story,
  onClose,
}: {
  story: StoryItem | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const visible = !!story;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.modalRoot}>
        {story ? (
          <Video
            style={styles.fullVideo}
            source={{ uri: story.videoUri }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={visible}
            isLooping
            useNativeControls={false}
          />
        ) : null}

        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "transparent"]}
          style={[styles.modalTopFade, { paddingTop: insets.top + 8 }]}
        >
          <Pressable
            style={styles.modalClose}
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Kapat"
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </Pressable>
          {story ? (
            <View style={styles.modalAuthor}>
              <View style={styles.modalAvatarSmall}>
                <Text style={styles.modalInitial}>{story.initial}</Text>
              </View>
              <Text style={styles.modalUsername}>{story.username}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const styles = StyleSheet.create({
  stripWrap: {
    marginBottom: 16,
    marginHorizontal: -ScreenPadding,
  },
  stripTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    paddingHorizontal: ScreenPadding,
  },
  stripScroll: {
    paddingHorizontal: ScreenPadding,
    gap: 14,
    alignItems: "flex-start",
    paddingBottom: 4,
  },
  storyItem: {
    alignItems: "center",
    width: RING_SIZE + 8,
  },
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatar: {
    width: AVATAR_INNER,
    height: AVATAR_INNER,
    borderRadius: AVATAR_INNER / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  storyInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: BLOG_GREEN,
    maxWidth: AVATAR_INNER - 8,
  },
  storyUsername: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    maxWidth: RING_SIZE + 12,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullVideo: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  modalTopFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalClose: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAuthor: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalInitial: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalUsername: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

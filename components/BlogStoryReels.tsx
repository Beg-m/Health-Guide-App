import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Animated,
  PanResponder,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ScreenPadding } from "@/constants/theme";
import type { Story, StoryUserGroup } from "@/lib/storiesStorage";
import { formatStoryTime } from "@/lib/storiesStorage";

const BLOG_GREEN = "#16a34a";
const RING_SIZE = 76;
const AVATAR_INNER = 68;
const STORY_DURATION_MS = 5000;
const SWIPE_THRESHOLD = 40;

function defer(fn: () => void) {
  queueMicrotask(fn);
}

function userInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export type StoryStripPlaceholder = {
  id: string;
  displayName: string;
  avatarColor: string;
};

type Props = {
  groups: StoryUserGroup[];
  placeholders?: StoryStripPlaceholder[];
  onPlaceholderPress?: (item: StoryStripPlaceholder) => void;
  currentUserId?: string | null;
  onAddStoryPress?: () => void;
};

export function BlogStoryReelsStrip({
  groups,
  placeholders = [],
  onPlaceholderPress,
  currentUserId,
  onAddStoryPress,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startGroupIndex, setStartGroupIndex] = useState(0);

  const openGroup = useCallback(
    (group: StoryUserGroup) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const idx = groups.findIndex((g) => g.uid === group.uid);
      setStartGroupIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
    },
    [groups]
  );

  const close = useCallback(() => setViewerOpen(false), []);

  const sortedGroups = useMemo(() => {
    if (!currentUserId) return groups;
    const mine = groups.filter((g) => g.uid === currentUserId);
    const others = groups.filter((g) => g.uid !== currentUserId);
    return [...mine, ...others];
  }, [groups, currentUserId]);

  return (
    <>
      <View style={styles.stripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripScroll}
        >
          {onAddStoryPress ? (
            <Pressable
              style={styles.addStoryCell}
              onPress={onAddStoryPress}
              accessibilityRole="button"
              accessibilityLabel="Hikaye ekle"
            >
              <View style={styles.addStoryRing}>
                <Text style={styles.addStoryPlus}>+</Text>
              </View>
              <Text style={styles.addStoryLabel}>Hikayen</Text>
            </Pressable>
          ) : null}

          {sortedGroups.map((group) => (
            <Pressable
              key={group.uid}
              style={styles.storyItem}
              onPress={() => openGroup(group)}
              accessibilityRole="button"
              accessibilityLabel={`${group.displayName} hikayesi`}
            >
              <LinearGradient
                colors={["#f72585", "#7209b7", "#4361ee"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyRing}
              >
                <View style={styles.storyAvatar}>
                  {group.photoURL ? (
                    <Image source={{ uri: group.photoURL }} style={styles.storyAvatarImg} />
                  ) : (
                    <Text style={styles.storyInitial} numberOfLines={1}>
                      {userInitial(group.displayName)}
                    </Text>
                  )}
                </View>
              </LinearGradient>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {group.uid === currentUserId ? "Sen" : group.displayName.split(" ")[0]}
              </Text>
            </Pressable>
          ))}

          {placeholders.map((item) => (
            <Pressable
              key={item.id}
              style={styles.storyItem}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onPlaceholderPress?.(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.displayName} — örnek hikaye`}
            >
              <View
                style={[
                  styles.placeholderRing,
                  { backgroundColor: item.avatarColor },
                ]}
              >
                <Text style={styles.placeholderInitial} numberOfLines={1}>
                  {userInitial(item.displayName)}
                </Text>
              </View>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {item.displayName.split(" ")[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <StoryViewerModal
        key={viewerOpen ? `story-${startGroupIndex}` : "story-closed"}
        visible={viewerOpen}
        groups={groups}
        initialGroupIndex={startGroupIndex}
        onClose={close}
      />
    </>
  );
}

type ViewerProps = {
  visible: boolean;
  groups: StoryUserGroup[];
  initialGroupIndex: number;
  onClose: () => void;
};

function StoryViewerModal({
  visible,
  groups,
  initialGroupIndex,
  onClose,
}: ViewerProps) {
  const insets = useSafeAreaInsets();
  const safeGroupIndex = Math.min(
    Math.max(0, initialGroupIndex),
    Math.max(0, groups.length - 1)
  );
  const [groupIndex, setGroupIndex] = useState(safeGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const groupIndexRef = useRef(safeGroupIndex);
  const storyIndexRef = useRef(0);

  const currentGroup = groups[groupIndex];
  const currentStory: Story | undefined = currentGroup?.stories[storyIndex];
  const storyCount = currentGroup?.stories.length ?? 0;

  useEffect(() => {
    groupIndexRef.current = groupIndex;
    storyIndexRef.current = storyIndex;
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (!visible) return;
    setGroupIndex(safeGroupIndex);
    setStoryIndex(0);
  }, [visible, safeGroupIndex]);

  const goNext = useCallback(() => {
    progress.stopAnimation();
    const g = groupIndexRef.current;
    const s = storyIndexRef.current;
    const group = groups[g];
    if (!group) {
      defer(onClose);
      return;
    }
    if (s < group.stories.length - 1) {
      setStoryIndex(s + 1);
      return;
    }
    if (g < groups.length - 1) {
      setGroupIndex(g + 1);
      setStoryIndex(0);
      return;
    }
    defer(onClose);
  }, [groups, onClose, progress]);

  const goPrev = useCallback(() => {
    progress.stopAnimation();
    const g = groupIndexRef.current;
    const s = storyIndexRef.current;
    if (s > 0) {
      setStoryIndex(s - 1);
      return;
    }
    if (g > 0) {
      const prevGroup = groups[g - 1];
      setGroupIndex(g - 1);
      setStoryIndex(Math.max(0, prevGroup.stories.length - 1));
    }
  }, [groups, progress]);

  useEffect(() => {
    if (!visible || !currentStory) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    const duration =
      currentStory.mediaType === "video" ? STORY_DURATION_MS * 2 : STORY_DURATION_MS;
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (!finished) return;
      goNext();
    });

    return () => anim.stop();
  }, [visible, groupIndex, storyIndex, currentStory?.id, goNext, progress]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 12 || g.dy > 12,
        onPanResponderRelease: (_, g) => {
          if (g.dy > 80 && g.dy > Math.abs(g.dx)) {
            defer(onClose);
            return;
          }
          if (g.dx <= -SWIPE_THRESHOLD) {
            goNext();
            return;
          }
          if (g.dx >= SWIPE_THRESHOLD) {
            goPrev();
            return;
          }
          if (Math.abs(g.dx) < 12 && Math.abs(g.dy) < 12) {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            goNext();
          }
        },
      }),
    [goNext, goPrev, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.viewerRoot} {...panResponder.panHandlers}>
        {currentStory ? (
          currentStory.mediaType === "video" ? (
            <Video
              source={{ uri: currentStory.mediaURL }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay={visible}
              isLooping={false}
              useNativeControls={false}
            />
          ) : (
            <Image
              source={{ uri: currentStory.mediaURL }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )
        ) : null}

        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.65)"]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={[styles.topChrome, { paddingTop: insets.top + 8 }]}>
          <View style={styles.progressRow}>
            {Array.from({ length: storyCount }).map((_, i) => (
              <View key={i} style={styles.progressTrack}>
                {i < storyIndex ? <View style={styles.progressFillFull} /> : null}
                {i === storyIndex ? (
                  <Animated.View
                    style={[
                      styles.progressFillAnim,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.topRow}>
            <View style={styles.viewerUserRow}>
              <View style={styles.viewerAvatar}>
                {currentGroup?.photoURL ? (
                  <Image
                    source={{ uri: currentGroup.photoURL }}
                    style={styles.viewerAvatarImg}
                  />
                ) : (
                  <Text style={styles.viewerAvatarInitial}>
                    {userInitial(currentGroup?.displayName ?? "?")}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.viewerName}>{currentGroup?.displayName ?? ""}</Text>
                <Text style={styles.viewerTime}>
                  {currentStory ? formatStoryTime(currentStory.createdAt) : ""}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => defer(onClose)} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {currentStory?.caption ? (
          <View style={[styles.captionWrap, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.captionText}>{currentStory.caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  stripWrap: {
    marginBottom: 16,
    marginHorizontal: -ScreenPadding,
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
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  storyAvatarImg: {
    width: AVATAR_INNER,
    height: AVATAR_INNER,
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
  addStoryCell: {
    alignItems: "center",
    width: RING_SIZE + 8,
    marginRight: 2,
  },
  addStoryRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: BLOG_GREEN,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  addStoryPlus: {
    fontSize: 34,
    fontWeight: "300",
    color: BLOG_GREEN,
    lineHeight: 38,
  },
  addStoryLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    maxWidth: RING_SIZE + 12,
  },
  placeholderRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  placeholderInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    maxWidth: RING_SIZE - 12,
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressFillFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  progressFillAnim: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  viewerUserRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  viewerAvatarImg: {
    width: 36,
    height: 36,
  },
  viewerAvatarInitial: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  viewerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  viewerTime: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  captionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    zIndex: 15,
  },
  captionText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
});

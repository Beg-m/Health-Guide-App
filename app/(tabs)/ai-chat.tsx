import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { generateGeminiReply, type GeminiContent } from "@/lib/gemini";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

const EXAMPLE_QUESTION = "Bu ilaçları birlikte kullanabilir miyim?";

function messagesToGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  const out: GeminiContent[] = [];
  let i = 0;
  while (i < messages.length && messages[i].role === "assistant") {
    i += 1;
  }
  for (; i < messages.length; i += 1) {
    const m = messages[i];
    out.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    });
  }
  return out;
}

const assistantMarkdownStyles = StyleSheet.create({
  body: { color: Colors.text },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  text: { color: Colors.text },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  heading3: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
    marginTop: 4,
  },
  heading4: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  link: { color: Colors.primary, textDecorationLine: "underline" },
  blockquote: {
    backgroundColor: Colors.card,
    borderLeftColor: Colors.primary,
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: "#E8ECEF",
    color: Colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    borderWidth: 0,
  },
  fence: {
    backgroundColor: "#EEF1F3",
    color: Colors.text,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 13,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  hr: { backgroundColor: Colors.border, height: 1, marginVertical: 12 },
});

const userMarkdownStyles = StyleSheet.create({
  body: { color: "#FFFFFF" },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },
  text: { color: "#FFFFFF" },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 4,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    marginTop: 4,
  },
  heading3: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    marginTop: 4,
  },
  heading4: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  link: { color: "#E8FFF5", textDecorationLine: "underline" },
  strong: { color: "#FFFFFF", fontWeight: "700" },
  em: { color: "#FFFFFF", fontStyle: "italic" },
  blockquote: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderLeftColor: "rgba(255,255,255,0.5)",
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 6,
  },
  code_inline: {
    backgroundColor: "rgba(0,0,0,0.15)",
    color: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    borderWidth: 0,
  },
  fence: {
    backgroundColor: "rgba(0,0,0,0.2)",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 13,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  hr: { backgroundColor: "rgba(255,255,255,0.35)", height: 1, marginVertical: 12 },
});

function ChatMessageBody({
  text,
  role,
}: {
  text: string;
  role: ChatRole;
}) {
  const mdStyle = role === "user" ? userMarkdownStyles : assistantMarkdownStyles;
  return (
    <Markdown style={mdStyle} mergeStyle>
      {text}
    </Markdown>
  );
}

export default function AiChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      text: "Merhaba, Health Guide AI asistanıyım. İlaçlar, dozaj veya genel sağlık konularında sorularınızı yazabilirsiniz.",
    },
  ]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const contents = messagesToGeminiContents(nextMessages);
      const replyText = await generateGeminiReply(contents);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        text: replyText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        text: `Üzgünüm, yanıt alınamadı.\n\n${message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>AI Asistan</Text>
            <Text style={styles.headerSubtitle}>Sağlık rehberiniz</Text>
          </View>
          <View style={styles.headerRight} />
        </LinearGradient>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleRow,
                m.role === "user" ? styles.bubbleRowUser : styles.bubbleRowAssistant,
              ]}
            >
              {m.role === "user" ? (
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.bubbleUser]}
                >
                  <ChatMessageBody text={m.text} role={m.role} />
                </LinearGradient>
              ) : (
                <View style={[styles.bubble, styles.bubbleAssistant, Shadows.card]}>
                  <ChatMessageBody text={m.text} role={m.role} />
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
              <View
                style={[styles.bubble, styles.bubbleAssistant, styles.loadingBubble, Shadows.card]}
              >
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Yanıt yazılıyor…</Text>
              </View>
            </View>
          )}

          <Pressable
            style={styles.exampleChip}
            onPress={() => setInput(EXAMPLE_QUESTION)}
            disabled={loading}
          >
            <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
            <Text style={styles.exampleChipText}>{EXAMPLE_QUESTION}</Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.inputBar, Shadows.tabBarTop]}>
          <TextInput
            style={styles.input}
            placeholder="Mesajınızı yazın…"
            placeholderTextColor={Colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            editable={!loading}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backBtn: {
    padding: 4,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  headerRight: { width: 40 },
  chat: { flex: 1 },
  chatContent: {
    padding: ScreenPadding,
    paddingBottom: 24,
  },
  bubbleRow: {
    marginBottom: 12,
    maxWidth: "100%",
  },
  bubbleRowUser: {
    alignItems: "flex-end",
  },
  bubbleRowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  exampleChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: `${Colors.primary}14`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.primary}44`,
    ...Shadows.card,
  },
  exampleChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
    flexShrink: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});

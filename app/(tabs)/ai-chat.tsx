import { useState, useRef, useEffect, useCallback } from "react";
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
  Alert,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Colors, Shadows, ScreenPadding } from "@/constants/theme";
import { generateGeminiReply, type GeminiContent } from "@/lib/gemini";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Merhaba, Health Guide AI asistanıyım. İlaçlar, dozaj veya genel sağlık konularında sorularınızı yazabilirsiniz.",
};

function messagesToGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));
}

export default function AiChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);

  const getUserId = () => auth.currentUser?.uid ?? null;

  // Sidebar aç/kapat animasyonu
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sidebarOpen ? 0 : -280,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, slideAnim]);

  // Konuşma listesini yükle
  const loadConversations = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const ref = collection(db, "users", uid, "conversations");
      const snap = await getDocs(query(ref, orderBy("updatedAt", "desc")));
      const list: Conversation[] = [];
      for (const d of snap.docs) {
        const title = d.data().title ?? "Yeni Sohbet";
        // Boş sohbetleri listede gösterme
        const msgsRef = collection(db, "users", uid, "conversations", d.id, "messages");
        const msgsSnap = await getDocs(msgsRef);
        if (msgsSnap.size > 0 || title !== "Yeni Sohbet") {
          list.push({
            id: d.id,
            title,
            updatedAt: d.data().updatedAt?.toMillis?.() ?? 0,
          });
        }
      }
      setConversations(list);
    } catch {}
  }, []);

  // Konuşma mesajlarını yükle
  const loadMessages = useCallback(async (convId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const ref = collection(db, "users", uid, "conversations", convId, "messages");
      const snap = await getDocs(query(ref, orderBy("createdAt", "asc")));
      if (snap.docs.length === 0) {
        setMessages([WELCOME_MSG]);
        return;
      }
      const loaded: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        role: d.data().role as ChatRole,
        text: d.data().text as string,
      }));
      setMessages(loaded);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations])
  );

  // Yeni konuşma oluştur
  const createNewConversation = async (): Promise<string> => {
    const uid = getUserId();
    if (!uid) return "local";
    const ref = collection(db, "users", uid, "conversations");
    const docRef = await addDoc(ref, {
      title: "Yeni Sohbet",
      updatedAt: serverTimestamp(),
    });
    await loadConversations();
    return docRef.id;
  };

  // Konuşma seç
  const selectConversation = async (conv: Conversation) => {
    setActiveConvId(conv.id);
    setSidebarOpen(false);
    await loadMessages(conv.id);
  };

  // Yeni sohbet
  const startNewChat = () => {
    Alert.alert(
      "Yeni Sohbet",
      "Yeni bir sohbet başlatmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Yeni Sohbet",
          onPress: async () => {
            const id = await createNewConversation();
            setActiveConvId(id);
            setMessages([WELCOME_MSG]);
            setSidebarOpen(false);
          },
        },
      ]
    );
  };

  // Konuşma sil
  const deleteConversation = async (convId: string) => {
    const uid = getUserId();
    if (!uid) return;
    Alert.alert("Sohbeti Sil", "Bu sohbet silinecek. Emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const msgsRef = collection(db, "users", uid, "conversations", convId, "messages");
            const snap = await getDocs(msgsRef);
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
            await deleteDoc(doc(db, "users", uid, "conversations", convId));
            if (activeConvId === convId) {
              setActiveConvId(null);
              setMessages([WELCOME_MSG]);
            }
            await loadConversations();
          } catch {}
        },
      },
    ]);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    let convId = activeConvId;
    if (!convId) {
      convId = await createNewConversation();
      setActiveConvId(convId);
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
    };

    const nextMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    setMessages([WELCOME_MSG, ...nextMessages]);
    setInput("");
    setLoading(true);

    // Mesajı kaydet
    const uid = getUserId();
    if (uid && convId) {
      try {
        await addDoc(
          collection(db, "users", uid, "conversations", convId, "messages"),
          { role: "user", text: trimmed, createdAt: serverTimestamp() }
        );
        // Konuşma başlığını ilk mesajdan al
        if (nextMessages.length === 1) {
          await setDoc(
            doc(db, "users", uid, "conversations", convId),
            { title: trimmed.slice(0, 40), updatedAt: serverTimestamp() },
            { merge: true }
          );
        } else {
          await setDoc(
            doc(db, "users", uid, "conversations", convId),
            { updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch {}
    }

    try {
      const contents = messagesToGeminiContents([...nextMessages]);
      const replyText = await generateGeminiReply(contents);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        text: replyText,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Asistan mesajını kaydet
      if (uid && convId) {
        try {
          await addDoc(
            collection(db, "users", uid, "conversations", convId, "messages"),
            { role: "assistant", text: replyText, createdAt: serverTimestamp() }
          );
        } catch {}
      }
      await loadConversations();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          text: `Üzgünüm, yanıt alınamadı.\n\n${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={() => setSidebarOpen((v) => !v)} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="menu" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>AI Asistan</Text>
            <Text style={styles.headerSubtitle}>Sağlık rehberiniz</Text>
          </View>
          <Pressable onPress={() => void startNewChat()} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </Pressable>
        </LinearGradient>

        {/* Ana içerik */}
        <View style={{ flex: 1 }}>
          {/* Chat */}
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
                    style={[styles.bubble, styles.bubbleUser]}
                  >
                    <Text style={{ color: "#fff", fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bubble, styles.bubbleAssistant, Shadows.card]}>
                    <Markdown style={assistantMarkdownStyles} mergeStyle>
                      {m.text}
                    </Markdown>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAssistant,
                    { flexDirection: "row", gap: 10 },
                    Shadows.card,
                  ]}
                >
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
                    Yanıt yazılıyor…
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
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
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.45 }]}
              onPress={() => void send()}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <TouchableWithoutFeedback onPress={() => setSidebarOpen(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Sohbetler</Text>
              <Pressable onPress={() => void startNewChat()} style={styles.newChatBtn}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.newChatBtnText}>Yeni</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {conversations.length === 0 ? (
                <View style={styles.sidebarEmpty}>
                  <Ionicons name="chatbubbles-outline" size={40} color={Colors.border} />
                  <Text style={styles.sidebarEmptyText}>Henüz sohbet yok</Text>
                </View>
              ) : (
                conversations.map((conv) => (
                  <Pressable
                    key={conv.id}
                    style={[
                      styles.convItem,
                      activeConvId === conv.id && styles.convItemActive,
                    ]}
                    onPress={() => void selectConversation(conv)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={activeConvId === conv.id ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.convTitle,
                        activeConvId === conv.id && { color: Colors.primary, fontWeight: "700" },
                      ]}
                      numberOfLines={2}
                    >
                      {conv.title}
                    </Text>
                    <Pressable
                      onPress={() => void deleteConversation(conv.id)}
                      hitSlop={8}
                      style={styles.convDeleteBtn}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const assistantMarkdownStyles = StyleSheet.create({
  body: { color: Colors.text },
  paragraph: { marginTop: 0, marginBottom: 10, color: Colors.text, fontSize: 15, lineHeight: 22 },
  text: { color: Colors.text },
  heading1: { fontSize: 22, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  heading2: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 6 },
  strong: { fontWeight: "700", color: Colors.text },
  link: { color: Colors.primary },
  bullet_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerBtn: { padding: 4, width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  chat: { flex: 1 },
  chatContent: { padding: ScreenPadding, paddingBottom: 24 },
  bubbleRow: { marginBottom: 12, maxWidth: "100%" },
  bubbleRowUser: { alignItems: "flex-end" },
  bubbleRowAssistant: { alignItems: "flex-start" },
  bubble: { maxWidth: "88%", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 10,
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sidebarTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  newChatBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  sidebarEmpty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  sidebarEmptyText: { color: Colors.textSecondary, fontSize: 14 },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convItemActive: { backgroundColor: `${Colors.primary}10` },
  convTitle: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 18 },
  convDeleteBtn: { padding: 4 },
});

import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { Colors, ScreenPadding, Shadows } from "@/constants/theme";
import {
  Reminder,
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  generateId,
  REMINDER_COLORS,
  DAY_OPTIONS,
} from "@/lib/reminderStorage";
import {
  scheduleReminderNotification,
  cancelNotification,
} from "@/lib/notifications";

type ReminderFormState = {
  medicineName: string;
  dosage: string;
  times: string[];
  days: string[];
  startDate: string;
  endDate: string;
  note: string;
  color: string;
};

const EMPTY_FORM: ReminderFormState = {
  medicineName: "",
  dosage: "",
  times: ["08:00"],
  days: ["Her gün"],
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  note: "",
  color: REMINDER_COLORS[0],
};

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormState>(EMPTY_FORM);
  const [newTime, setNewTime] = useState("08:00");

  useFocusEffect(
    useCallback(() => {
      void getReminders().then(setReminders);
    }, [])
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNewTime("08:00");
    setModalVisible(true);
  };

  const openEdit = (r: Reminder) => {
    setEditingId(r.id);
    setForm({
      medicineName: r.medicineName,
      dosage: r.dosage,
      times: r.times,
      days: r.days,
      startDate: r.startDate,
      endDate: r.endDate ?? "",
      note: r.note ?? "",
      color: r.color,
    });
    setNewTime("08:00");
    setModalVisible(true);
  };

  const onSave = async () => {
    console.log("[Reminders] onSave çağrıldı, form:", form.medicineName, form.times);

    if (!form.medicineName.trim()) {
      Alert.alert("Hata", "İlaç adı boş olamaz.");
      return;
    }
    if (form.times.length === 0) {
      Alert.alert("Hata", "En az bir saat ekleyin.");
      return;
    }

    let reminderId = editingId ?? "";
    try {
    if (editingId) {
      const existing = reminders.find((r) => r.id === editingId);
      const updated: Reminder = {
        id: editingId,
        medicineName: form.medicineName.trim(),
        dosage: form.dosage.trim(),
        times: form.times,
        days: form.days,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        note: form.note.trim() || undefined,
        color: form.color,
        active: existing?.active ?? true,
        createdAt: existing?.createdAt,
      };
      await updateReminder(updated);
      reminderId = editingId;
    } else {
      const r: Reminder = {
        id: generateId(),
        medicineName: form.medicineName.trim(),
        dosage: form.dosage.trim(),
        times: form.times,
        days: form.days,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        note: form.note.trim() || undefined,
        color: form.color,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await addReminder(r);
      reminderId = r.id;
    }
    const updated = await getReminders();
    setReminders(updated);

    if (Platform.OS !== "web") {
      const currentStatus = await Notifications.getPermissionsAsync();
      console.log("[Reminders] Bildirim izin durumu:", currentStatus.status);

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Bildirim İzni",
          "İlaç hatırlatmaları için bildirim iznine ihtiyacımız var. Lütfen ayarlardan izin verin.",
          [{ text: "Tamam" }]
        );
      }

      for (const time of form.times) {
        const [hourStr, minuteStr] = time.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        await scheduleReminderNotification(
          form.medicineName,
          form.dosage,
          hour,
          minute,
          `reminder-${reminderId}-${time}`
        );
      }
    }

    setModalVisible(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        "Kayıt hatası",
        msg.includes("permission") || msg.includes("PERMISSION")
          ? "Firestore'a yazılamadı. Güvenlik kurallarını kontrol edin."
          : `Hatırlatıcı kaydedilemedi: ${msg}`
      );
    }
  };

  const onDelete = (id: string) => {
    Alert.alert("Sil", "Bu hatırlatıcıyı silmek istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteReminder(id);
          setReminders(await getReminders());
        },
      },
    ]);
  };

  const onToggleActive = async (r: Reminder) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (r.active && Platform.OS !== "web") {
      for (const time of r.times) {
        await cancelNotification(`reminder-${r.id}-${time}`);
      }
    }
    await updateReminder({ ...r, active: !r.active });
    setReminders(await getReminders());
  };

  const addTime = () => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(newTime)) {
      Alert.alert("Hata", "Saat formatı HH:MM olmalı. Örn: 08:00");
      return;
    }
    if (form.times.includes(newTime)) {
      Alert.alert("Hata", "Bu saat zaten ekli.");
      return;
    }
    setForm((f) => ({ ...f, times: [...f.times, newTime].sort() }));
  };

  const removeTime = (t: string) => {
    setForm((f) => ({ ...f, times: f.times.filter((x) => x !== t) }));
  };

  const toggleDay = (day: string) => {
    setForm((f) => {
      if (day === "Her gün") return { ...f, days: ["Her gün"] };
      const withoutAll = f.days.filter((d) => d !== "Her gün");
      const has = withoutAll.includes(day);
      const next = has ? withoutAll.filter((d) => d !== day) : [...withoutAll, day];
      return { ...f, days: next.length === 0 ? ["Her gün"] : next };
    });
  };

  const activeCount = reminders.filter((r) => r.active).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>İlaç Takibi</Text>
          <Text style={styles.subtitle}>
            {activeCount > 0 ? `${activeCount} aktif hatırlatıcı` : "Henüz hatırlatıcı yok"}
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {reminders.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Ionicons name="alarm-outline" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Henüz hatırlatıcı yok</Text>
          <Text style={styles.emptySub}>
            İlaçlarınızı düzenli almak için hatırlatıcı ekleyin
          </Text>
          <Pressable style={styles.emptyAddBtn} onPress={openAdd}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.emptyAddBtnText}>Hatırlatıcı Ekle</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {reminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onEdit={() => openEdit(r)}
              onDelete={() => onDelete(r.id)}
              onToggle={() => void onToggleActive(r)}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <Text style={styles.modalCancel}>Vazgeç</Text>
              </Pressable>
              <Text style={styles.modalTitle}>
                {editingId ? "Düzenle" : "Yeni Hatırlatıcı"}
              </Text>
              <Pressable onPress={() => void onSave()} hitSlop={12}>
                <Text style={styles.modalSave}>Kaydet</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Renk Seç */}
              <Text style={styles.label}>Renk</Text>
              <View style={styles.colorRow}>
                {REMINDER_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      form.color === c && styles.colorDotSelected,
                    ]}
                  >
                    {form.color === c && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* İlaç Adı */}
              <Text style={styles.label}>İlaç Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Parol 500mg"
                placeholderTextColor={Colors.textSecondary}
                value={form.medicineName}
                onChangeText={(t) => setForm((f) => ({ ...f, medicineName: t }))}
              />

              {/* Doz */}
              <Text style={styles.label}>Doz</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 1 tablet, 5ml"
                placeholderTextColor={Colors.textSecondary}
                value={form.dosage}
                onChangeText={(t) => setForm((f) => ({ ...f, dosage: t }))}
              />

              {/* Saatler */}
              <Text style={styles.label}>Hatırlatma Saatleri</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="08:00"
                  placeholderTextColor={Colors.textSecondary}
                  value={newTime}
                  onChangeText={setNewTime}
                  keyboardType="numbers-and-punctuation"
                />
                <Pressable style={styles.addTimeBtn} onPress={addTime}>
                  <Ionicons name="add" size={22} color="#fff" />
                </Pressable>
              </View>
              <View style={styles.timeChips}>
                {form.times.map((t) => (
                  <View key={t} style={[styles.timeChip, { backgroundColor: form.color }]}>
                    <Ionicons name="alarm-outline" size={14} color="#fff" />
                    <Text style={styles.timeChipText}>{t}</Text>
                    <Pressable onPress={() => removeTime(t)} hitSlop={8}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>

              {/* Günler */}
              <Text style={styles.label}>Günler</Text>
              <View style={styles.dayChips}>
                {DAY_OPTIONS.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayChip,
                      form.days.includes(day) && {
                        backgroundColor: form.color,
                        borderColor: form.color,
                      },
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        form.days.includes(day) && { color: "#fff" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Başlangıç Tarihi */}
              <Text style={styles.label}>Başlangıç Tarihi</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-01-01"
                placeholderTextColor={Colors.textSecondary}
                value={form.startDate}
                onChangeText={(t) => setForm((f) => ({ ...f, startDate: t }))}
              />

              {/* Bitiş Tarihi */}
              <Text style={styles.label}>Bitiş Tarihi (opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-01-30"
                placeholderTextColor={Colors.textSecondary}
                value={form.endDate}
                onChangeText={(t) => setForm((f) => ({ ...f, endDate: t }))}
              />

              {/* Not */}
              <Text style={styles.label}>Not (opsiyonel)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="Yemekten sonra al..."
                placeholderTextColor={Colors.textSecondary}
                value={form.note}
                onChangeText={(t) => setForm((f) => ({ ...f, note: t }))}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  onToggle,
}: {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.card, Shadows.card, !reminder.active && { opacity: 0.55 }]}>
      {/* Sol renk şeridi */}
      <View style={[styles.cardAccent, { backgroundColor: reminder.color }]} />

      <View style={styles.cardContent}>
        {/* Üst satır */}
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIconWrap, { backgroundColor: `${reminder.color}20` }]}>
            <Ionicons name="medical" size={22} color={reminder.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{reminder.medicineName}</Text>
            {reminder.dosage ? <Text style={styles.cardDosage}>{reminder.dosage}</Text> : null}
          </View>
          <Switch
            value={reminder.active}
            onValueChange={onToggle}
            trackColor={{ false: Colors.border, true: reminder.color }}
            thumbColor={Platform.OS === "android" ? "#fff" : undefined}
          />
        </View>

        {/* Saatler */}
        <View style={styles.cardTimesRow}>
          {reminder.times.map((t) => (
            <View
              key={t}
              style={[
                styles.cardTimeChip,
                {
                  backgroundColor: `${reminder.color}18`,
                  borderColor: `${reminder.color}40`,
                },
              ]}
            >
              <Ionicons name="alarm-outline" size={12} color={reminder.color} />
              <Text style={[styles.cardTimeText, { color: reminder.color }]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Günler */}
        <Text style={styles.cardDays}>{reminder.days.join(", ")}</Text>

        {/* Tarihler */}
        <Text style={styles.cardDates}>
          {reminder.startDate}
          {reminder.endDate ? ` → ${reminder.endDate}` : ""}
        </Text>

        {/* Not */}
        {reminder.note ? <Text style={styles.cardNote}>📝 {reminder.note}</Text> : null}

        {/* Alt butonlar */}
        <View style={styles.cardActions}>
          <Pressable style={styles.cardEditBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={styles.cardEditBtnText}>Düzenle</Text>
          </Pressable>
          <Pressable style={styles.cardDeleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.cardDeleteBtnText}>Sil</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  emptyAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  list: { paddingHorizontal: ScreenPadding, paddingTop: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardAccent: { width: 5 },
  cardContent: { flex: 1, padding: 14, gap: 8 },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  cardDosage: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  cardTimesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cardTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  cardTimeText: { fontSize: 13, fontWeight: "600" },
  cardDays: { fontSize: 13, color: Colors.textSecondary },
  cardDates: { fontSize: 12, color: Colors.textSecondary },
  cardNote: { fontSize: 13, color: Colors.textSecondary, fontStyle: "italic" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  cardEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.primary}12`,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardEditBtnText: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  cardDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardDeleteBtnText: { fontSize: 13, fontWeight: "600", color: "#ef4444" },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  modalCancel: { fontSize: 16, color: Colors.textSecondary },
  modalSave: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  modalContent: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: 40,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.card,
    marginBottom: 4,
  },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff", transform: [{ scale: 1.2 }] },
  timeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  addTimeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  timeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  timeChipText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  dayChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  dayChip: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dayChipText: { fontSize: 13, fontWeight: "600", color: Colors.text },
});

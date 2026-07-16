import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { resolveIngredientIcon } from "@/helpers/utils/icons";
import type { Ingredient } from "@/types/ingredient";

const UNITS = ["g", "kg", "ml", "l", "pieces", "tbsp", "tsp", "cups"];
const CATEGORIES = ["Fruits", "Vegetables", "Protein", "Dairy", "Other"];

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (ingredient: Ingredient) => void;
  initial?: Ingredient;
};

export function IngredientFormModal({ visible, onClose, onSave, initial }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState("Other");

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      const rawQty = initial?.quantity ?? "";
      setQuantity(rawQty.replace(/[^0-9.]/g, ""));
      setUnit(rawQty.replace(/^[0-9.]+\s*/, "").trim() || "g");
      setExpiresAt(initial?.expiresAt ? new Date(initial.expiresAt) : null);
      setCategory(initial?.category ?? "Other");
      setShowDatePicker(false);
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an ingredient name.");
      return;
    }
    const trimmed = name.trim().toLowerCase();
    const ingredient: Ingredient = {
      id: initial?.id ?? generateId(),
      name: trimmed,
      quantity: quantity ? `${quantity} ${unit}` : unit,
      expiresAt: expiresAt ? toISODate(expiresAt) : undefined,
      icon: initial?.icon ?? resolveIngredientIcon(trimmed),
      category,
    };
    onSave(ingredient);
    onClose();
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setExpiresAt(selectedDate);
  };

  const minDate = new Date();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View className="bg-background rounded-t-3xl px-5 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-5">
            <AppText className="text-[18px] font-bold text-foreground">
              {isEdit ? "Edit ingredient" : "Add ingredient"}
            </AppText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-4">
              <View>
                <AppText className="text-[13px] font-medium text-foreground mb-1">Name *</AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. chicken, tomato..."
                  className="rounded-xl border px-4 py-3 text-[15px]"
                  style={{ borderColor: colors.border, backgroundColor: colors.white }}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <AppText className="text-[13px] font-medium text-foreground mb-1">
                  Quantity & unit
                </AppText>
                <View className="flex-row gap-2">
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="500"
                    keyboardType="decimal-pad"
                    className="rounded-xl border px-4 py-3 text-[15px]"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.white,
                      width: 90,
                    }}
                    placeholderTextColor={colors.mutedText}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, alignItems: "center" }}
                  >
                    {UNITS.map((u) => (
                      <Pressable
                        key={u}
                        onPress={() => setUnit(u)}
                        className="rounded-full px-3 py-2.5"
                        style={{
                          backgroundColor: unit === u ? colors.sage : colors.white,
                          borderWidth: 1,
                          borderColor: unit === u ? colors.sage : colors.border,
                        }}
                      >
                        <AppText
                          className={`text-[12px] font-medium ${unit === u ? "text-white" : "text-muted-foreground"}`}
                        >
                          {u}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View>
                <AppText className="text-[13px] font-medium text-foreground mb-1">
                  Expiry date{" "}
                  <AppText className="font-normal text-muted-foreground">(optional)</AppText>
                </AppText>

                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: colors.white,
                    borderColor: expiresAt ? colors.sage : colors.border,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={expiresAt ? colors.sage : colors.mutedText}
                  />
                  <AppText
                    className={`text-[15px] flex-1 ${expiresAt ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {expiresAt
                      ? expiresAt.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Select expiry date..."}
                  </AppText>
                  {expiresAt && (
                    <Pressable onPress={() => setExpiresAt(null)}>
                      <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                    </Pressable>
                  )}
                </Pressable>

                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    className="mt-2 rounded-2xl overflow-hidden border"
                    style={{ borderColor: colors.border }}
                  >
                    <DateTimePicker
                      value={expiresAt ?? new Date()}
                      mode="date"
                      display="inline"
                      minimumDate={minDate}
                      onChange={handleDateChange}
                      themeVariant="light"
                      accentColor={colors.sage}
                    />
                    <Pressable
                      onPress={() => setShowDatePicker(false)}
                      className="py-3 items-center border-t"
                      style={{ borderColor: colors.border, backgroundColor: colors.white }}
                    >
                      <AppText className="text-[15px] font-semibold" style={{ color: colors.sage }}>
                        Done
                      </AppText>
                    </Pressable>
                  </View>
                )}

                {showDatePicker && Platform.OS === "android" && (
                  <DateTimePicker
                    value={expiresAt ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={minDate}
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View>
                <AppText className="text-[13px] font-medium text-foreground mb-1">Category</AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className="rounded-full px-3 py-2"
                      style={{
                        backgroundColor: category === cat ? colors.sage : colors.white,
                        borderWidth: 1,
                        borderColor: category === cat ? colors.sage : colors.border,
                      }}
                    >
                      <AppText
                        className={`text-[12px] font-medium ${category === cat ? "text-white" : "text-muted-foreground"}`}
                      >
                        {cat}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <Pressable
                onPress={handleSave}
                className="rounded-2xl py-4 items-center mt-1 active:opacity-80"
                style={{ backgroundColor: colors.sage }}
              >
                <AppText className="text-[15px] font-bold text-white">
                  {isEdit ? "Save changes" : "Add to fridge"}
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

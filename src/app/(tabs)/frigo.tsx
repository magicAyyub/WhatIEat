/**
 * app/(tabs)/frigo.tsx
 * avec DateTimePicker pour la sélection de date d'expiration
 * 
 * Installation requise :
 *   npx expo install @react-native-community/datetimepicker
 */

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useFridgeStore } from "@/store";
import { useRouter } from "expo-router";
import { useProfileStore } from "@/store/profile-store";
import { useAuthStore } from "@/store/auth-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userService } from "@/services/userService";
import type { Ingredient } from "@/types/ingredient";
import { getSafeIconName } from "@/helpers/utils/icons";
import { BASE_URL } from "@/services/api";

const API_BASE = BASE_URL;
import { APP_CONFIG } from "@/config/runtime";
// Catégories chargées dynamiquement depuis la DB
const DEFAULT_CATEGORIES = ["All", "Fruits", "Vegetables", "Protein", "Dairy", "Grains"];
const UNITS      = ["g", "kg", "ml", "l", "pieces", "tbsp", "tsp", "cups"];

const MEAL_OPTIONS = [
  { key: "breakfast", label: "Breakfast", emoji: "☀️", route: "/recommend/breakfast" },
  { key: "lunch",     label: "Lunch",     emoji: "🥗", route: "/recommend/lunch"     },
  { key: "dinner",    label: "Dinner",    emoji: "🌙", route: "/recommend/dinner"    },
  { key: "snack",     label: "Snack",     emoji: "🍎", route: "/recommend/snack"     },
];

const OBJECTIVE_MAP: Record<string, string> = {
  "weight-loss": "weight_loss",
  "muscle-gain": "muscle_gain",
  "maintenance": "maintenance",
  "endurance":   "endurance",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getExpiresIn(expiresAt?: string): number | undefined {
  if (!expiresAt) return undefined;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp   = new Date(expiresAt); exp.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((exp.getTime() - today.getTime()) / 86400000));
}

function formatExpiryLabel(expiresAt?: string, expiresIn?: number): string | null {
  if (expiresAt === undefined || expiresIn === undefined) return null;
  if (expiresIn === 0) return "Expires today";
  if (expiresIn === 1) return "Expires tomorrow";
  if (expiresIn <= 7)  return `Expires in ${expiresIn}d`;
  try {
    return new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return `${expiresIn}d`; }
}

function expiryColor(expiresIn?: number): string {
  if (expiresIn === undefined) return colors.mutedText;
  if (expiresIn <= 1)  return colors.destructive;
  if (expiresIn <= 3)  return "#EA580C";
  if (expiresIn <= 7)  return colors.macroCarbs;
  return colors.mutedText;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ── Composant ligne ingrédient ─────────────────────────────────────────────

function InventoryItemRow({ item, onDelete, onEdit }: {
  item:    Ingredient & { expiresIn?: number };
  onDelete: () => void;
  onEdit:   () => void;
}) {
  const expiryLabel = formatExpiryLabel(item.expiresAt, item.expiresIn);
  const expColor    = expiryColor(item.expiresIn);
  const isUrgent    = item.expiresIn !== undefined && item.expiresIn <= 2;

  return (
    <Pressable
      onPress={onEdit}
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mb-2 active:opacity-80"
      style={isUrgent
        ? { backgroundColor: colors.expiringBg, borderColor: colors.expiringBorder }
        : { backgroundColor: colors.white,       borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-3.5 flex-1">
        <View className="w-10 h-10 rounded-xl items-center justify-center bg-zinc-50 border border-zinc-100">
          <MaterialCommunityIcons name={getSafeIconName(item.icon) as any} size={22} color={colors.sage} />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px] font-semibold text-foreground capitalize">{item.name}</AppText>
          <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
            <AppText className="text-[13px] text-muted-foreground">{item.quantity || "1"}</AppText>
            {expiryLabel && (
              <View className="flex-row items-center gap-1">
                {isUrgent && <Ionicons name="warning" size={11} color={expColor} />}
                <AppText className="text-[12px] font-medium" style={{ color: expColor }}>
                  {expiryLabel}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={onEdit} className="w-8 h-8 rounded-full items-center justify-center bg-zinc-50 active:opacity-60">
          <Ionicons name="pencil-outline" size={15} color={colors.mutedText} />
        </Pressable>
        <Pressable onPress={onDelete} className="w-8 h-8 rounded-full items-center justify-center bg-zinc-50 active:opacity-60">
          <Ionicons name="trash-outline" size={15} color={colors.mutedText} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ── Modal ajout / édition avec calendrier ──────────────────────────────────

function IngredientFormModal({ visible, onClose, onSave, initial }: {
  visible:  boolean;
  onClose:  () => void;
  onSave:   (ingredient: Ingredient) => void;
  initial?: Ingredient;
}) {
  const isEdit = !!initial;

  const [name,           setName]           = useState("");
  const [quantity,       setQuantity]       = useState("");
  const [unit,           setUnit]           = useState("g");
  const [expiresAt,      setExpiresAt]      = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category,       setCategory]       = useState("Grains");

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      const rawQty = initial?.quantity ?? "";
      setQuantity(rawQty.replace(/[^0-9.]/g, ""));
      setUnit(rawQty.replace(/^[0-9.]+\s*/, "").trim() || "g");
      setExpiresAt(initial?.expiresAt ? new Date(initial.expiresAt) : null);
      setCategory(initial?.category ?? "Grains");
      setShowDatePicker(false);
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an ingredient name.");
      return;
    }
    const ingredient: Ingredient = {
      id:        initial?.id ?? generateId(),
      name:      name.trim().toLowerCase(),
      quantity:  quantity ? `${quantity} ${unit}` : unit,
      expiresAt: expiresAt ? toISODate(expiresAt) : undefined,
      icon:      initial?.icon ?? "food-variant",
      category,
    };
    onSave(ingredient);
    onClose();
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setExpiresAt(selectedDate);
  };

  const minDate = new Date();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
                {/* Nom */}
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

                {/* Quantité + unité */}
                <View>
                  <AppText className="text-[13px] font-medium text-foreground mb-1">Quantity & unit</AppText>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="500"
                      keyboardType="decimal-pad"
                      className="rounded-xl border px-4 py-3 text-[15px]"
                      style={{ borderColor: colors.border, backgroundColor: colors.white, width: 90 }}
                      placeholderTextColor={colors.mutedText}
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: "center" }}>
                      {UNITS.map((u) => (
                        <Pressable
                          key={u} onPress={() => setUnit(u)}
                          className="rounded-full px-3 py-2.5"
                          style={{ backgroundColor: unit === u ? colors.sage : colors.white, borderWidth: 1, borderColor: unit === u ? colors.sage : colors.border }}
                        >
                          <AppText className={`text-[12px] font-medium ${unit === u ? "text-white" : "text-muted-foreground"}`}>{u}</AppText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Date expiration : calendrier */}
                <View>
                  <AppText className="text-[13px] font-medium text-foreground mb-1">
                    Expiry date <AppText className="font-normal text-muted-foreground">(optional)</AppText>
                  </AppText>

                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                    style={{ backgroundColor: colors.white, borderColor: expiresAt ? colors.sage : colors.border }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={expiresAt ? colors.sage : colors.mutedText} />
                    <AppText className={`text-[15px] flex-1 ${expiresAt ? "text-foreground" : "text-muted-foreground"}`}>
                      {expiresAt
                        ? expiresAt.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
                        : "Select expiry date..."}
                    </AppText>
                    {expiresAt && (
                      <Pressable onPress={() => setExpiresAt(null)}>
                        <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                      </Pressable>
                    )}
                  </Pressable>

                  {/* iOS : picker inline sous le bouton */}
                  {showDatePicker && Platform.OS === "ios" && (
                    <View className="mt-2 rounded-2xl overflow-hidden border" style={{ borderColor: colors.border }}>
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
                        <AppText className="text-[15px] font-semibold" style={{ color: colors.sage }}>Done</AppText>
                      </Pressable>
                    </View>
                  )}

                  {/* Android : picker modal natif */}
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

                {/* Catégorie */}
                <View>
                  <AppText className="text-[13px] font-medium text-foreground mb-1">Category</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {DEFAULT_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <Pressable
                        key={cat} onPress={() => setCategory(cat)}
                        className="rounded-full px-3 py-2"
                        style={{ backgroundColor: category === cat ? colors.sage : colors.white, borderWidth: 1, borderColor: category === cat ? colors.sage : colors.border }}
                      >
                        <AppText className={`text-[12px] font-medium ${category === cat ? "text-white" : "text-muted-foreground"}`}>{cat}</AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Bouton */}
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

// ── Modal sélection repas ──────────────────────────────────────────────────

function MealPickerModal({ visible, onClose, onSelect, expiringCount }: {
  visible:       boolean;
  onClose:       () => void;
  onSelect:      (meal: typeof MEAL_OPTIONS[0]) => void;
  expiringCount: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View className="bg-background rounded-t-3xl px-5 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-2">
            <AppText className="text-[18px] font-bold text-foreground">Which meal?</AppText>
            <Pressable onPress={onClose}><Ionicons name="close" size={22} color={colors.mutedText} /></Pressable>
          </View>
          <AppText className="text-[14px] text-muted-foreground mb-5">
            Recipes match your calorie goal
            {expiringCount > 0 ? ` and prioritize your ${expiringCount} expiring item${expiringCount > 1 ? "s" : ""}.` : "."}
          </AppText>
          <View className="gap-3">
            {MEAL_OPTIONS.map((meal) => (
              <Pressable
                key={meal.key} onPress={() => onSelect(meal)}
                className="flex-row items-center gap-4 rounded-2xl border px-4 py-4 active:opacity-80"
                style={{ backgroundColor: colors.white, borderColor: colors.border }}
              >
                <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.sageMuted }}>
                  <AppText className="text-[22px]">{meal.emoji}</AppText>
                </View>
                <AppText className="text-[16px] font-semibold text-foreground flex-1">{meal.label}</AppText>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Modal choix ajout ──────────────────────────────────────────────────────

function AddMethodModal({ visible, onClose, onCamera, onGallery, onManual }: {
  visible:   boolean;
  onClose:   () => void;
  onCamera:  () => void;
  onGallery: () => void;
  onManual:  () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View className="bg-background rounded-t-3xl px-5 pt-5 pb-10">
          <AppText className="text-[18px] font-bold mb-4">Add ingredients</AppText>
          {[
            { icon: "camera-outline", title: "Take a photo",   sub: "Scan your fridge",    action: onCamera  },
            { icon: "images-outline", title: "Choose a photo", sub: "From your gallery",    action: onGallery },
            { icon: "create-outline", title: "Add manually",   sub: "Type name & quantity", action: onManual  },
          ].map((opt) => (
            <Pressable key={opt.title} onPress={opt.action} className="flex-row items-center gap-3 p-4 rounded-2xl mb-3 border active:opacity-80" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
              <Ionicons name={opt.icon as any} size={24} color={colors.sage} />
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold">{opt.title}</AppText>
                <AppText className="text-[13px] text-muted-foreground">{opt.sub}</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────

export default function FrigoScreen() {
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [dbCategories,    setDbCategories]    = useState<string[]>([]);
  const [search,         setSearch]         = useState("");
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [formOpen,       setFormOpen]       = useState(false);
  const [editItem,       setEditItem]       = useState<Ingredient | undefined>(undefined);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const router              = useRouter();
  const ingredients         = useFridgeStore((s) => s.ingredients);
  const addIngredients      = useFridgeStore((s) => s.addIngredients);
  const removeIngredient    = useFridgeStore((s) => s.removeIngredient);
  const setIngredients      = useFridgeStore((s) => s.setIngredients);
  const { profile }         = useProfileStore();
  const { isAuthenticated } = useAuthStore();
  const insets              = useSafeAreaInsets();

  // Sync initial supprimé : le frigo est chargé depuis la DB au login
  // via auth-store.loadFridgeFromDB()
  // Le sync se fait uniquement lors des ajouts/modifications/suppressions explicites

  const items = ingredients.map((ing) => ({
    ...ing,
    expiresIn: getExpiresIn(ing.expiresAt),
    category:  ing.category || "Other",
    icon:      ing.icon     || "food-variant",
    quantity:  ing.quantity || "1",
  }));

  const filtered = items.filter((item) => {
    const matchCat    = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const expiringSoon = filtered.filter((i) => i.expiresIn !== undefined && i.expiresIn <= 3);
  const others       = filtered
    .filter((i) => i.expiresIn === undefined || i.expiresIn > 3)
    .sort((a, b) => {
      if (!a.expiresAt && !b.expiresAt) return 0;
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return a.expiresAt.localeCompare(b.expiresAt);
    });

  const handleOpenAdd = () => { setEditItem(undefined); setMenuOpen(false); setFormOpen(true); };
  const handleOpenEdit = (item: Ingredient) => { setEditItem(item); setFormOpen(true); };

  const handleSaveIngredient = async (ingredient: Ingredient) => {
    if (editItem) {
      const updated = ingredients.map((i) => i.id === ingredient.id ? ingredient : i);
      setIngredients(updated);
      if (isAuthenticated) {
        try {
          const dbItems = await userService.getFridge();
          const found   = dbItems.find((d) => d.ingredient_name.toLowerCase() === editItem.name.toLowerCase());
          if (found) {
            const qty  = parseFloat(ingredient.quantity ?? "1") || 1;
            const unit = (ingredient.quantity ?? "").replace(/^[0-9.]+\s*/, "").trim() || "pieces";
            await userService.updateFridgeItem(found.id, { quantity: qty, unit, expires_at: ingredient.expiresAt, category: ingredient.category });
          }
        } catch (e) { console.warn("Update DB échoué:", e); }
      }
    } else {
      addIngredients([ingredient]);
      if (isAuthenticated) {
        try {
          const qty  = parseFloat(ingredient.quantity ?? "1") || 1;
          const unit = (ingredient.quantity ?? "").replace(/^[0-9.]+\s*/, "").trim() || "pieces";
          await userService.addFridgeItem({ ingredient_name: ingredient.name, quantity: qty, unit, expires_at: ingredient.expiresAt, category: ingredient.category });
        } catch (e) { console.warn("Add DB échoué:", e); }
      }
    }
  };

  const handleDelete = async (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    // Suppression locale immédiate
    removeIngredient(id);
    if (isAuthenticated && ing) {
      try {
        // L'id du store peut être l'id DB (si chargé depuis DB) ou un id local
        const dbId = parseInt(id);
        if (!isNaN(dbId)) {
          // Id numérique → vient de la DB, suppression directe
          await userService.deleteFridgeItem(dbId);
        } else {
          // Id local (généré par generateId) → cherche par nom
          const dbItems = await userService.getFridge();
          const found   = dbItems.find((d) => d.ingredient_name.toLowerCase() === ing.name.toLowerCase());
          if (found) await userService.deleteFridgeItem(found.id);
        }
      } catch (e) { console.warn("Delete DB échoué:", e); }
    }
  };

  const handleRequestRecipes = async (meal: typeof MEAL_OPTIONS[0]) => {
    setMealPickerOpen(false);
    setLoadingRecipes(true);
    try {
      const fridgeDict: Record<string, number> = {};
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        let weight = qty;
        if (item.expiresIn !== undefined) {
          if      (item.expiresIn <= 3) weight = qty * 3;
          else if (item.expiresIn <= 7) weight = qty * 1.5;
        }
        fridgeDict[item.name.toLowerCase()] = (fridgeDict[item.name.toLowerCase()] || 0) + weight;
      }

      const objective = OBJECTIVE_MAP[profile.sportsObjective] ?? profile.sportsObjective ?? "maintenance";
      const payload = {
        fridge_dict:  fridgeDict,
        user_profile: {
          calorie_target:       profile.calorieTarget       || 2100,
          sports_objective:     objective,
          dietary_restrictions: profile.dietaryRestrictions || [],
        },
        top_n: 15, min_score: 0.05,
      };

      const response = await fetch(`${API_BASE}${meal.route}`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(APP_CONFIG.apiKey ? { "X-API-Key": APP_CONFIG.apiKey } : {}) }, body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${response.status}`);
      }
      const data = await response.json();
      router.push({
        pathname: "/(tabs)/recipes",
        params: {
          apiResults: JSON.stringify(data.recipes),
          mealType:   meal.key,
          mealLabel:  meal.label,
          fridgeDict: JSON.stringify(fridgeDict),
          mealRoute:  meal.route,
        },
      });
    } catch (error) {
      Alert.alert("Could not load recipes", error instanceof Error ? error.message : "Check that the server is running.");
    } finally { setLoadingRecipes(false); }
  };

  const handleScanCamera = () => {
    router.push("/(tabs)/scan");
  };

  const handlePickImage = async () => {
    try {
      // Demande permission galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "L'accès à la galerie est nécessaire.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        router.push({ pathname: "/(tabs)/scan", params: { imageUri: result.assets[0].uri } });
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Erreur", String(error));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <AppText className="text-[26px] font-bold text-foreground">My Fridge</AppText>
              <AppText className="text-[15px] text-muted-foreground mt-1">{items.length} ingredients in stock</AppText>
            </View>
            <Pressable onPress={() => setMenuOpen(true)} className="w-11 h-11 rounded-full items-center justify-center active:opacity-80" style={{ backgroundColor: colors.sage }}>
              <Ionicons name="add" size={26} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="px-5 gap-4">
          <View className="flex-row items-center rounded-2xl px-4 h-11 gap-2 border" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
            <Ionicons name="search" size={18} color={colors.mutedText} />
            <TextInput placeholder="Search ingredient..." value={search} onChangeText={setSearch} className="flex-1 text-[15px] text-foreground" placeholderTextColor={colors.mutedText} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            {(dbCategories.length > 0
              ? ["All", ...dbCategories]
              : DEFAULT_CATEGORIES
            ).map((cat) => {
              const active = activeCategory === cat;
              return (
                <Pressable key={cat} onPress={() => setActiveCategory(cat)}>
                  <View className="rounded-full px-4 py-2" style={{ backgroundColor: active ? colors.sage : colors.white, borderWidth: active ? 0 : 1, borderColor: colors.border }}>
                    <AppText className={`text-[13px] font-medium ${active ? "text-white" : "text-muted-foreground"}`}>{cat}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {expiringSoon.length > 0 && (
            <View>
              <View className="flex-row items-center gap-1.5 mb-3">
                <Ionicons name="warning" size={16} color={colors.destructive} />
                <AppText className="text-[14px] font-bold" style={{ color: colors.destructive }}>
                  Expiring soon (prioritized in suggestions)
                </AppText>

              </View>
              {expiringSoon.map((item) => (
                <InventoryItemRow key={item.id} item={item} onDelete={() => handleDelete(item.id)} onEdit={() => handleOpenEdit(item)} />
              ))}
            </View>
          )}

          <View>
            <AppText className="text-[15px] font-bold text-foreground mb-3">In stock</AppText>
            {others.length === 0 && expiringSoon.length === 0 ? (
              <Pressable onPress={() => setMenuOpen(true)} className="rounded-2xl border p-8 items-center justify-center gap-3" style={{ backgroundColor: colors.white, borderColor: colors.border, borderStyle: "dashed" }}>
                <Ionicons name="add-circle-outline" size={40} color={colors.sage} />
                <AppText className="text-[15px] font-semibold text-foreground">Your fridge is empty</AppText>
                <AppText className="text-[13px] text-muted-foreground text-center">Tap to add ingredients by scanning or manually</AppText>
              </Pressable>
            ) : (
              others.map((item) => (
                <InventoryItemRow key={item.id} item={item} onDelete={() => handleDelete(item.id)} onEdit={() => handleOpenEdit(item)} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {items.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4" style={{ backgroundColor: colors.white }}>
          <Pressable onPress={() => setMealPickerOpen(true)} disabled={loadingRecipes} className="rounded-2xl overflow-hidden active:opacity-90" style={{ backgroundColor: colors.sage }}>
            <View className="flex-row items-center justify-center gap-3 py-4">
              {loadingRecipes ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="restaurant-outline" size={20} color="#fff" />}
              <AppText className="text-[16px] font-bold text-white">{loadingRecipes ? "Searching..." : "Suggest recipes"}</AppText>
              {expiringSoon.length > 0 && !loadingRecipes && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                  <AppText className="text-[11px] font-bold text-white">{expiringSoon.length} urgent</AppText>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      )}

      <MealPickerModal visible={mealPickerOpen} onClose={() => setMealPickerOpen(false)} onSelect={handleRequestRecipes} expiringCount={expiringSoon.length} />
      <AddMethodModal visible={menuOpen} onClose={() => setMenuOpen(false)} onCamera={() => { setMenuOpen(false); handleScanCamera(); }} onGallery={() => { setMenuOpen(false); handlePickImage(); }} onManual={handleOpenAdd} />
      <IngredientFormModal visible={formOpen} onClose={() => setFormOpen(false)} onSave={handleSaveIngredient} initial={editItem} />
    </View>
  );
}
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useFridgeStore } from "@/store";
import { useRouter } from "expo-router";
import { useProfileStore } from "@/store/profile-store";
import type { Ingredient } from "@/types/ingredient";
import { getSafeIconName } from "@/helpers/utils/icons";
import { BASE_URL } from "@/services/api";
import { APP_CONFIG } from "@/config/runtime";

// ── Config API ─────────────────────────────────────────────────────────────
const API_BASE = BASE_URL;

const categories = [
  "All",
  "Fruits",
  "Vegetables",
  "Protein",
  "Dairy",
  "Grains",
];

const MEAL_OPTIONS = [
  { key: "breakfast", label: "Breakfast", emoji: "☀️", route: "/recommend/breakfast" },
  { key: "lunch",     label: "Lunch",     emoji: "🥗", route: "/recommend/lunch"     },
  { key: "dinner",    label: "Dinner",    emoji: "🌙", route: "/recommend/dinner"    },
  { key: "snack",     label: "Snack",     emoji: "🍎", route: "/recommend/snack"     },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatExpiry(expiresIn?: number) {
  if (expiresIn === undefined) return null;
  if (expiresIn === 0) return "Today";
  return `${expiresIn}d`;
}

function getExpiresIn(expiresAt?: string): number | undefined {
  if (!expiresAt) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ── Composants ─────────────────────────────────────────────────────────────

function InventoryItemRow({
  item,
  variant,
  onDelete,
}: {
  item: Ingredient & { expiresIn?: number };
  variant: "expiring" | "stock";
  onDelete: () => void;
}) {
  const expiryLabel = formatExpiry(item.expiresIn);
  const isExpiring = variant === "expiring";

  return (
    <View
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mb-2"
      style={
        isExpiring
          ? { backgroundColor: colors.expiringBg, borderColor: colors.expiringBorder }
          : { backgroundColor: colors.white, borderColor: colors.border }
      }
    >
      <View className="flex-row items-center gap-3.5 flex-1">
        <View className="w-10 h-10 rounded-xl items-center justify-center bg-zinc-50 border border-zinc-100">
          <MaterialCommunityIcons
            name={getSafeIconName(item.icon) as any}
            size={22}
            color={colors.sage}
          />
        </View>
        <View className="flex-1">
          <AppText className="text-[15px] font-semibold text-foreground">
            {item.name}
          </AppText>
          <AppText className="text-[13px] text-muted-foreground mt-0.5">
            {item.quantity || "1"}
          </AppText>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        {isExpiring && expiryLabel && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="warning" size={14} color={colors.destructive} />
            <AppText
              className={`text-[13px] font-semibold ${
                item.expiresIn === 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {expiryLabel}
            </AppText>
          </View>
        )}
        <Pressable
          onPress={onDelete}
          className="w-8 h-8 rounded-full items-center justify-center bg-zinc-50 active:opacity-60"
        >
          <Ionicons name="trash-outline" size={16} color={colors.mutedText} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Modal sélection repas ──────────────────────────────────────────────────

function MealPickerModal({
  visible,
  onClose,
  onSelect,
  expiringCount,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (meal: typeof MEAL_OPTIONS[0]) => void;
  expiringCount: number;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl px-5 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-2">
            <AppText className="text-[18px] font-bold text-foreground">
              What meal are you making?
            </AppText>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <AppText className="text-[14px] text-muted-foreground mb-5">
            Recipes will match your calorie goals
            {expiringCount > 0
              ? ` and prioritize your ${expiringCount} item${expiringCount > 1 ? "s" : ""} expiring soon.`
              : "."}
          </AppText>

          <View className="gap-3">
            {MEAL_OPTIONS.map((meal) => (
              <Pressable
                key={meal.key}
                onPress={() => onSelect(meal)}
                className="flex-row items-center gap-4 rounded-2xl border px-4 py-4 active:opacity-80"
                style={{ backgroundColor: colors.white, borderColor: colors.border }}
              >
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: colors.sageMuted }}
                >
                  <AppText className="text-[22px]">{meal.emoji}</AppText>
                </View>
                <AppText className="text-[16px] font-semibold text-foreground flex-1">
                  {meal.label}
                </AppText>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────

export default function FrigoScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const router = useRouter();
  const ingredients = useFridgeStore((s) => s.ingredients);
  const removeIngredient = useFridgeStore((s) => s.removeIngredient);
  const { profile } = useProfileStore();

  const items = ingredients.map((ing) => ({
    ...ing,
    expiresIn: getExpiresIn(ing.expiresAt),
    category: ing.category || "Other",
    icon: ing.icon || "food-variant",
    quantity: ing.quantity || "1",
  }));

  const filtered = items.filter((item) => {
    const matchCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const expiringSoon = filtered.filter(
    (i) => i.expiresIn !== undefined && i.expiresIn <= 2,
  );
  const others = filtered.filter(
    (i) => i.expiresIn === undefined || i.expiresIn > 2,
  );

  // ── Appel API suggestion ─────────────────────────────────────────────────

  const handleRequestRecipes = async (meal: typeof MEAL_OPTIONS[0]) => {
    setMealPickerOpen(false);
    setLoadingRecipes(true);

    try {
      // Construire le fridge_dict depuis le store
      // Priorité aux aliments qui expirent bientôt (doublé leur poids)
      const fridgeDict: Record<string, number> = {};
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        // Double la quantité pour les aliments expirant dans 2 jours
        const weight = item.expiresIn !== undefined && item.expiresIn <= 2 ? qty * 2 : qty;
        fridgeDict[item.name.toLowerCase()] = weight;
      }

      const payload = {
        fridge_dict: fridgeDict,
        user_profile: {
          calorie_target: profile.calorieTarget || 2100,
          sports_objective: profile.sportsObjective || "maintenance",
          dietary_restrictions: profile.dietaryRestrictions || [],
        },
        top_n: 5,
        min_score: 0.05,
      };

      const response = await fetch(`${API_BASE}${meal.route}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(APP_CONFIG.apiKey ? { "X-API-Key": APP_CONFIG.apiKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${response.status}`);
      }

      const data = await response.json();

      // Navigue vers l'onglet recettes avec les résultats
      router.push({
        pathname: "/(tabs)/recipes",
        params: {
          apiResults: JSON.stringify(data.recipes),
          mealType: meal.key,
          mealLabel: meal.label,
        },
      });
    } catch (error) {
      Alert.alert(
        "Unable to load recipes",
        error instanceof Error ? error.message : "Make sure the server is running.",
      );
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleScanCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      setMenuOpen(false);
      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: "/(tabs)/scan",
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      Alert.alert("Error", `Unable to access the camera: ${String(error)}`);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      setMenuOpen(false);
      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: "/(tabs)/scan",
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      Alert.alert("Error", `Unable to access the gallery: ${String(error)}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <AppText className="text-[26px] font-bold text-foreground">
                My Fridge
              </AppText>
              <AppText className="text-[15px] text-muted-foreground mt-1">
                {items.length} ingredients in stock
              </AppText>
            </View>
            <Pressable
              onPress={() => setMenuOpen(true)}
              className="w-11 h-11 rounded-full items-center justify-center active:opacity-80"
              style={{ backgroundColor: colors.sage }}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="px-5 gap-4">
          {/* Barre de recherche */}
          <View
            className="flex-row items-center rounded-2xl px-4 h-11 gap-2 border"
            style={{ backgroundColor: colors.white, borderColor: colors.border }}
          >
            <Ionicons name="search" size={18} color={colors.mutedText} />
            <TextInput
              placeholder="Search for an ingredient..."
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-[15px] text-foreground"
              placeholderTextColor={colors.mutedText}
            />
          </View>

          {/* Filtres catégorie */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <Pressable key={cat} onPress={() => setActiveCategory(cat)}>
                  <View
                    className="rounded-full px-4 py-2"
                    style={{
                      backgroundColor: active ? colors.sage : colors.white,
                      borderWidth: active ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <AppText
                      className={`text-[13px] font-medium ${
                        active ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Aliments expirant bientôt */}
          {expiringSoon.length > 0 && (
            <View>
              <View className="flex-row items-center gap-1.5 mb-3">
                <Ionicons name="warning" size={16} color={colors.destructive} />
                <AppText
                  className="text-[14px] font-bold"
                  style={{ color: colors.destructive }}
                >
                  Use soon
                </AppText>
              </View>
              {expiringSoon.map((item) => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  variant="expiring"
                  onDelete={() => removeIngredient(item.id)}
                />
              ))}
            </View>
          )}

          {/* Stock normal */}
          <View>
            <AppText className="text-[15px] font-bold text-foreground mb-3">
              In stock
            </AppText>
            {others.length === 0 && expiringSoon.length === 0 ? (
              <View className="rounded-2xl border p-6 items-center justify-center bg-white border-zinc-100">
                <AppText className="text-muted-foreground text-[14px]">
                  Your fridge is empty. Add some ingredients!
                </AppText>
              </View>
            ) : (
              others.map((item) => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  variant="stock"
                  onDelete={() => removeIngredient(item.id)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Bouton suggestion recettes (sticky bas) ── */}
      {items.length > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4"
          style={{ backgroundColor: colors.cream }}
        >
          <Pressable
            onPress={() => setMealPickerOpen(true)}
            disabled={loadingRecipes}
            className="rounded-2xl overflow-hidden active:opacity-90"
            style={{ backgroundColor: colors.sage }}
          >
            <View className="flex-row items-center justify-center gap-3 py-4">
              {loadingRecipes ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="restaurant-outline" size={20} color="#fff" />
              )}
              <AppText className="text-[16px] font-bold text-white">
                {loadingRecipes
                  ? "Searching..."
                  : "Suggest recipes"}
              </AppText>
              {expiringSoon.length > 0 && !loadingRecipes && (
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                >
                  <AppText className="text-[11px] font-bold text-white">
                    {expiringSoon.length} urgent
                  </AppText>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      )}

      {/* ── Modal sélection type de repas ── */}
      <MealPickerModal
        visible={mealPickerOpen}
        onClose={() => setMealPickerOpen(false)}
        onSelect={handleRequestRecipes}
        expiringCount={expiringSoon.length}
      />

      {/* ── Modal ajout ingrédients ── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setMenuOpen(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl px-5 pt-5 pb-10">
            <AppText className="text-[18px] font-bold mb-4">
              Add ingredients
            </AppText>
            <Pressable
              onPress={handleScanCamera}
              className="flex-row items-center gap-3 p-4 rounded-2xl mb-3 border"
              style={{ backgroundColor: colors.white, borderColor: colors.border }}
            >
              <Ionicons name="camera-outline" size={24} color={colors.sage} />
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold">
                  Take a photo
                </AppText>
                <AppText className="text-[13px] text-muted-foreground">
                  Scan your fridge with the camera
                </AppText>
              </View>
            </Pressable>
            <Pressable
              onPress={handlePickImage}
              className="flex-row items-center gap-3 p-4 rounded-2xl border"
              style={{ backgroundColor: colors.white, borderColor: colors.border }}
            >
              <Ionicons name="images-outline" size={24} color={colors.sage} />
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold">
                  Choose a photo
                </AppText>
                <AppText className="text-[13px] text-muted-foreground">
                  From your gallery
                </AppText>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
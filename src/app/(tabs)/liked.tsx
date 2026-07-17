/**
 * app/(tabs)/liked.tsx
 */

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { userService } from "@/services/userService";
import { useLikedStore } from "@/store/liked-store";
import { useAuthStore } from "@/store/auth-store";
import { useFridgeStore } from "@/store";
import { useNutritionStore, type MealLog } from "@/store/nutrition-store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "☀️", lunch: "🥗", dinner: "🌙", snack: "🍎",
};

type FilterTab = "liked" | "already_cooked" | "cooked_today";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "liked",           label: "Liked" },
  { key: "already_cooked",  label: "Already cooked" },
  { key: "cooked_today",    label: "Cooked today" },
];

// ── Types locaux ───────────────────────────────────────────────────────────

type RecipeDetail = {
  id:                  number;
  title:               string;
  meal_type?:          string;
  minutes?:            number;
  calories?:           number;
  protein_g?:          number;
  carbs_g?:            number;
  total_fat_g?:        number;
  all_ingredients?:    string[];
  missing_ingredients?: string[];
  matched_ingredients?: string[];
  steps?:              { step: number; instruction: string }[];
  is_prepared?:        boolean;
};

// ── Modal détail recette ───────────────────────────────────────────────────

function RecipeDetailModal({
  recipe,
  visible,
  onClose,
  fridgeIngredients,
  onDetailLoaded,
}: {
  recipe:            RecipeDetail | null;
  visible:           boolean;
  onClose:           () => void;
  fridgeIngredients: Set<string>;
  onDetailLoaded?:   (d: RecipeDetail) => void;
}) {
  const [detail,  setDetail]  = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !recipe) { setDetail(null); setError(null); return; }
    setLoading(true);
    setError(null);
    userService.getRecipeDetail(recipe.id)
      .then((d: any) => {
        console.log("[RecipeDetail] DB response:", JSON.stringify(d).slice(0, 300));
        setDetail(d);
        onDetailLoaded?.(d);
      })
      .catch((e) => {
        console.warn("[RecipeDetail] getRecipeDetail échoué:", e);
        // Pas d'erreur bloquante — on utilise les données du store local
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [visible, recipe?.id]);

  if (!recipe) return null;

  // Fusionne : données DB (detail) > données du store local (recipe)
  // Le store local contient déjà steps/all_ingredients sauvegardés au moment du like
  const steps = (() => {
    if (detail?.steps?.length)           return detail.steps;
    if ((recipe as any).steps?.length)   return (recipe as any).steps;
    return [];
  })();
  const allIngredients = (() => {
    if (detail?.all_ingredients?.length)          return detail.all_ingredients;
    if ((recipe as any).all_ingredients?.length)  return (recipe as any).all_ingredients;
    return [];
  })();
  // Source de vérité pour missing : detail DB (frais) > recipe store (au moment du like)
  const missingIngredients = detail?.missing_ingredients ?? recipe.missing_ingredients ?? [];
  const missingSet = new Set(missingIngredients.map((s: string) => s.toLowerCase()));
  const ownedSet   = new Set(
    (detail?.matched_ingredients ?? recipe.matched_ingredients ?? []).map((s: string) => s.toLowerCase())
  );

  const getStatus = (ing: string): "owned" | "missing" | "unknown" => {
    const name = ing.toLowerCase();

    // 1. Source de vérité : missing_ingredients du backend
    if (missingSet.has(name)) return "missing";

    // 2. Source de vérité : matched_ingredients du backend
    if (ownedSet.has(name)) return "owned";

    // 3. Matching partiel sur missingSet (ex: "fresh garlic" vs "garlic")
    for (const m of missingSet) {
      const mWords = m.split(" ").filter((w: string) => w.length > 3);
      const nWords = name.split(" ").filter((w: string) => w.length > 3);
      if (mWords.some((mw: string) => nWords.includes(mw))) return "missing";
    }

    // 4. Matching partiel sur ownedSet
    for (const o of ownedSet) {
      const oWords = o.split(" ").filter((w: string) => w.length > 3);
      const nWords = name.split(" ").filter((w: string) => w.length > 3);
      if (oWords.some((ow: string) => nWords.includes(ow))) return "owned";
    }

    // 5. Fallback frigo local (matching mot entier strict)
    const ingWords = name.split(" ").filter((w: string) => w.length > 3);
    const inFridge = ingWords.length > 0 && Array.from(fridgeIngredients).some((f) => {
      const fridgeWords = f.toLowerCase().split(" ");
      return ingWords.some((iw: string) => fridgeWords.some((fw: string) => fw === iw));
    });
    return inFridge ? "owned" : "unknown";
  };

  // Compte précis basé sur les vraies données
  const ownedCount = allIngredients.filter((ing) => getStatus(ing) === "owned").length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View className="bg-background rounded-t-3xl" style={{ maxHeight: "92%" }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b"
            style={{ borderColor: colors.border }}
          >
            <View className="flex-1 pr-3">
              <AppText className="text-[17px] font-bold text-foreground" numberOfLines={2}>
                {recipe.title}
              </AppText>
              <View className="flex-row gap-3 mt-1 flex-wrap">
                {recipe.calories && (
                  <AppText className="text-[12px] text-muted-foreground">
                    🔥 {Math.round(recipe.calories)} kcal
                  </AppText>
                )}
                {recipe.minutes && (
                  <AppText className="text-[12px] text-muted-foreground">
                    ⏱ {recipe.minutes} min
                  </AppText>
                )}
                {allIngredients.length > 0 && (
                  <AppText className="text-[12px] text-muted-foreground">
                    🧂 {allIngredients.length} ingredients
                  </AppText>
                )}
                {steps.length > 0 && (
                  <AppText className="text-[12px] text-muted-foreground">
                    📋 {steps.length} steps
                  </AppText>
                )}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <Ionicons name="close" size={18} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {loading && (
              <View className="items-center py-10">
                <ActivityIndicator color={colors.sage} size="large" />
                <AppText className="text-[13px] text-muted-foreground mt-3">
                  Loading recipe details...
                </AppText>
              </View>
            )}

            {error && !loading && (
              <View
                className="rounded-2xl p-4 items-center"
                style={{ backgroundColor: colors.expiringBg }}
              >
                <Ionicons name="warning-outline" size={24} color={colors.destructive} />
                <AppText className="text-[13px] text-muted-foreground mt-2 text-center">{error}</AppText>
              </View>
            )}

            {!loading && (
              <View className="gap-5">
                {/* Macros */}
                {(recipe.protein_g || recipe.carbs_g || recipe.total_fat_g) && (
                  <View
                    className="flex-row rounded-2xl overflow-hidden border"
                    style={{ borderColor: colors.border }}
                  >
                    {[
                      { label: "Protein", value: recipe.protein_g,   color: colors.macroProtein },
                      { label: "Carbs",   value: recipe.carbs_g,     color: colors.macroCarbs   },
                      { label: "Fat",     value: recipe.total_fat_g, color: colors.macroFat     },
                    ].map((m, i) => (
                      <View
                        key={m.label}
                        className="flex-1 items-center py-3"
                        style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: colors.border }}
                      >
                        <AppText className="text-[15px] font-bold" style={{ color: m.color }}>
                          {m.value ? `${Math.round(m.value)}g` : "—"}
                        </AppText>
                        <AppText className="text-[11px] text-muted-foreground mt-0.5">{m.label}</AppText>
                      </View>
                    ))}
                  </View>
                )}

                {/* Ingrédients */}
                {allIngredients.length > 0 ? (
                  <View>
                    <View className="flex-row items-center justify-between mb-3">
                      <AppText className="text-[15px] font-bold text-foreground">
                        Ingredients
                      </AppText>
                      <AppText className="text-[12px] text-muted-foreground">
                        {ownedCount}/{allIngredients.length} in fridge
                      </AppText>
                    </View>

                    {/* Légende */}
                    <View className="flex-row gap-4 mb-3">
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.sage }} />
                        <AppText className="text-[11px] text-muted-foreground">In fridge</AppText>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.destructive }} />
                        <AppText className="text-[11px] text-muted-foreground">Missing</AppText>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.mutedText }} />
                        <AppText className="text-[11px] text-muted-foreground">Unknown</AppText>
                      </View>
                    </View>

                    <View className="gap-2">
                      {allIngredients.map((ing, i) => {
                        const status = getStatus(ing);
                        const iconName =
                          status === "owned"   ? "checkmark-circle" :
                          status === "missing" ? "close-circle"     : "ellipse-outline";
                        const iconColor =
                          status === "owned"   ? colors.sage        :
                          status === "missing" ? colors.destructive : colors.mutedText;
                        const bgColor =
                          status === "owned"   ? `${colors.sage}12`   :
                          status === "missing" ? colors.expiringBg     : colors.white;
                        const borderColor =
                          status === "owned"   ? `${colors.sage}30`      :
                          status === "missing" ? colors.expiringBorder    : colors.border;

                        return (
                          <View
                            key={`ing_${i}`}
                            className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 border"
                            style={{ backgroundColor: bgColor, borderColor }}
                          >
                            <Ionicons name={iconName} size={16} color={iconColor} />
                            <AppText
                              className="text-[13px] flex-1 capitalize"
                              style={{ color: status === "missing" ? colors.destructive : colors.foreground }}
                            >
                              {ing}
                            </AppText>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : !loading && (
                  <View
                    className="rounded-2xl border p-4 items-center"
                    style={{ backgroundColor: colors.white, borderColor: colors.border }}
                  >
                    <Ionicons name="information-circle-outline" size={22} color={colors.mutedText} />
                    <AppText className="text-[13px] text-muted-foreground mt-2 text-center">
                      No ingredient list available.{"\n"}Re-like this recipe to save ingredients.
                    </AppText>
                  </View>
                )}

                {/* Étapes */}
                {steps.length > 0 ? (
                  <View>
                    <AppText className="text-[15px] font-bold text-foreground mb-3">
                      Preparation ({steps.length} steps)
                    </AppText>
                    {steps.map((s, i) => (
                      <View key={`step_${s.step ?? i}`} className="flex-row gap-3 mb-4">
                        <View
                          className="w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: colors.sage }}
                        >
                          <AppText className="text-[12px] font-bold text-white">
                            {s.step ?? i + 1}
                          </AppText>
                        </View>
                        <AppText className="text-[13px] text-foreground flex-1 leading-5">
                          {s.instruction}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : !loading && (
                  <View
                    className="rounded-2xl border p-4 items-center"
                    style={{ backgroundColor: colors.white, borderColor: colors.border }}
                  >
                    <Ionicons name="list-outline" size={22} color={colors.mutedText} />
                    <AppText className="text-[13px] text-muted-foreground mt-2 text-center">
                      No steps available.{"\n"}Re-like this recipe to save preparation steps.
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Filter tabs ────────────────────────────────────────────────────────────

function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active:   FilterTab;
  counts:   Record<FilterTab, number>;
  onChange: (tab: FilterTab) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {FILTER_TABS.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className="rounded-full px-4 py-2 border active:opacity-80"
            style={{
              borderColor:     selected ? colors.sage : colors.border,
              backgroundColor: selected ? `${colors.sage}15` : colors.white,
            }}
          >
            <AppText
              className="text-[13px] font-semibold"
              style={{ color: selected ? colors.sage : colors.mutedText }}
            >
              {tab.label} ({counts[tab.key]})
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Swipe action backgrounds ─────────────────────────────────────────────────

function SwipeAction({
  side,
  label,
  icon,
  color,
}: {
  side:  "left" | "right";
  label: string;
  icon:  keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View
      className="justify-center mb-3"
      style={{
        backgroundColor: color,
        width:           96,
        borderRadius:    16,
        alignItems:      side === "left" ? "flex-start" : "flex-end",
        paddingHorizontal: 16,
        marginLeft:      side === "right" ? 8 : 0,
        marginRight:     side === "left" ? 8 : 0,
      }}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
      <AppText className="text-[11px] font-semibold mt-1" style={{ color: colors.white }}>
        {label}
      </AppText>
    </View>
  );
}

function isRecipeCookedToday(recipe: RecipeDetail, meals: MealLog[]): boolean {
  const id = String(recipe.id);
  const title = recipe.title.toLowerCase();
  return meals.some(
    (m) => (m.recipe_id != null && String(m.recipe_id) === id) || m.title.toLowerCase() === title,
  );
}

// ── Recipe card ──────────────────────────────────────────────────────────────

function LikedRecipeCard({
  recipe,
  cookedToday,
  onViewDetail,
  onCookToggle,
}: {
  recipe:       RecipeDetail;
  cookedToday:  boolean;
  onViewDetail: () => void;
  onCookToggle: () => void;
}) {
  const emoji = MEAL_EMOJI[recipe.meal_type ?? ""] ?? "🍽️";
  const prepCount = (recipe as RecipeDetail & { prep_count?: number }).prep_count ?? 0;
  const missingCount = recipe.missing_ingredients?.length ?? 0;

  return (
    <View
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: colors.white, borderColor: colors.border }}
    >
      <Pressable onPress={onViewDetail} className="px-4 pt-4 pb-3 active:opacity-80">
        <View className="flex-row items-start justify-between gap-2 mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap mb-1">
              <AppText className="text-[14px]">{emoji}</AppText>
              {cookedToday && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.sageMuted }}>
                  <AppText className="text-[11px] font-semibold" style={{ color: colors.sage }}>
                    Cooked today
                  </AppText>
                </View>
              )}
              {recipe.is_prepared && !cookedToday && (
                <View className="rounded-full px-2 py-0.5 border" style={{ borderColor: colors.border }}>
                  <AppText className="text-[11px] text-muted-foreground">Cooked before</AppText>
                </View>
              )}
              {prepCount > 0 && (
                <View className="rounded-full px-2 py-0.5 border" style={{ borderColor: colors.border }}>
                  <AppText className="text-[11px] text-muted-foreground">{prepCount}x prepared</AppText>
                </View>
              )}
            </View>
            <AppText className="text-[15px] font-bold text-foreground" numberOfLines={2}>
              {recipe.title}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </View>

        <View className="flex-row gap-3 flex-wrap">
          {recipe.calories  && <AppText className="text-[12px] text-muted-foreground">{Math.round(recipe.calories)} kcal</AppText>}
          {recipe.minutes   && <AppText className="text-[12px] text-muted-foreground">{recipe.minutes} min</AppText>}
          {recipe.protein_g && <AppText className="text-[12px] text-muted-foreground">{Math.round(recipe.protein_g)}g protein</AppText>}
          {missingCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="close-circle" size={12} color={colors.destructive} />
              <AppText className="text-[12px]" style={{ color: colors.destructive }}>
                {missingCount} missing
              </AppText>
            </View>
          )}
        </View>
      </Pressable>

      <View className="flex-row gap-2 px-4 pb-4">
        <Pressable
          onPress={onViewDetail}
          className="flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 border active:opacity-70"
          style={{ borderColor: colors.border }}
        >
          <Ionicons name="book-outline" size={14} color={colors.mutedText} />
          <AppText className="text-[12px] font-medium text-muted-foreground">Recipe</AppText>
        </Pressable>

        <Pressable
          onPress={onCookToggle}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 border active:opacity-70"
          style={{
            borderColor:     cookedToday ? colors.sage : colors.border,
            backgroundColor: cookedToday ? colors.sageMuted : colors.white,
          }}
        >
          <Ionicons
            name={cookedToday ? "close-circle-outline" : "restaurant-outline"}
            size={15}
            color={cookedToday ? colors.sage : colors.mutedText}
          />
          <AppText
            className="text-[13px] font-medium"
            style={{ color: cookedToday ? colors.sage : colors.mutedText }}
          >
            {cookedToday ? "Remove from today" : "I cooked this!"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function SwipeableLikedRecipeCard({
  recipe,
  cookedToday,
  onUnlike,
  onCookToggle,
  onViewDetail,
  onSwipeableOpen,
}: {
  recipe:           RecipeDetail;
  cookedToday:      boolean;
  onUnlike:         () => void;
  onCookToggle:     () => void;
  onViewDetail:     () => void;
  onSwipeableOpen:  (ref: Swipeable | null) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      onSwipeableOpen={(direction) => {
        onSwipeableOpen(swipeRef.current);
        if (direction === "left" && cookedToday) {
          swipeRef.current?.close();
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (direction === "left") {
          onCookToggle();
        } else {
          onUnlike();
        }
        swipeRef.current?.close();
      }}
      renderLeftActions={
        cookedToday
          ? undefined
          : () => <SwipeAction side="left" label="Cooked" icon="checkmark-circle" color={colors.sage} />
      }
      renderRightActions={() => (
        <SwipeAction side="right" label="Remove" icon="heart-dislike" color={colors.destructive} />
      )}
    >
      <LikedRecipeCard
        recipe={recipe}
        cookedToday={cookedToday}
        onViewDetail={onViewDetail}
        onCookToggle={onCookToggle}
      />
    </Swipeable>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<FilterTab, { title: string; subtitle: string }> = {
  liked: {
    title:    "No liked recipes yet",
    subtitle: "Like a recipe from suggestions to save it here.",
  },
  already_cooked: {
    title:    "No cooked recipes yet",
    subtitle: "Swipe right or tap \"I cooked this!\" on a liked recipe.",
  },
  cooked_today: {
    title:    "Nothing cooked today",
    subtitle: "Swipe right or tap \"I cooked this!\" to log today's intake.",
  },
};

export default function LikedScreen() {
  const { likedRecipes, unlikeRecipe, loadFromDB }                   = useLikedStore();
  const { loadFromDB: loadNutrition, logMeal,
          totalCalories, totalProtein, totalCarbs, totalFat, meals } = useNutritionStore();
  const { loadFridgeFromDB }                                         = useAuthStore();
  const ingredients                                                   = useFridgeStore((s) => s.ingredients);
  const topPadding                                                    = useScreenTopPadding();

  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState<FilterTab>("liked");
  const [detailRecipe,  setDetailRecipe]  = useState<RecipeDetail | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<RecipeDetail | null>(null);
  const [markingId,     setMarkingId]     = useState<number | null>(null);

  const openSwipeableRef = useRef<Swipeable | null>(null);

  const fridgeSet = new Set(ingredients.map((i) => i.name.toLowerCase()));

  const cookedTodayRecipeIds = useMemo(
    () => new Set(
      likedRecipes
        .filter((r) => isRecipeCookedToday(r as RecipeDetail, meals))
        .map((r) => String(r.id)),
    ),
    [likedRecipes, meals],
  );

  const filterCounts = useMemo(() => ({
    liked:          likedRecipes.length,
    already_cooked: likedRecipes.filter((r) => r.is_prepared).length,
    cooked_today:   likedRecipes.filter((r) => cookedTodayRecipeIds.has(String(r.id))).length,
  }), [likedRecipes, cookedTodayRecipeIds]);

  const filteredRecipes = useMemo(() => {
    if (activeFilter === "already_cooked") {
      return likedRecipes.filter((r) => r.is_prepared);
    }
    if (activeFilter === "cooked_today") {
      return likedRecipes.filter((r) => cookedTodayRecipeIds.has(String(r.id)));
    }
    return likedRecipes;
  }, [likedRecipes, activeFilter, cookedTodayRecipeIds]);

  useEffect(() => {
    Promise.all([loadFromDB(), loadNutrition()]).finally(() => setLoading(false));
  }, []);

  const handleSwipeableOpen = useCallback((ref: Swipeable | null) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const handleUnlike = useCallback((recipe: RecipeDetail) => {
    unlikeRecipe(recipe.id, recipe.title);
  }, [unlikeRecipe]);

  const executeMarkCooked = useCallback(async (recipe: RecipeDetail) => {
    if (markingId === recipe.id) return;
    if (isRecipeCookedToday(recipe, meals)) return;

    setMarkingId(recipe.id);
    try {
      let freshDetail: RecipeDetail | null = currentDetail?.id === recipe.id ? currentDetail : null;
      if (!freshDetail?.all_ingredients?.length) {
        try {
          freshDetail = await userService.getRecipeDetail(recipe.id) as RecipeDetail;
          setCurrentDetail(freshDetail);
        } catch (e) {
          console.warn("[markCooked] getRecipeDetail failed:", e);
        }
      }

      const freshMissing = new Set(
        (freshDetail?.missing_ingredients ?? recipe.missing_ingredients ?? [])
          .map((s: string) => s.toLowerCase()),
      );
      const allIngs = freshDetail?.all_ingredients ?? recipe.all_ingredients ?? [];
      const matched = allIngs.filter((ing: string) => !freshMissing.has(ing.toLowerCase()));

      await userService.markRecipeCooked(recipe.id, matched);

      if (recipe.calories) {
        logMeal({
          recipe_id: recipe.id,
          title:     recipe.title,
          meal_type: recipe.meal_type || "meal",
          calories:  recipe.calories    || 0,
          protein_g: recipe.protein_g   || 0,
          carbs_g:   recipe.carbs_g     || 0,
          fat_g:     recipe.total_fat_g || 0,
        });
      }

      await Promise.all([loadFromDB(), loadFridgeFromDB(), loadNutrition()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not log the meal. Try again.";
      console.error("[markCooked] error:", message);
      Alert.alert("Error", message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setMarkingId(null);
    }
  }, [currentDetail, loadFromDB, loadFridgeFromDB, loadNutrition, logMeal, markingId, meals]);

  const executeUnmarkCooked = useCallback(async (recipe: RecipeDetail) => {
    if (markingId === recipe.id) return;
    setMarkingId(recipe.id);
    try {
      await userService.unmarkRecipeCooked(recipe.id);
      await Promise.all([loadFromDB(), loadFridgeFromDB(), loadNutrition()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove the meal. Try again.";
      Alert.alert("Error", message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setMarkingId(null);
    }
  }, [loadFromDB, loadFridgeFromDB, loadNutrition, markingId]);

  const handleCookToggle = useCallback((recipe: RecipeDetail) => {
    if (isRecipeCookedToday(recipe, meals)) {
      Alert.alert(
        "Remove from today?",
        `"${recipe.title}" will be removed from today's intake.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => executeUnmarkCooked(recipe) },
        ],
      );
      return;
    }
    executeMarkCooked(recipe);
  }, [meals, executeMarkCooked, executeUnmarkCooked]);

  const cals    = Math.round(totalCalories());
  const protein = Math.round(totalProtein());
  const carbs   = Math.round(totalCarbs());
  const fat     = Math.round(totalFat());
  const empty   = EMPTY_MESSAGES[activeFilter];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-4" style={{ paddingTop: topPadding }}>
          <AppText className="text-[26px] font-bold text-foreground">Liked Recipes</AppText>
          <AppText className="text-[15px] text-muted-foreground mt-1">
            Swipe right to log a meal, left to remove, or use the buttons
          </AppText>
        </View>

        <View className="px-5 gap-4">
          <FilterTabs active={activeFilter} counts={filterCounts} onChange={setActiveFilter} />

          {meals.length > 0 && (
            <View className="rounded-2xl border p-4 gap-3" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="flame-outline" size={18} color={colors.macroCarbs} />
                <AppText className="text-[15px] font-bold text-foreground">Today's intake</AppText>
                <AppText className="ml-auto text-[14px] font-bold" style={{ color: colors.macroCarbs }}>
                  {cals} kcal
                </AppText>
              </View>
              <View className="flex-row rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
                {[
                  { label: "Protein", value: protein, color: colors.macroProtein },
                  { label: "Carbs",   value: carbs,   color: colors.macroCarbs   },
                  { label: "Fat",     value: fat,     color: colors.macroFat     },
                ].map((m, i) => (
                  <View key={m.label} className="flex-1 items-center py-2.5" style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: colors.border }}>
                    <AppText className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}g</AppText>
                    <AppText className="text-[11px] text-muted-foreground mt-0.5">{m.label}</AppText>
                  </View>
                ))}
              </View>
              {meals.map((meal: MealLog, mi: number) => (
                <View key={`meal_${meal.id}_${mi}`} className="flex-row justify-between items-center py-0.5">
                  <AppText className="text-[13px] text-foreground flex-1" numberOfLines={1}>
                    {MEAL_EMOJI[meal.meal_type] ?? "🍽️"} {meal.title}
                  </AppText>
                  <AppText className="text-[13px] font-medium" style={{ color: colors.macroCarbs }}>
                    {Math.round(meal.calories)} kcal
                  </AppText>
                </View>
              ))}
            </View>
          )}

          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.sage} size="large" />
            </View>
          ) : filteredRecipes.length === 0 ? (
            <View className="items-center py-16 gap-4 px-8">
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.sageMuted }}>
                <Ionicons
                  name={activeFilter === "liked" ? "heart-outline" : "restaurant-outline"}
                  size={32}
                  color={colors.sage}
                />
              </View>
              <AppText className="text-[16px] font-semibold text-foreground text-center">{empty.title}</AppText>
              <AppText className="text-[14px] text-muted-foreground text-center">{empty.subtitle}</AppText>
            </View>
          ) : (
            <View className="gap-0">
              {filteredRecipes.map((r) => (
                <View key={r.id} className="mb-3">
                  <SwipeableLikedRecipeCard
                    recipe={r as RecipeDetail}
                    cookedToday={cookedTodayRecipeIds.has(String(r.id))}
                    onUnlike={() => handleUnlike(r as RecipeDetail)}
                    onCookToggle={() => handleCookToggle(r as RecipeDetail)}
                    onViewDetail={() => { setDetailRecipe(r as RecipeDetail); setDetailVisible(true); }}
                    onSwipeableOpen={handleSwipeableOpen}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <RecipeDetailModal
        recipe={detailRecipe}
        visible={detailVisible}
        onClose={() => { setDetailVisible(false); setDetailRecipe(null); }}
        fridgeIngredients={fridgeSet}
        onDetailLoaded={(d) => setCurrentDetail(d)}
      />
    </View>
  );
}
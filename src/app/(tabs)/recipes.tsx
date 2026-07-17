/**
 * app/(tabs)/recipes.tsx
 * ───────────────────────
 * Suggestions de recettes avec :
 * - Bouton like ❤️ → sauvegarde dans liked-store + NeonDB
 * - Bouton dislike → retire de la liste
 * - Bouton missing ingredients → substituts
 */

import { AppText } from "@/components/ui/app-text";
import { APP_CONFIG } from "@/config/runtime";
import { colors } from "@/constants/colors";
import { BASE_URL } from "@/services/api";
import { userService } from "@/services/userService";
import { useLikedStore } from "@/store/liked-store";
import { useProfileStore } from "@/store/profile-store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View
} from "react-native";

const API_BASE = BASE_URL;

const CALORIE_FIT_CONFIG: Record<string, { label: string; color: string }> = {
  perfect: { label: "✓ Calories on target", color: colors.sage },
  low:     { label: "↓ Low calorie",        color: colors.macroCarbs },
  high:    { label: "↑ High calorie",       color: colors.destructive },
  unknown: { label: "",                     color: colors.mutedText },
};

// ── Types ──────────────────────────────────────────────────────────────────

type RecipeStep = { step: number; instruction: string };
type Nutrition  = {
  calories?:       number;
  protein_g?:      number;
  carbs_g?:        number;
  total_fat_g?:    number;
  saturated_fat_g?: number;
  sugar_g?:        number;
  sodium_mg?:      number;
};
type ApiRecipe = {
  title:               string;
  score:               number;
  matched_ingredients: string[];
  missing_ingredients: string[];
  all_ingredients:     string[];
  steps:               RecipeStep[];
  nutrition:           Nutrition;
  meal_type?:          string;
  minutes?:            number;
  calorie_fit?:        string;
};

// ── Carte recette ──────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onFeedback,
  onLike,
  onDislike,
  isLiked,
}: {
  recipe:    ApiRecipe;
  onFeedback:(recipe: ApiRecipe) => void;
  onLike:    (recipe: ApiRecipe) => void;
  onDislike: (recipe: ApiRecipe) => void;
  isLiked:   boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const calFit   = CALORIE_FIT_CONFIG[recipe.calorie_fit || "unknown"];
  const matchPct = Math.round(
    (recipe.matched_ingredients.length / Math.max(recipe.all_ingredients.length, 1)) * 100,
  );

  return (
    <View className="rounded-2xl border mb-3 overflow-hidden" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
      {/* Header */}
      <Pressable onPress={() => setExpanded((v) => !v)} className="px-4 pt-4 pb-3 active:opacity-80">
        <View className="flex-row items-start justify-between gap-2 mb-2">
          <AppText className="text-[16px] font-bold text-foreground flex-1" numberOfLines={2}>
            {recipe.title}
          </AppText>
          <View className="flex-row items-center gap-2">
            {isLiked && <Ionicons name="heart" size={16} color={colors.destructive} />}
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedText} />
          </View>
        </View>

        {/* Badges */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {/* Score de pertinence global */}
          <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: `${colors.sage}18` }}>
            <AppText className="text-[11px] font-bold" style={{ color: colors.sage }}>
              ★ Match {Math.round(recipe.score * 100)}%
            </AppText>
          </View>
          {recipe.minutes ? (
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: colors.sageMuted }}>
              <Ionicons name="time-outline" size={12} color={colors.sage} />
              <AppText className="text-[12px] font-medium" style={{ color: colors.sage }}>{recipe.minutes} min</AppText>
            </View>
          ) : null}
          {recipe.nutrition?.calories ? (
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1 border" style={{ borderColor: colors.border }}>
              <AppText className="text-[12px] font-medium text-foreground">{Math.round(recipe.nutrition.calories)} kcal</AppText>
            </View>
          ) : null}
          {calFit.label ? (
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${calFit.color}18` }}>
              <AppText className="text-[12px] font-medium" style={{ color: calFit.color }}>{calFit.label}</AppText>
            </View>
          ) : null}
        </View>

        {/* Barre match */}
        <View className="gap-1">
          <View className="flex-row justify-between">
            <AppText className="text-[12px] text-muted-foreground">
              🧂 {recipe.matched_ingredients.length}/{recipe.all_ingredients.length} in your fridge
            </AppText>
            <AppText className="text-[12px] font-semibold" style={{ color: colors.sage }}>{matchPct}%</AppText>
          </View>
          <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
            <View className="h-full rounded-full" style={{ width: `${matchPct}%`, backgroundColor: matchPct >= 70 ? colors.sage : colors.macroCarbs }} />
          </View>
        </View>
      </Pressable>

      {/* Détails dépliables */}
      {expanded && (
        <View className="px-4 pb-4 gap-4">
          {/* Macros */}
          {recipe.nutrition && (
            <View className="flex-row rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
              {[
                { label: "Protein", value: recipe.nutrition.protein_g,   color: colors.macroProtein },
                { label: "Carbs",   value: recipe.nutrition.carbs_g,     color: colors.macroCarbs   },
                { label: "Fat",     value: recipe.nutrition.total_fat_g, color: colors.macroFat     },
              ].map((m, i) => (
                <View key={m.label} className="flex-1 items-center py-2.5" style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: colors.border }}>
                  <AppText className="text-[15px] font-bold" style={{ color: m.color }}>
                    {m.value ? `${Math.round(m.value)}g` : "0g"}
                  </AppText>
                  <AppText className="text-[11px] text-muted-foreground mt-0.5">{m.label}</AppText>
                </View>
              ))}
            </View>
          )}

          {/* Tous les ingrédients avec statut */}
          {recipe.all_ingredients.length > 0 && (
            <View>
              <AppText className="text-[13px] font-semibold text-foreground mb-2">
                Ingredients ({recipe.all_ingredients.length})
              </AppText>
              <View className="flex-row flex-wrap gap-1.5">
                {recipe.all_ingredients.map((ing, i) => {
                  const isMissing = recipe.missing_ingredients.includes(ing);
                  return (
                    <View
                      key={i}
                      className="flex-row items-center gap-1 rounded-full px-3 py-1 border"
                      style={{
                        backgroundColor: isMissing ? colors.expiringBg  : `${colors.sage}10`,
                        borderColor:     isMissing ? colors.expiringBorder : `${colors.sage}30`,
                      }}
                    >
                      <Ionicons
                        name={isMissing ? "close-circle" : "checkmark-circle"}
                        size={11}
                        color={isMissing ? colors.destructive : colors.sage}
                      />
                      <AppText
                        className="text-[12px]"
                        style={{ color: isMissing ? colors.destructive : colors.sage }}
                      >
                        {ing}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Étapes */}
          <View>
            <AppText className="text-[13px] font-semibold text-foreground mb-2">Preparation</AppText>
            {recipe.steps.map((s) => (
              <View key={s.step} className="flex-row gap-3 mb-2.5">
                <View className="w-5 h-5 rounded-full items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: colors.sageMuted }}>
                  <AppText className="text-[11px] font-bold" style={{ color: colors.sage }}>{s.step}</AppText>
                </View>
                <AppText className="text-[13px] text-foreground flex-1 leading-5">{s.instruction}</AppText>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View className="gap-2">
            {/* Ligne like / dislike */}
            <View className="flex-row gap-2">
              {/* Like */}
              <Pressable
                onPress={() => onLike(recipe)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 border active:opacity-70"
                style={{
                  borderColor:     isLiked ? colors.destructive : colors.sage,
                  backgroundColor: isLiked ? `${colors.destructive}12` : `${colors.sage}12`,
                }}
              >
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? colors.destructive : colors.sage} />
                <AppText className="text-[13px] font-semibold" style={{ color: isLiked ? colors.destructive : colors.sage }}>
                  {isLiked ? "Liked ❤️" : "Like"}
                </AppText>
              </Pressable>

              {/* Dislike */}
              <Pressable
                onPress={() => onDislike(recipe)}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 border active:opacity-70"
                style={{ borderColor: colors.border }}
              >
                <Ionicons name="thumbs-down-outline" size={16} color={colors.mutedText} />
                <AppText className="text-[13px] font-medium text-muted-foreground">Not for me</AppText>
              </Pressable>
            </View>

            {/* Missing ingredients */}
            {recipe.missing_ingredients.length > 0 && (
              <Pressable
                onPress={() => onFeedback(recipe)}
                className="flex-row items-center justify-center gap-2 rounded-xl py-3 border active:opacity-70"
                style={{ borderColor: colors.expiringBorder, backgroundColor: colors.expiringBg }}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.destructive} />
                <AppText className="text-[13px] font-medium" style={{ color: colors.destructive }}>
                  Find substitutes ({recipe.missing_ingredients.length})
                </AppText>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Modal substituts ───────────────────────────────────────────────────────

function FeedbackModal({ recipe, visible, onClose, sessionId }: {
  recipe:    ApiRecipe | null;
  visible:   boolean;
  onClose:   () => void;
  sessionId: string;
}) {
  const [submitting,  setSubmitting]  = useState(false);
  const [substitutes, setSubstitutes] = useState<{ original: string; substitutes: string[]; notes: string }[]>([]);

  useEffect(() => { if (!visible) setSubstitutes([]); }, [visible]);

  if (!recipe) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...(APP_CONFIG.apiKey ? { "X-API-Key": APP_CONFIG.apiKey } : {}) },
        body: JSON.stringify({ session_id: sessionId, recipe_title: recipe.title, liked: null, missing_ingredients: recipe.missing_ingredients, cooked: false }),
      });
      const data = await res.json();
      setSubstitutes(data.substitutes || []);
    } catch {
      Alert.alert("Error", "Unable to reach the server.");
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          className="bg-background rounded-t-3xl"
          style={{ maxHeight: "85%" }}
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: colors.border }}>
            <AppText className="text-[17px] font-bold text-foreground">
              {substitutes.length > 0 ? "Substitutes found" : "Missing ingredients"}
            </AppText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {substitutes.length === 0 ? (
              <>
                <AppText className="text-[14px] text-muted-foreground mb-4">
                  These ingredients are missing for "{recipe.title}":
                </AppText>
                <View className="gap-2 mb-5">
                  {recipe.missing_ingredients.map((ing, i) => (
                    <View key={i} className="flex-row items-center gap-3 rounded-xl border px-4 py-3" style={{ backgroundColor: colors.expiringBg, borderColor: colors.expiringBorder }}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.destructive} />
                      <AppText className="text-[14px] text-foreground">{ing}</AppText>
                    </View>
                  ))}
                </View>
                <Pressable onPress={handleSubmit} disabled={submitting} className="rounded-2xl py-4 items-center active:opacity-80" style={{ backgroundColor: colors.sage }}>
                  <AppText className="text-[15px] font-bold text-white">
                    {submitting ? "Finding substitutes..." : "Find substitutes"}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                <AppText className="text-[14px] text-muted-foreground mb-4">
                  Here are substitutes for the missing ingredients:
                </AppText>
                {substitutes.map((sub, i) => (
                  <View key={i} className="rounded-xl border px-4 py-3 mb-3" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
                    <AppText className="text-[14px] font-semibold text-foreground mb-1">{sub.original}</AppText>
                    {sub.substitutes.length > 0
                      ? sub.substitutes.map((s, j) => (
                          <View key={j} className="flex-row items-start gap-2 mt-1">
                            <AppText style={{ color: colors.sage }}>→</AppText>
                            <AppText className="text-[13px] text-foreground flex-1">{s}</AppText>
                          </View>
                        ))
                      : <AppText className="text-[13px] text-muted-foreground">{sub.notes}</AppText>
                    }
                  </View>
                ))}
                <Pressable onPress={onClose} className="rounded-2xl py-4 items-center mt-2 active:opacity-80" style={{ backgroundColor: colors.sage }}>
                  <AppText className="text-[15px] font-bold text-white">Close</AppText>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran principal ────────────────────────────────────────────────────────

export default function RecipesScreen() {
  const { profile }                                   = useProfileStore();
  const { likeRecipe, unlikeRecipe, isLiked, likedRecipes } = useLikedStore();
  const router                                        = useRouter();
  const insets                                        = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    apiResults?: string;
    mealType?:   string;
    mealLabel?:  string;
    fridgeDict?: string;
    mealRoute?:  string;
  }>();

  const [recipes,         setRecipes]         = useState<ApiRecipe[]>([]);
  const [mealLabel,       setMealLabel]       = useState("Recipes 🍽️");
  const [feedbackRecipe,  setFeedbackRecipe]  = useState<ApiRecipe | null>(null);

  // Recharge les recettes quand les params changent
  useEffect(() => {
    if (params.apiResults) {
      try { setRecipes(JSON.parse(params.apiResults)); } catch { setRecipes([]); }
    }
    if (params.mealLabel) setMealLabel(params.mealLabel);
  }, [params.apiResults, params.mealLabel]);

  const sessionId  = `user_${profile.firstName}_${profile.age}`.replace(/\s/g, "_");
  const hasResults = recipes.length > 0;

  // ── Like / Dislike ────────────────────────────────────────────────────────

  const handleLike = useCallback((recipe: ApiRecipe) => {
    if (isLiked(recipe.title)) {
      // Déjà liké → unlike
      const found = likedRecipes.find((r) => r.title === recipe.title);
      if (found) unlikeRecipe(found.id, found.title);
      Alert.alert("Removed", `"${recipe.title}" removed from liked recipes.`);
    } else {
      // Like
      likeRecipe({
        title:      recipe.title,
        meal_type:  recipe.meal_type,
        minutes:    recipe.minutes,
        nutrition:  recipe.nutrition,
        steps:      recipe.steps,
        score:      recipe.score,
        matched_ingredients: recipe.matched_ingredients,
        missing_ingredients: recipe.missing_ingredients,
        all_ingredients:     recipe.all_ingredients,
        calorie_fit:         recipe.calorie_fit,
      });
      // Feedback positif silencieux
      userService.sendFeedback({ session_id: sessionId, recipe_title: recipe.title, liked: true, missing_ingredients: [], cooked: false }).catch(() => {});
      Alert.alert("❤️ Liked!", `"${recipe.title}" saved to your liked recipes.`);
    }
  }, [isLiked, likedRecipes, likeRecipe, unlikeRecipe, sessionId]);

  const handleDislike = useCallback((recipe: ApiRecipe) => {
    setRecipes((prev) => prev.filter((r) => r.title !== recipe.title));
    userService.sendFeedback({ session_id: sessionId, recipe_title: recipe.title, liked: false, missing_ingredients: [], cooked: false }).catch(() => {});
    Alert.alert("👎 Noted", "This recipe won't be suggested again.");
  }, [sessionId]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <AppText className="text-[26px] font-bold text-foreground">
                {hasResults ? mealLabel : "Recipes 🍽️"}
              </AppText>
              <AppText className="text-[15px] text-muted-foreground mt-1">
                {hasResults ? `${recipes.length} recipes matched to your fridge` : "Based on your fridge and your goals"}
              </AppText>
            </View>
            {hasResults && (
              <Pressable
                onPress={() => router.push("/(tabs)/frigo")}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-2 border active:opacity-70"
                style={{ borderColor: colors.border, backgroundColor: colors.white }}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.sage} />
                <AppText className="text-[13px] font-medium" style={{ color: colors.sage }}>Run again</AppText>
              </Pressable>
            )}
          </View>
        </View>

        <View className="px-5 gap-4">
          {hasResults ? (
            <>
              {/* Résumé */}
              <View className="flex-row rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
                <View className="flex-1 items-center py-4 px-2 border-r border-border">
                  <AppText className="text-[22px] font-bold text-foreground">{recipes.length}</AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">recipes found</AppText>
                </View>
                <View className="flex-1 items-center py-4 px-2 border-r border-border">
                  <AppText className="text-[22px] font-bold" style={{ color: colors.sage }}>
                    {recipes.filter((r) => r.calorie_fit === "perfect").length}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">on-target calories</AppText>
                </View>
                <View className="flex-1 items-center py-4 px-2">
                  <AppText className="text-[22px] font-bold" style={{ color: colors.macroProtein }}>
                    {profile.calorieTarget || 2100}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">kcal goal</AppText>
                </View>
              </View>

              {/* Recettes */}
              {recipes.map((recipe, i) => (
                <RecipeCard
                  key={`${recipe.title}_${i}`}
                  recipe={recipe}
                  onFeedback={setFeedbackRecipe}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  isLiked={isLiked(recipe.title)}
                />
              ))}
            </>
          ) : (
            <View className="items-center py-16 gap-4">
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.sageMuted }}>
                <Ionicons name="restaurant-outline" size={32} color={colors.sage} />
              </View>
              <AppText className="text-[16px] font-semibold text-foreground text-center">No suggestions yet</AppText>
              <AppText className="text-[14px] text-muted-foreground text-center px-8">
                Go to the Fridge tab and tap "Suggest recipes" to get started.
              </AppText>
              <Pressable onPress={() => router.push("/(tabs)/frigo")} className="rounded-2xl px-6 py-3.5 mt-2 active:opacity-80" style={{ backgroundColor: colors.sage }}>
                <AppText className="text-[15px] font-bold text-white">Open my fridge</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <FeedbackModal recipe={feedbackRecipe} visible={feedbackRecipe !== null} onClose={() => setFeedbackRecipe(null)} sessionId={sessionId} />
    </View>
  );
}
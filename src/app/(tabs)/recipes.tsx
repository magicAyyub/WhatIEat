import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useProfileStore } from "@/store/profile-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import React from "react";

// ── Config API ─────────────────────────────────────────────────────────────
const API_BASE = "http://172.20.10.5:8000";
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Petit-déjeuner",
  lunch:     "Déjeuner",
  dinner:    "Dîner",
  snack:     "Snack",
};

const CALORIE_FIT_CONFIG: Record<string, { label: string; color: string }> = {
  perfect: { label: "✓ Calories adaptées", color: colors.sage },
  low:     { label: "↓ Peu calorique",     color: colors.macroCarbs },
  high:    { label: "↑ Riche en calories", color: colors.destructive },
  unknown: { label: "",                    color: colors.mutedText },
};

// ── Types ──────────────────────────────────────────────────────────────────

type RecipeStep = { step: number; instruction: string };
type Nutrition  = {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  total_fat_g?: number;
};
type ApiRecipe = {
  title: string;
  score: number;
  matched_ingredients: string[];
  missing_ingredients: string[];
  all_ingredients: string[];
  steps: RecipeStep[];
  nutrition: Nutrition;
  meal_type?: string;
  minutes?: number;
  calorie_fit?: string;
};

// ── Composant carte recette ────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onFeedback,
}: {
  recipe: ApiRecipe;
  onFeedback: (recipe: ApiRecipe) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const calFit = CALORIE_FIT_CONFIG[recipe.calorie_fit || "unknown"];
  const matchPct = Math.round(
    (recipe.matched_ingredients.length /
      Math.max(recipe.all_ingredients.length, 1)) *
      100,
  );

  return (
    <View
      className="rounded-2xl border mb-3 overflow-hidden"
      style={{ backgroundColor: colors.white, borderColor: colors.border }}
    >
      {/* En-tête */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="px-4 pt-4 pb-3 active:opacity-80"
      >
        <View className="flex-row items-start justify-between gap-2 mb-2">
          <AppText
            className="text-[16px] font-bold text-foreground flex-1"
            numberOfLines={2}
          >
            {recipe.title}
          </AppText>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.mutedText}
          />
        </View>

        {/* Métadonnées */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {recipe.minutes && (
            <View
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
              style={{ backgroundColor: colors.sageMuted }}
            >
              <Ionicons name="time-outline" size={12} color={colors.sage} />
              <AppText className="text-[12px] font-medium" style={{ color: colors.sage }}>
                {recipe.minutes} min
              </AppText>
            </View>
          )}
          {recipe.nutrition?.calories && (
            <View
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1 border"
              style={{ borderColor: colors.border }}
            >
              <AppText className="text-[12px] font-medium text-foreground">
                {Math.round(recipe.nutrition.calories)} kcal
              </AppText>
            </View>
          )}
          {calFit.label ? (
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: `${calFit.color}18` }}
            >
              <AppText className="text-[12px] font-medium" style={{ color: calFit.color }}>
                {calFit.label}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Barre de correspondance */}
        <View className="gap-1">
          <View className="flex-row justify-between">
            <AppText className="text-[12px] text-muted-foreground">
              {recipe.matched_ingredients.length}/{recipe.all_ingredients.length} ingrédients disponibles
            </AppText>
            <AppText className="text-[12px] font-semibold" style={{ color: colors.sage }}>
              {matchPct}%
            </AppText>
          </View>
          <View
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${matchPct}%`,
                backgroundColor: matchPct >= 70 ? colors.sage : colors.macroCarbs,
              }}
            />
          </View>
        </View>
      </Pressable>

      {/* Détails dépliables */}
      {expanded && (
        <View className="px-4 pb-4 gap-4">
          {/* Macros */}
          {recipe.nutrition && (
            <View
              className="flex-row rounded-xl overflow-hidden border"
              style={{ borderColor: colors.border }}
            >
              {[
                { label: "Protéines", value: recipe.nutrition.protein_g, color: colors.macroProtein, unit: "g" },
                { label: "Glucides",  value: recipe.nutrition.carbs_g,   color: colors.macroCarbs,   unit: "g" },
                { label: "Lipides",   value: recipe.nutrition.total_fat_g, color: colors.macroFat,   unit: "g" },
              ].map((macro, i) => (
                <View
                  key={macro.label}
                  className="flex-1 items-center py-2.5"
                  style={{
                    borderRightWidth: i < 2 ? 1 : 0,
                    borderRightColor: colors.border,
                  }}
                >
                  <AppText
                    className="text-[15px] font-bold"
                    style={{ color: macro.color }}
                  >
                    {macro.value ? `${Math.round(macro.value)}${macro.unit}` : "—"}
                  </AppText>
                  <AppText className="text-[11px] text-muted-foreground mt-0.5">
                    {macro.label}
                  </AppText>
                </View>
              ))}
            </View>
          )}

          {/* Ingrédients manquants */}
          {recipe.missing_ingredients.length > 0 && (
            <View>
              <AppText className="text-[13px] font-semibold text-foreground mb-2">
                Ingrédients manquants
              </AppText>
              <View className="flex-row flex-wrap gap-1.5">
                {recipe.missing_ingredients.map((ing, i) => (
                  <View
                    key={i}
                    className="rounded-full px-3 py-1 border"
                    style={{
                      backgroundColor: colors.expiringBg,
                      borderColor: colors.expiringBorder,
                    }}
                  >
                    <AppText
                      className="text-[12px]"
                      style={{ color: colors.destructive }}
                    >
                      {ing}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Étapes */}
          <View>
            <AppText className="text-[13px] font-semibold text-foreground mb-2">
              Préparation
            </AppText>
            {recipe.steps.map((s) => (
              <View key={s.step} className="flex-row gap-3 mb-2.5">
                <View
                  className="w-5 h-5 rounded-full items-center justify-center mt-0.5 shrink-0"
                  style={{ backgroundColor: colors.sageMuted }}
                >
                  <AppText
                    className="text-[11px] font-bold"
                    style={{ color: colors.sage }}
                  >
                    {s.step}
                  </AppText>
                </View>
                <AppText className="text-[13px] text-foreground flex-1 leading-5">
                  {s.instruction}
                </AppText>
              </View>
            ))}
          </View>

          {/* Actions feedback */}
          <View className="flex-row gap-2 pt-1">
            <Pressable
              onPress={() => onFeedback(recipe)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 border active:opacity-70"
              style={{ borderColor: colors.border }}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.mutedText} />
              <AppText className="text-[13px] font-medium text-muted-foreground">
                Ingrédients manquants
              </AppText>
            </Pressable>
            <Pressable
              className="w-12 h-12 rounded-xl items-center justify-center border active:opacity-70"
              style={{ borderColor: colors.border }}
              onPress={() =>
                Alert.alert("Recette sauvegardée", `"${recipe.title}" ajoutée à tes favoris.`)
              }
            >
              <Ionicons name="bookmark-outline" size={20} color={colors.sage} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Modal feedback ingrédients manquants ───────────────────────────────────

function FeedbackModal({
  recipe,
  visible,
  onClose,
  sessionId,
}: {
  recipe: ApiRecipe | null;
  visible: boolean;
  onClose: () => void;
  sessionId: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [substitutes, setSubstitutes] = useState<
    { original: string; substitutes: string[]; notes: string }[]
  >([]);

  if (!recipe) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id:          sessionId,
          recipe_title:        recipe.title,
          liked:               null,
          missing_ingredients: recipe.missing_ingredients,
          cooked:              false,
        }),
      });
      const data = await res.json();
      setSubstitutes(data.substitutes || []);
    } catch {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl px-5 pt-5 pb-10 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-4">
            <AppText className="text-[17px] font-bold text-foreground">
              Ingrédients manquants
            </AppText>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {substitutes.length === 0 ? (
              <>
                <AppText className="text-[14px] text-muted-foreground mb-4">
                  Ces ingrédients manquent pour "{recipe.title}" :
                </AppText>
                <View className="gap-2 mb-5">
                  {recipe.missing_ingredients.map((ing, i) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-3 rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: colors.expiringBg,
                        borderColor: colors.expiringBorder,
                      }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={colors.destructive}
                      />
                      <AppText className="text-[14px] text-foreground">{ing}</AppText>
                    </View>
                  ))}
                </View>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  className="rounded-2xl py-4 items-center active:opacity-80"
                  style={{ backgroundColor: colors.sage }}
                >
                  <AppText className="text-[15px] font-bold text-white">
                    {submitting ? "Recherche de substituts..." : "Voir les substituts"}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                <AppText className="text-[14px] text-muted-foreground mb-4">
                  Voici des substituts pour les ingrédients manquants :
                </AppText>
                {substitutes.map((sub, i) => (
                  <View
                    key={i}
                    className="rounded-xl border px-4 py-3 mb-3"
                    style={{
                      backgroundColor: colors.white,
                      borderColor: colors.border,
                    }}
                  >
                    <AppText className="text-[14px] font-semibold text-foreground mb-1">
                      {sub.original}
                    </AppText>
                    {sub.substitutes.length > 0 ? (
                      sub.substitutes.map((s, j) => (
                        <View key={j} className="flex-row items-start gap-2 mt-1">
                          <AppText style={{ color: colors.sage }}>→</AppText>
                          <AppText className="text-[13px] text-foreground flex-1">{s}</AppText>
                        </View>
                      ))
                    ) : (
                      <AppText className="text-[13px] text-muted-foreground">
                        {sub.notes}
                      </AppText>
                    )}
                  </View>
                ))}
                <Pressable
                  onPress={onClose}
                  className="rounded-2xl py-4 items-center mt-2 active:opacity-80"
                  style={{ backgroundColor: colors.sage }}
                >
                  <AppText className="text-[15px] font-bold text-white">Fermer</AppText>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Écran principal recettes ───────────────────────────────────────────────

export default function RecipesScreen() {
  const { profile } = useProfileStore();
  const router = useRouter();
  const params = useLocalSearchParams<{
    apiResults?: string;
    mealType?: string;
    mealLabel?: string;
  }>();

  const [feedbackRecipe, setFeedbackRecipe] = useState<ApiRecipe | null>(null);

  // Résultats API passés depuis frigo.tsx
  const apiRecipes: ApiRecipe[] = params.apiResults
    ? JSON.parse(params.apiResults)
    : [];

  const mealLabel = params.mealLabel || "Recettes";
  const hasResults = apiRecipes.length > 0;

  // session_id simple basé sur le profil (à remplacer par un vrai auth token)
  const sessionId = `user_${profile.firstName}_${profile.age}`;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <AppText className="text-[26px] font-bold text-foreground">
                {hasResults ? mealLabel : "Recettes 🍽️"}
              </AppText>
              <AppText className="text-[15px] text-muted-foreground mt-1">
                {hasResults
                  ? `${apiRecipes.length} recettes adaptées à ton frigo`
                  : "Basées sur votre frigo et vos objectifs"}
              </AppText>
            </View>
            {hasResults && (
              <Pressable
                onPress={() => router.push("/(tabs)/frigo")}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-2 border active:opacity-70"
                style={{ borderColor: colors.border, backgroundColor: colors.white }}
              >
                <Ionicons name="refresh-outline" size={14} color={colors.sage} />
                <AppText className="text-[13px] font-medium" style={{ color: colors.sage }}>
                  Relancer
                </AppText>
              </Pressable>
            )}
          </View>
        </View>

        <View className="px-5 gap-4">
          {hasResults ? (
            <>
              {/* Résumé nutritionnel */}
              <View
                className="flex-row rounded-2xl border overflow-hidden"
                style={{ backgroundColor: colors.white, borderColor: colors.border }}
              >
                <View className="flex-1 items-center py-4 px-2 border-r border-border">
                  <AppText className="text-[22px] font-bold text-foreground">
                    {apiRecipes.length}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">
                    recettes trouvées
                  </AppText>
                </View>
                <View className="flex-1 items-center py-4 px-2 border-r border-border">
                  <AppText
                    className="text-[22px] font-bold"
                    style={{ color: colors.sage }}
                  >
                    {apiRecipes.filter((r) => r.calorie_fit === "perfect").length}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">
                    calories adaptées
                  </AppText>
                </View>
                <View className="flex-1 items-center py-4 px-2">
                  <AppText
                    className="text-[22px] font-bold"
                    style={{ color: colors.macroProtein }}
                  >
                    {profile.calorieTarget || 2100}
                  </AppText>
                  <AppText className="text-[12px] text-muted-foreground text-center mt-1">
                    kcal objectif
                  </AppText>
                </View>
              </View>

              {/* Liste des recettes */}
              {apiRecipes.map((recipe, i) => (
                <RecipeCard
                  key={i}
                  recipe={recipe}
                  onFeedback={setFeedbackRecipe}
                />
              ))}
            </>
          ) : (
            /* État vide — invite à aller sur le frigo */
            <View className="items-center py-16 gap-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.sageMuted }}
              >
                <Ionicons name="restaurant-outline" size={32} color={colors.sage} />
              </View>
              <AppText className="text-[16px] font-semibold text-foreground text-center">
                Pas encore de suggestions
              </AppText>
              <AppText className="text-[14px] text-muted-foreground text-center px-8">
                Va dans l'onglet Frigo et appuie sur "Suggérer des recettes" pour commencer.
              </AppText>
              <Pressable
                onPress={() => router.push("/(tabs)/frigo")}
                className="rounded-2xl px-6 py-3.5 mt-2 active:opacity-80"
                style={{ backgroundColor: colors.sage }}
              >
                <AppText className="text-[15px] font-bold text-white">
                  Ouvrir mon frigo
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal feedback */}
      <FeedbackModal
        recipe={feedbackRecipe}
        visible={feedbackRecipe !== null}
        onClose={() => setFeedbackRecipe(null)}
        sessionId={sessionId}
      />
    </View>
  );
}
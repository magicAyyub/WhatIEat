/**
 * app/(tabs)/index.tsx
 */

import { ExpiringItemRow } from "@/components/whatieat/expiring-item-row";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useProfileStore } from "@/store/profile-store";
import { useFridgeStore } from "@/store";
import { useNutritionStore, type MealLog } from "@/store/nutrition-store";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";

const DEFAULT_CALORIE_TARGET = 2100;

// ── Calcul macros selon objectif ──────────────────────────────────────────

type MacroTargets = { protein: number; carbs: number; fat: number };

function getMacroTargets(kcal: number, objective: string): MacroTargets {
  const ratios: Record<string, { p: number; c: number; f: number }> = {
    "weight-loss": { p: 0.35, c: 0.35, f: 0.30 },
    "muscle-gain": { p: 0.30, c: 0.45, f: 0.25 },
    "maintenance": { p: 0.25, c: 0.50, f: 0.25 },
    "endurance":   { p: 0.20, c: 0.55, f: 0.25 },
    "weight_loss": { p: 0.35, c: 0.35, f: 0.30 },
    "muscle_gain": { p: 0.30, c: 0.45, f: 0.25 },
  };
  const r = ratios[objective] ?? ratios["maintenance"];
  return {
    protein: Math.round((kcal * r.p) / 4),
    carbs:   Math.round((kcal * r.c) / 4),
    fat:     Math.round((kcal * r.f) / 9),
  };
}

// ── Cercle macro avec texte consommé/restant ──────────────────────────────

function MacroCircle({ label, current, target, color }: {
  label:   string;
  current: number;
  target:  number;
  color:   string;
}) {
  const size       = 80;
  const stroke     = 7;
  const radius     = (size - stroke) / 2;
  const circumf    = 2 * Math.PI * radius;
  const pct        = Math.min(current / Math.max(target, 1), 1);
  const dash       = pct * circumf;
  const remaining  = Math.max(0, target - current);
  const over       = current > target;

  return (
    <View className="flex-1 items-center">
      {/* Cercle SVG */}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={`${color}22`} strokeWidth={stroke} fill="none"
          />
          {/* Progress */}
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={over ? colors.destructive : color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${circumf - dash}`}
            strokeDashoffset={circumf / 4}
            strokeLinecap="round"
          />
        </Svg>
        {/* Texte au centre */}
        <View className="absolute inset-0 items-center justify-center">
          <AppText className="text-[13px] font-bold" style={{ color: over ? colors.destructive : color }}>
            {current}g
          </AppText>
        </View>
      </View>

      {/* Label */}
      <AppText className="text-[12px] font-semibold mt-1" style={{ color }}>
        {label}
      </AppText>

      {/* Consommé / Restant */}
      <AppText className="text-[10px] text-muted-foreground mt-0.5">
        {current}g eaten
      </AppText>
      <AppText
        className="text-[10px] font-medium mt-0.5"
        style={{ color: over ? colors.destructive : colors.mutedText }}
      >
        {over ? `+${current - target}g over` : `${remaining}g left`}
      </AppText>
    </View>
  );
}

// ── Helpers repas ─────────────────────────────────────────────────────────

const MEAL_META: Record<string, { label: string; emoji: string; color: string; calRatio: number }> = {
  breakfast: { label: "Breakfast", emoji: "☀️",  color: "#F59E0B",         calRatio: 0.25 },
  lunch:     { label: "Lunch",     emoji: "🥗",  color: colors.sage,       calRatio: 0.35 },
  dinner:    { label: "Dinner",    emoji: "🌙",  color: "#6366F1",         calRatio: 0.35 },
  snack:     { label: "Snack",     emoji: "🍎",  color: colors.macroCarbs, calRatio: 0.10 },
  meal:      { label: "Meal",      emoji: "🍽️", color: colors.mutedText,  calRatio: 0    },
};
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack", "meal"] as const;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── Écran ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router      = useRouter();
  const { profile } = useProfileStore();
  const ingredients = useFridgeStore((s) => s.ingredients);
  const nutrition   = useNutritionStore();

  // Recharge les repas depuis la DB à chaque mount
  useEffect(() => {
    nutrition.loadFromDB();
  }, []);

  const calorieTarget     = profile.calorieTarget || DEFAULT_CALORIE_TARGET;
  const caloriesCurrent   = Math.round(nutrition.totalCalories());
  const caloriesRemaining = Math.max(0, calorieTarget - caloriesCurrent);
  const calorieProgress   = Math.min(caloriesCurrent / calorieTarget, 1);
  const calorieOver       = caloriesCurrent > calorieTarget;

  const macroTargets   = getMacroTargets(calorieTarget, profile.sportsObjective);
  const proteinCurrent = Math.round(nutrition.totalProtein());
  const carbsCurrent   = Math.round(nutrition.totalCarbs());
  const fatCurrent     = Math.round(nutrition.totalFat());

  const homeExpiringItems = ingredients
    .map((ing) => {
      let expiresIn: number | undefined;
      if (ing.expiresAt) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const exp   = new Date(ing.expiresAt); exp.setHours(0, 0, 0, 0);
        expiresIn   = Math.max(0, Math.ceil((exp.getTime() - today.getTime()) / 86400000));
      }
      return { name: ing.name, quantity: ing.quantity || "1", expiresIn, icon: ing.icon || "food-variant" };
    })
    .filter((i) => i.expiresIn !== undefined && i.expiresIn <= 2);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-5 pt-14 pb-5">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="sunny-outline" size={14} color={colors.macroCarbs} />
                <AppText className="text-[14px] text-muted-foreground">{getGreeting()}</AppText>
              </View>
              <AppText className="text-[26px] font-bold text-foreground leading-tight">
                {profile.firstName ? `Hi, ${profile.firstName} 👋` : "My nutrition"}
              </AppText>
            </View>
            <View className="w-11 h-11 rounded-full items-center justify-center" style={{ backgroundColor: colors.sage }}>
              <AppText className="text-[17px] font-bold text-white">
                {profile.firstName.trim().charAt(0).toUpperCase() || "A"}
              </AppText>
            </View>
          </View>
        </View>

        <View className="px-5 gap-5">

          {/* ── Carte calories + macros ──────────────────────────────── */}
          <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.white, borderColor: colors.border }}>

            {/* Calories */}
            <View className="px-4 pt-4 pb-3">
              <View className="flex-row justify-between items-center mb-2">
                <AppText className="text-[13px] font-semibold text-muted-foreground">CALORIES — TODAY</AppText>
                <AppText className="text-[13px] text-muted-foreground">Goal: {calorieTarget} kcal</AppText>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <AppText className="text-[28px] font-bold" style={{ color: calorieOver ? colors.destructive : colors.foreground }}>
                    {caloriesCurrent}
                    <AppText className="text-[16px] font-normal text-muted-foreground"> kcal</AppText>
                  </AppText>
                  <AppText className="text-[13px]" style={{ color: calorieOver ? colors.destructive : colors.sage }}>
                    {calorieOver
                      ? `+${caloriesCurrent - calorieTarget} kcal over goal`
                      : `${caloriesRemaining} kcal remaining`}
                  </AppText>
                </View>
                {/* Mini cercle calories */}
                <View style={{ width: 56, height: 56 }}>
                  <Svg width={56} height={56}>
                    <Circle cx={28} cy={28} r={23} stroke={`${colors.sage}22`} strokeWidth={6} fill="none" />
                    <Circle
                      cx={28} cy={28} r={23}
                      stroke={calorieOver ? colors.destructive : colors.sage}
                      strokeWidth={6} fill="none"
                      strokeDasharray={`${calorieProgress * 144.5} ${(1 - calorieProgress) * 144.5}`}
                      strokeDashoffset={36}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View className="absolute inset-0 items-center justify-center">
                    <AppText className="text-[10px] font-bold" style={{ color: calorieOver ? colors.destructive : colors.sage }}>
                      {Math.round(calorieProgress * 100)}%
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Barre progression */}
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${calorieProgress * 100}%`, backgroundColor: calorieOver ? colors.destructive : colors.sage }}
                />
              </View>
            </View>

            {/* Séparateur */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Macros — cercles avec consommé/restant */}
            <View className="px-4 py-4">
              <AppText className="text-[12px] font-semibold text-muted-foreground mb-4">MACROS</AppText>
              <View className="flex-row justify-around">
                <MacroCircle label="Protein" current={proteinCurrent} target={macroTargets.protein} color={colors.macroProtein} />
                <MacroCircle label="Carbs"   current={carbsCurrent}   target={macroTargets.carbs}   color={colors.macroCarbs}   />
                <MacroCircle label="Fat"     current={fatCurrent}     target={macroTargets.fat}      color={colors.macroFat}     />
              </View>
            </View>

            {/* Séparateur + repas */}
            {nutrition.meals.length > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View className="px-4 pt-3 pb-2">
                  <AppText className="text-[12px] font-semibold text-muted-foreground mb-3">TODAY'S MEALS</AppText>
                  {MEAL_ORDER.map((type) => {
                    const group = nutrition.meals.filter((m: MealLog) => m.meal_type === type);
                    if (group.length === 0) return null;
                    const meta       = MEAL_META[type];
                    const groupCals  = Math.round(group.reduce((s: number, m: MealLog) => s + m.calories, 0));
                    const groupProt  = Math.round(group.reduce((s: number, m: MealLog) => s + m.protein_g, 0));
                    const groupCarb  = Math.round(group.reduce((s: number, m: MealLog) => s + m.carbs_g, 0));
                    const groupFat   = Math.round(group.reduce((s: number, m: MealLog) => s + m.fat_g, 0));
                    const mealTarget = meta.calRatio > 0 ? Math.round(calorieTarget * meta.calRatio) : null;
                    const mealPct    = mealTarget ? Math.min(groupCals / mealTarget, 1) : 0;

                    return (
                      <View key={type} className="mb-4">
                        {/* En-tête */}
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-2">
                            <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: `${meta.color}18` }}>
                              <AppText className="text-[13px]">{meta.emoji}</AppText>
                            </View>
                            <View>
                              <AppText className="text-[14px] font-semibold" style={{ color: meta.color }}>
                                {meta.label}
                              </AppText>
                              {mealTarget && (
                                <AppText className="text-[10px] text-muted-foreground">
                                  {groupCals} / {mealTarget} kcal
                                </AppText>
                              )}
                            </View>
                          </View>
                          <View className="items-end">
                            <AppText className="text-[14px] font-bold" style={{ color: meta.color }}>
                              {groupCals} kcal
                            </AppText>
                            <AppText className="text-[10px] text-muted-foreground">
                              P{groupProt}g · C{groupCarb}g · F{groupFat}g
                            </AppText>
                          </View>
                        </View>

                        {/* Barre du repas */}
                        {mealTarget && (
                          <View className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: `${meta.color}20` }}>
                            <View className="h-full rounded-full" style={{ width: `${mealPct * 100}%`, backgroundColor: meta.color }} />
                          </View>
                        )}

                        {/* Items */}
                        <View className="rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
                          {group.map((meal: MealLog, i: number) => (
                            <View
                              key={`${type}_${meal.id}_${i}`}
                              className="flex-row items-center justify-between px-3 py-2.5"
                              style={{ backgroundColor: colors.white, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}
                            >
                              <View className="flex-1 pr-3">
                                <AppText className="text-[13px] text-foreground font-medium" numberOfLines={1}>
                                  {meal.title}
                                </AppText>
                                <AppText className="text-[11px] text-muted-foreground mt-0.5">
                                  P {Math.round(meal.protein_g)}g · C {Math.round(meal.carbs_g)}g · F {Math.round(meal.fat_g)}g
                                </AppText>
                              </View>
                              <AppText className="text-[13px] font-semibold" style={{ color: meta.color }}>
                                {Math.round(meal.calories)} kcal
                              </AppText>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* CTA si aucun repas */}
            {nutrition.meals.length === 0 && (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <Pressable
                  onPress={() => router.push("/(tabs)/liked")}
                  className="mx-4 my-3 flex-row items-center justify-center gap-2 rounded-xl py-3 border"
                  style={{ borderColor: colors.border }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={colors.sage} />
                  <AppText className="text-[13px] font-medium" style={{ color: colors.sage }}>
                    Log a meal from liked recipes
                  </AppText>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Bouton scan ─────────────────────────────────────────── */}
          <Pressable onPress={() => router.push("/(tabs)/scan")} className="rounded-2xl overflow-hidden active:opacity-90 shadow-sm border border-zinc-100">
            <LinearGradient colors={["#3D6B4D", "#588E6B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
            <View className="flex-row items-center gap-4 px-5 py-5">
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <View className="bg-white/20 rounded-full px-2 py-0.5">
                    <AppText className="text-[10px] font-bold text-white uppercase tracking-wider">AI Detection</AppText>
                  </View>
                </View>
                <AppText className="text-[17px] font-bold text-white leading-tight">Scan your fridge</AppText>
                <AppText className="text-[13px] text-white/80 mt-1">Identify and add ingredients instantly</AppText>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#fff" />
            </View>
          </Pressable>

          {/* ── Expirants ────────────────────────────────────────────── */}
          {homeExpiringItems.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="flash" size={16} color={colors.macroCarbs} />
                  <AppText className="text-[15px] font-bold text-foreground">Use soon</AppText>
                </View>
                <Pressable onPress={() => router.push("/(tabs)/frigo")}>
                  <AppText className="text-[13px] font-semibold" style={{ color: colors.sage }}>See fridge →</AppText>
                </Pressable>
              </View>
              <View className="gap-2">
              {homeExpiringItems.map((item, i) => (
              <ExpiringItemRow key={`${item.name}_${i}`} item={item} onPress={() => router.push("/(tabs)/frigo")} />
            ))}
              </View>
            </View>
          )}

          {/* ── Shortcut recettes ────────────────────────────────────── */}
          <Pressable onPress={() => router.push("/(tabs)/frigo")} className="flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80" style={{ backgroundColor: colors.white, borderColor: colors.border }}>
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.sageMuted }}>
              <Ionicons name="restaurant-outline" size={20} color={colors.sage} />
            </View>
            <View className="flex-1">
              <AppText className="text-[15px] font-semibold text-foreground">Get recipe suggestions</AppText>
              <AppText className="text-[13px] text-muted-foreground mt-0.5">
                {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} in your fridge
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
          </Pressable>

        </View>
      </ScrollView>
    </View>
  );
}
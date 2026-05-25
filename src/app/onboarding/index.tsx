import { ContinueButton } from "@/components/onboarding/continue-button";
import { FormField } from "@/components/onboarding/form-field";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { SelectCard } from "@/components/onboarding/select-card";
import { AppText } from "@/components/ui/app-text";
import {
  ACTIVITY_OPTIONS,
  ACTIVITY_LABELS,
  ALLERGY_OPTIONS,
  GOAL_OPTIONS,
  OBJECTIVE_LABELS,
} from "@/constants/onboarding";
import { colors } from "@/constants/colors";
import { useProfileStore } from "@/store/profile-store";
import type { ActivityLevel, SportsObjective, UserProfile } from "@/types/profile";
import { calculateCalorieTarget } from "@/utils/calories";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

const CONTENT_STEPS = 4;
const STEP_TITLES = [
  "Profil",
  "Objectif",
  "Allergies",
  "Activité",
  "C'est parti",
] as const;
const STEP_ICONS = [
  "person-outline",
  "flag-outline",
  "alert-circle-outline",
  "barbell-outline",
  "checkmark-circle-outline",
] as const;

function buildDraftProfile(
  firstName: string,
  age: string,
  weight: string,
  height: string,
  goal: SportsObjective,
  allergies: string[],
  activity: ActivityLevel,
): UserProfile {
  const base = {
    firstName: firstName.trim(),
    age: parseInt(age, 10) || 25,
    weightKg: parseFloat(weight) || 75,
    heightCm: parseFloat(height) || 178,
    sportsObjective: goal,
    dietaryRestrictions: allergies,
    activityLevel: activity,
    hasCompletedOnboarding: false,
    calorieTarget: 2100,
  };
  return {
    ...base,
    calorieTarget: calculateCalorieTarget(base),
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { edit, step: stepParam } = useLocalSearchParams<{
    edit?: string;
    step?: string;
  }>();
  const isEdit = edit === "true";
  const initialStep = stepParam
    ? Math.min(CONTENT_STEPS - 1, Math.max(0, Number(stepParam)))
    : 0;

  const { profile, setProfile, completeOnboarding } = useProfileStore();

  const [step, setStep] = useState(initialStep);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [age, setAge] = useState(String(profile.age || ""));
  const [weight, setWeight] = useState(String(profile.weightKg || ""));
  const [height, setHeight] = useState(String(profile.heightCm || ""));
  const [goal, setGoal] = useState<SportsObjective>(profile.sportsObjective);
  const [allergies, setAllergies] = useState<string[]>(profile.dietaryRestrictions);
  const [customAllergy, setCustomAllergy] = useState("");
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);

  const draftProfile = useMemo(
    () =>
      buildDraftProfile(
        firstName,
        age,
        weight,
        height,
        goal,
        allergies,
        activity,
      ),
    [firstName, age, weight, height, goal, allergies, activity],
  );

  const shellStep = step + 1;
  const shellTitle = STEP_TITLES[Math.min(step, STEP_TITLES.length - 1)];

  const persistStepData = useCallback(() => {
    if (step === 0) {
      setProfile({
        firstName: firstName.trim(),
        age: parseInt(age, 10) || profile.age,
        weightKg: parseFloat(weight) || profile.weightKg,
        heightCm: parseFloat(height) || profile.heightCm,
      });
    } else if (step === 1) {
      setProfile({ sportsObjective: goal });
    } else if (step === 2) {
      setProfile({ dietaryRestrictions: allergies });
    } else if (step === 3) {
      setProfile({ activityLevel: activity });
    }
  }, [
    step,
    firstName,
    age,
    weight,
    height,
    goal,
    allergies,
    activity,
    profile,
    setProfile,
  ]);

  const canContinue = () => {
    if (step === 0) {
      return (
        firstName.trim().length > 0 &&
        parseInt(age, 10) > 0 &&
        parseFloat(weight) > 0 &&
        parseFloat(height) > 0
      );
    }
    return true;
  };

  const finish = () => {
    setProfile({
      firstName: firstName.trim(),
      age: parseInt(age, 10) || profile.age,
      weightKg: parseFloat(weight) || profile.weightKg,
      heightCm: parseFloat(height) || profile.heightCm,
      sportsObjective: goal,
      dietaryRestrictions: allergies,
      activityLevel: activity,
    });
    if (isEdit) {
      router.back();
      return;
    }
    completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleContinue = () => {
    persistStepData();
    if (isEdit) {
      finish();
      return;
    }
    if (step < CONTENT_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    if (step === CONTENT_STEPS - 1) {
      setStep(CONTENT_STEPS);
      return;
    }
    finish();
  };

  const handleBack = () => {
    if (step > 0) {
      persistStepData();
      setStep(step - 1);
      return;
    }
    if (isEdit) {
      router.back();
    }
  };

  const toggleAllergy = (name: string) => {
    setAllergies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (!trimmed || allergies.includes(trimmed)) return;
    setAllergies((prev) => [...prev, trimmed]);
    setCustomAllergy("");
  };

  const skipAllergies = () => {
    setAllergies([]);
    setProfile({ dietaryRestrictions: [] });
    setStep(3);
  };

  const continueLabel = () => {
    if (isEdit) return "Enregistrer";
    if (step === CONTENT_STEPS) return "C'est parti !";
    if (step === CONTENT_STEPS - 1) return "Continuer";
    return "Continuer";
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <AppText className="text-[15px] text-muted-foreground mb-6">
                Faisons connaissance pour personnaliser ton suivi.
              </AppText>
              <FormField
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Alex"
                className="mb-4"
              />
              <View className="flex-row gap-3 mb-4">
                <FormField
                  label="Poids (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="75"
                  keyboardType="decimal-pad"
                  className="flex-1"
                />
                <FormField
                  label="Taille (cm)"
                  value={height}
                  onChangeText={setHeight}
                  placeholder="178"
                  keyboardType="numeric"
                  className="flex-1"
                />
              </View>
              <FormField
                label="Âge"
                value={age}
                onChangeText={setAge}
                placeholder="25"
                keyboardType="numeric"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 1:
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText className="text-[15px] text-muted-foreground mb-4">
              Quel est ton objectif principal ?
            </AppText>
            {GOAL_OPTIONS.map((option) => (
              <SelectCard
                key={option.id}
                emoji={option.emoji}
                title={option.title}
                subtitle={option.subtitle}
                selected={goal === option.id}
                onPress={() => setGoal(option.id)}
              />
            ))}
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText className="text-[15px] text-muted-foreground mb-4">
              Sélectionne tes allergies et intolérances (optionnel).
            </AppText>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ALLERGY_OPTIONS.map((name) => {
                const selected = allergies.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleAllergy(name)}
                    className="rounded-full px-4 py-2.5 border"
                    style={{
                      backgroundColor: selected ? colors.sageMuted : colors.white,
                      borderColor: selected ? colors.sage : colors.border,
                    }}
                  >
                    <AppText
                      className={`text-[14px] font-medium ${
                        selected ? "text-sage" : "text-foreground"
                      }`}
                    >
                      {name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={customAllergy}
                onChangeText={setCustomAllergy}
                placeholder="Autre allergie..."
                className="flex-1 rounded-xl border px-4 py-3.5 text-[15px]"
                style={{
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.mutedText}
                onSubmitEditing={addCustomAllergy}
              />
              <Pressable
                onPress={addCustomAllergy}
                className="w-12 h-12 rounded-xl items-center justify-center border"
                style={{
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="add" size={24} color={colors.sage} />
              </Pressable>
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText className="text-[15px] text-muted-foreground mb-4">
              Quel est ton niveau d&apos;activité physique ?
            </AppText>
            {ACTIVITY_OPTIONS.map((option) => (
              <SelectCard
                key={option.id}
                emoji={option.emoji}
                title={option.title}
                selected={activity === option.id}
                onPress={() => setActivity(option.id)}
              />
            ))}
          </ScrollView>
        );

      case 4:
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText className="text-[15px] text-muted-foreground mb-6">
              {draftProfile.firstName
                ? `Parfait ${draftProfile.firstName}, voici ton profil personnalisé :`
                : "Voici ton profil personnalisé :"}
            </AppText>
            <View
              className="rounded-2xl border p-4 gap-3"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
              }}
            >
              <SummaryRow
                label="Objectif"
                value={OBJECTIVE_LABELS[draftProfile.sportsObjective]}
              />
              <SummaryRow
                label="Calories / jour"
                value={`${draftProfile.calorieTarget} kcal`}
                highlight
              />
              <SummaryRow
                label="Activité"
                value={ACTIVITY_LABELS[draftProfile.activityLevel]}
              />
              <SummaryRow
                label="Allergies"
                value={
                  draftProfile.dietaryRestrictions.length > 0
                    ? draftProfile.dietaryRestrictions.join(", ")
                    : "Aucune"
                }
              />
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const showBack = step > 0 || isEdit;

  return (
    <OnboardingShell
      step={shellStep}
      title={shellTitle}
      headerIcon={STEP_ICONS[Math.min(step, STEP_ICONS.length - 1)]}
      onBack={showBack ? handleBack : undefined}
      footer={
        <View className="gap-3">
          <ContinueButton
            onPress={handleContinue}
            disabled={!canContinue()}
            label={continueLabel()}
          />
          {step === 2 && !isEdit && (
            <Pressable onPress={skipAllergies} className="items-center py-1">
              <AppText className="text-[14px] text-muted-foreground">
                Passer cette étape
              </AppText>
            </Pressable>
          )}
        </View>
      }
    >
      {renderStep()}
    </OnboardingShell>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-start gap-3">
      <AppText className="text-[14px] text-muted-foreground">{label}</AppText>
      <AppText
        className={`text-[14px] font-semibold flex-1 text-right ${
          highlight ? "text-sage" : "text-foreground"
        }`}
      >
        {value}
      </AppText>
    </View>
  );
}

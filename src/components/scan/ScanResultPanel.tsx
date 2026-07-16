import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import type { Ingredient } from "@/types/ingredient";
import { resolveIngredientIcon } from "@/helpers/utils/icons";

const LEVELS = ["Low", "Medium", "High"] as const;

type QtyDraft = {
  kind: "count" | "level" | "text";
  value: string;
  suffix: string;
};

function parseQuantity(raw?: string, unit?: string): QtyDraft {
  const q = (raw ?? "").trim();
  if (unit === "level" || LEVELS.some((l) => l.toLowerCase() === q.toLowerCase())) {
    const match = LEVELS.find((l) => l.toLowerCase() === q.toLowerCase());
    return { kind: "level", value: match ?? "Medium", suffix: "" };
  }
  const m = q.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (m) {
    return {
      kind: "count",
      value: m[1],
      suffix: m[2].trim() || (unit === "pack" ? "pack" : "pieces"),
    };
  }
  return { kind: "text", value: q || "1", suffix: "" };
}

function formatQuantity(draft: QtyDraft): string {
  if (draft.kind === "level") return draft.value;
  if (draft.kind === "count") {
    const n = draft.value.trim();
    if (!n) return draft.suffix || "1";
    return draft.suffix ? `${n} ${draft.suffix}` : n;
  }
  return draft.value.trim() || "1";
}

type Props = {
  loading: boolean;
  error: string | null;
  ingredients: Ingredient[];
  confidenceText: string;
  onScanAnother: () => void;
  onAddIngredients: (selected: Ingredient[]) => void;
  onAddManually: () => void;
};

export function ScanResultPanel({
  loading,
  error,
  ingredients,
  confidenceText,
  onScanAnother,
  onAddIngredients,
  onAddManually,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const hasIngredients = ingredients.length > 0;
  const panelMaxHeight = Math.round(windowHeight * 0.58);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, QtyDraft>>({});

  useEffect(() => {
    setSelectedIds(new Set(ingredients.map((i) => i.id)));
    const drafts: Record<string, QtyDraft> = {};
    for (const item of ingredients) {
      drafts[item.id] = parseQuantity(item.quantity, item.unit);
    }
    setQtyDrafts(drafts);
  }, [ingredients]);

  const selectedCount = useMemo(
    () => ingredients.filter((i) => selectedIds.has(i.id)).length,
    [ingredients, selectedIds],
  );

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCount === ingredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ingredients.map((i) => i.id)));
    }
  };

  const bumpCount = (id: string, delta: number) => {
    setQtyDrafts((prev) => {
      const draft = prev[id];
      if (!draft || draft.kind !== "count") return prev;
      const current = parseFloat(draft.value) || 0;
      const next = Math.max(1, Math.round((current + delta) * 10) / 10);
      return { ...prev, [id]: { ...draft, value: String(next) } };
    });
  };

  const setLevel = (id: string, level: string) => {
    setQtyDrafts((prev) => ({
      ...prev,
      [id]: { kind: "level", value: level, suffix: "" },
    }));
  };

  const setTextQty = (id: string, value: string) => {
    setQtyDrafts((prev) => {
      const draft = prev[id] ?? { kind: "text" as const, value: "", suffix: "" };
      return { ...prev, [id]: { ...draft, kind: "text", value } };
    });
  };

  const handleAdd = () => {
    const selected = ingredients
      .filter((item) => selectedIds.has(item.id))
      .map((item) => {
        const draft = qtyDrafts[item.id] ?? parseQuantity(item.quantity, item.unit);
        return { ...item, quantity: formatQuantity(draft) };
      });
    if (selected.length === 0) return;
    onAddIngredients(selected);
  };

  return (
    <View
      className="rounded-t-3xl bg-white border-t border-zinc-100"
      style={{ maxHeight: panelMaxHeight }}
    >
      <ScrollView
        className="px-5 pt-5"
        style={{ flexGrow: 0, flexShrink: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <AppText className="text-[20px] font-bold text-foreground">
            Scan results
          </AppText>
          <View className="rounded-full px-3 py-1 bg-zinc-50 border border-zinc-100">
            <AppText className="text-[13px] font-semibold text-muted-foreground">
              Confidence {confidenceText}
            </AppText>
          </View>
        </View>

        {loading ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-4">
            <ActivityIndicator color={colors.sage} />
            <AppText className="text-[15px] font-medium text-muted-foreground">
              Analyzing image...
            </AppText>
          </View>
        ) : null}

        {error ? (
          <View className="mb-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-4">
            <AppText className="text-[15px] font-medium text-red-600">
              {error}
            </AppText>
          </View>
        ) : null}

        {!loading && !error && !hasIngredients ? (
          <View className="mb-4 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-4">
            <AppText className="text-[15px] font-medium text-muted-foreground">
              No ingredients detected.
            </AppText>
          </View>
        ) : null}

        {!loading && hasIngredients ? (
          <View className="mb-2">
            <View className="mb-2.5 flex-row items-center justify-between">
              <AppText className="text-[14px] font-bold text-muted-foreground">
                Detected ({ingredients.length}): choose what to add
              </AppText>
              {ingredients.length > 1 ? (
                <Pressable onPress={toggleAll} hitSlop={8}>
                  <AppText className="text-[13px] font-semibold" style={{ color: colors.sage }}>
                    {selectedCount === ingredients.length ? "Deselect all" : "Select all"}
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            {ingredients.map((item) => {
              const selected = selectedIds.has(item.id);
              const draft = qtyDrafts[item.id] ?? parseQuantity(item.quantity, item.unit);

              return (
                <View
                  key={item.id}
                  className="mb-2 rounded-2xl border bg-white px-3 py-3"
                  style={{
                    borderColor: selected ? colors.sage : colors.border,
                    opacity: selected ? 1 : 0.55,
                  }}
                >
                  <Pressable
                    className="flex-row items-center gap-3"
                    onPress={() => toggleItem(item.id)}
                  >
                    <View
                      className="h-6 w-6 items-center justify-center rounded-md border"
                      style={{
                        backgroundColor: selected ? colors.sage : colors.white,
                        borderColor: selected ? colors.sage : colors.border,
                      }}
                    >
                      {selected ? (
                        <MaterialCommunityIcons name="check" size={16} color="white" />
                      ) : null}
                    </View>

                    <View className="w-9 h-9 rounded-lg items-center justify-center bg-zinc-50 border border-zinc-100">
                      <MaterialCommunityIcons
                        name={resolveIngredientIcon(item.name, item.icon) as any}
                        size={20}
                        color={colors.sage}
                      />
                    </View>

                    <AppText className="flex-1 text-[15px] font-bold text-foreground">
                      {item.name}
                    </AppText>
                  </Pressable>

                  {selected ? (
                    <View className="mt-3 ml-9 pl-3">
                      {draft.kind === "count" ? (
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => bumpCount(item.id, -1)}
                            className="h-9 w-9 items-center justify-center rounded-xl border"
                            style={{ borderColor: colors.border, backgroundColor: colors.white }}
                          >
                            <MaterialCommunityIcons name="minus" size={18} color={colors.mutedText} />
                          </Pressable>
                          <TextInput
                            value={draft.value}
                            onChangeText={(v) =>
                              setQtyDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...draft,
                                  value: v.replace(/[^0-9.]/g, ""),
                                },
                              }))
                            }
                            keyboardType="decimal-pad"
                            className="h-9 min-w-[52px] rounded-xl border px-2 text-center text-[15px] font-semibold text-foreground"
                            style={{ borderColor: colors.border, backgroundColor: colors.white }}
                          />
                          <Pressable
                            onPress={() => bumpCount(item.id, 1)}
                            className="h-9 w-9 items-center justify-center rounded-xl border"
                            style={{ borderColor: colors.border, backgroundColor: colors.white }}
                          >
                            <MaterialCommunityIcons name="plus" size={18} color={colors.mutedText} />
                          </Pressable>
                          <AppText className="text-[13px] font-medium text-muted-foreground">
                            {draft.suffix}
                          </AppText>
                        </View>
                      ) : draft.kind === "level" ? (
                        <View className="flex-row gap-2">
                          {LEVELS.map((level) => {
                            const active = draft.value === level;
                            return (
                              <Pressable
                                key={level}
                                onPress={() => setLevel(item.id, level)}
                                className="rounded-full px-3 py-2"
                                style={{
                                  backgroundColor: active ? colors.sage : colors.white,
                                  borderWidth: 1,
                                  borderColor: active ? colors.sage : colors.border,
                                }}
                              >
                                <AppText
                                  className="text-[12px] font-medium"
                                  style={{ color: active ? colors.white : colors.mutedText }}
                                >
                                  {level}
                                </AppText>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <TextInput
                          value={draft.value}
                          onChangeText={(v) => setTextQty(item.id, v)}
                          placeholder="Quantity"
                          className="h-9 rounded-xl border px-3 text-[14px] text-foreground"
                          style={{ borderColor: colors.border, backgroundColor: colors.white }}
                          placeholderTextColor={colors.mutedText}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* Boutons toujours visibles en bas */}
      <View
        className="gap-2.5 border-t border-zinc-100 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {!loading && hasIngredients && (
          <Pressable
            className="items-center justify-center rounded-2xl py-3.5 active:opacity-90"
            style={{
              backgroundColor: selectedCount > 0 ? colors.sage : colors.border,
            }}
            disabled={selectedCount === 0}
            onPress={handleAdd}
          >
            <AppText className="text-[16px] font-bold text-white">
              {selectedCount === 0
                ? "Select at least one"
                : selectedCount === ingredients.length
                  ? `Add ${selectedCount} to fridge`
                  : `Add ${selectedCount} of ${ingredients.length} to fridge`}
            </AppText>
          </Pressable>
        )}

        {!loading ? (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5 border active:opacity-90"
            style={{ backgroundColor: colors.white, borderColor: colors.border }}
            onPress={onAddManually}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.sage} />
            <AppText className="text-[16px] font-bold" style={{ color: colors.sage }}>
              Add manually
            </AppText>
          </Pressable>
        ) : null}

        <Pressable
          className="items-center justify-center rounded-2xl py-3.5 border active:opacity-90"
          style={
            !loading && hasIngredients
              ? {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                }
              : {
                  backgroundColor: colors.sage,
                  borderColor: colors.sage,
                }
          }
          onPress={onScanAnother}
        >
          <AppText
            className="text-[16px] font-bold"
            style={
              !loading && hasIngredients
                ? { color: colors.mutedText }
                : { color: colors.white }
            }
          >
            {!loading && hasIngredients ? "Take another photo" : "Scan a photo"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

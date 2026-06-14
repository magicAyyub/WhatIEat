import { ScanningOverlay } from "@/components/scan/scanning-overlay";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { useFridgeScan } from "@/hooks/useFridgeScan";
import { useFridgeStore } from "@/store";
import {
  ingredientsToListItems,
  type FridgeListItem,
} from "@/utils/fridge-display";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

const categories = [
  "Tout",
  "Fruits",
  "Légumes",
  "Protéines",
  "Laitier",
  "Céréales",
  "Autre",
];

function formatExpiry(expiresIn?: number) {
  if (expiresIn === undefined) return null;
  if (expiresIn === 0) return "Aujourd'hui";
  return `${expiresIn}j`;
}

function InventoryItemRow({
  item,
  variant,
}: {
  item: FridgeListItem;
  variant: "expiring" | "stock";
}) {
  const expiryLabel = formatExpiry(item.expiresIn);
  const isExpiring = variant === "expiring";

  return (
    <View
      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5 mb-2"
      style={
        isExpiring
          ? {
              backgroundColor: colors.expiringBg,
              borderColor: colors.expiringBorder,
            }
          : {
              backgroundColor: colors.white,
              borderColor: colors.border,
            }
      }
    >
      <View className="flex-row items-center gap-3 flex-1">
        <AppText className="text-2xl">{item.emoji}</AppText>
        <View className="flex-1">
          <AppText className="text-[15px] font-semibold text-foreground">
            {item.name}
          </AppText>
          <AppText className="text-[13px] text-muted-foreground mt-0.5">
            {item.quantity}
          </AppText>
        </View>
      </View>
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
    </View>
  );
}

export default function FrigoScreen() {
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { ingredients } = useFridgeStore();
  const { scanFridge, isScanning } = useFridgeScan();

  const items = useMemo(
    () => ingredientsToListItems(ingredients),
    [ingredients],
  );

  const filtered = items.filter((item) => {
    const matchCategory =
      activeCategory === "Tout" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const expiringSoon = filtered.filter(
    (i) => i.expiresIn !== undefined && i.expiresIn <= 2,
  );
  const others = filtered.filter(
    (i) => i.expiresIn === undefined || i.expiresIn > 2,
  );

  const handleScanCamera = () => {
    scanFridge({
      source: "camera",
      navigateToFrigo: false,
      onCloseMenu: () => setMenuOpen(false),
    });
  };

  const handlePickImage = () => {
    scanFridge({
      source: "library",
      navigateToFrigo: false,
      onCloseMenu: () => setMenuOpen(false),
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScanningOverlay visible={isScanning} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-14 pb-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <AppText className="text-[26px] font-bold text-foreground">
                Mon Frigo 🧊
              </AppText>
              <AppText className="text-[15px] text-muted-foreground mt-1">
                {items.length} ingrédient{items.length !== 1 ? "s" : ""} en stock
              </AppText>
            </View>
            <Pressable
              onPress={() => setMenuOpen(true)}
              disabled={isScanning}
              className="w-11 h-11 rounded-full items-center justify-center active:opacity-80"
              style={{
                backgroundColor: colors.sage,
                opacity: isScanning ? 0.7 : 1,
              }}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View className="px-5 gap-4">
          <View
            className="flex-row items-center rounded-2xl px-4 h-11 gap-2 border"
            style={{ backgroundColor: colors.white, borderColor: colors.border }}
          >
            <Ionicons name="search" size={18} color={colors.mutedText} />
            <TextInput
              placeholder="Rechercher un ingrédient..."
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-[15px] text-foreground"
              placeholderTextColor={colors.mutedText}
            />
          </View>

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

          {items.length === 0 ? (
            <View className="items-center py-16 px-4">
              <AppText className="text-4xl mb-3">📷</AppText>
              <AppText className="text-[16px] font-semibold text-foreground text-center">
                Ton frigo est vide
              </AppText>
              <AppText className="text-[14px] text-muted-foreground text-center mt-2">
                Appuie sur + ou « Scanne ton frigo » depuis l&apos;accueil pour
                détecter tes ingrédients.
              </AppText>
              <Pressable
                onPress={handleScanCamera}
                disabled={isScanning}
                className="mt-6 rounded-2xl px-6 py-3.5 active:opacity-90"
                style={{ backgroundColor: colors.sage }}
              >
                <AppText className="text-[15px] font-semibold text-white">
                  Ouvrir la caméra
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              {expiringSoon.length > 0 && (
                <View>
                  <AppText
                    className="text-[14px] font-bold mb-3"
                    style={{ color: colors.destructive }}
                  >
                    ⚠️ À consommer rapidement
                  </AppText>
                  {expiringSoon.map((item) => (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      variant="expiring"
                    />
                  ))}
                </View>
              )}

              <View>
                <AppText className="text-[15px] font-bold text-foreground mb-3">
                  En stock
                </AppText>
                {others.length > 0 ? (
                  others.map((item) => (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      variant="stock"
                    />
                  ))
                ) : (
                  <AppText className="text-[14px] text-muted-foreground">
                    Aucun autre ingrédient dans cette catégorie.
                  </AppText>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

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
              Ajouter des ingrédients
            </AppText>
            <Pressable
              onPress={handleScanCamera}
              className="flex-row items-center gap-3 p-4 rounded-2xl mb-3 border"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="camera-outline" size={24} color={colors.sage} />
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold">
                  Prendre une photo
                </AppText>
                <AppText className="text-[13px] text-muted-foreground">
                  Scanner ton frigo avec la caméra
                </AppText>
              </View>
            </Pressable>
            <Pressable
              onPress={handlePickImage}
              className="flex-row items-center gap-3 p-4 rounded-2xl border"
              style={{
                backgroundColor: colors.white,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="images-outline" size={24} color={colors.sage} />
              <View className="flex-1">
                <AppText className="text-[15px] font-semibold">
                  Choisir une photo
                </AppText>
                <AppText className="text-[13px] text-muted-foreground">
                  Depuis la galerie
                </AppText>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

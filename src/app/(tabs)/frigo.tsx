import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
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
];

interface InventoryItem {
  name: string;
  quantity: string;
  expiresIn?: number;
  emoji: string;
  category: string;
}

const initialItems: InventoryItem[] = [
  { name: "Poulet", quantity: "500g", expiresIn: 4, emoji: "🍗", category: "Protéines" },
  { name: "Saumon frais", quantity: "200g", expiresIn: 1, emoji: "🐟", category: "Protéines" },
  { name: "Œufs", quantity: "6 pièces", expiresIn: 8, emoji: "🥚", category: "Protéines" },
  { name: "Avocat", quantity: "2 pièces", expiresIn: 1, emoji: "🥑", category: "Légumes" },
  { name: "Tomates cerises", quantity: "250g", expiresIn: 0, emoji: "🍅", category: "Légumes" },
  { name: "Brocoli", quantity: "1 tête", expiresIn: 3, emoji: "🥦", category: "Légumes" },
  { name: "Carottes", quantity: "500g", expiresIn: 10, emoji: "🥕", category: "Légumes" },
  { name: "Yaourt grec", quantity: "500g", expiresIn: 2, emoji: "🥛", category: "Laitier" },
  { name: "Fromage râpé", quantity: "150g", expiresIn: 15, emoji: "🧀", category: "Laitier" },
  { name: "Riz basmati", quantity: "1kg", expiresIn: 90, emoji: "🍚", category: "Céréales" },
  { name: "Quinoa", quantity: "500g", expiresIn: 60, emoji: "🌾", category: "Céréales" },
  { name: "Bananes", quantity: "3 pièces", expiresIn: 3, emoji: "🍌", category: "Fruits" },
  { name: "Myrtilles", quantity: "125g", expiresIn: 2, emoji: "🫐", category: "Fruits" },
  { name: "Mangue", quantity: "1 pièce", expiresIn: 2, emoji: "🥭", category: "Fruits" },
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
  item: InventoryItem;
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
  const [items] = useState<InventoryItem[]>(initialItems);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleScanCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        Alert.alert("Photo prise", "Image prête à être analysée");
      }
      setMenuOpen(false);
    } catch (error) {
      Alert.alert("Erreur", `Impossible d'accéder à la caméra: ${String(error)}`);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        Alert.alert("Image sélectionnée", "Image prête à être analysée");
      }
      setMenuOpen(false);
    } catch (error) {
      Alert.alert("Erreur", `Impossible d'accéder à la galerie: ${String(error)}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
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
                {items.length} ingrédients en stock
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
                  key={item.name}
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
            {others.map((item) => (
              <InventoryItemRow key={item.name} item={item} variant="stock" />
            ))}
          </View>
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

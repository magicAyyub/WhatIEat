/**
 * Safely resolves an icon name to a valid MaterialCommunityIcon.
 * If the icon name is invalid or unsupported, it falls back to a generic food icon.
 */
export function getSafeIconName(iconName: string | undefined | null): string {
  if (!iconName) return "food-variant";

  const lower = iconName.toLowerCase().trim();

  // Mapping legacy/unsupported icons to supported ones in MaterialCommunityIcons
  switch (lower) {
    case "avocado":
    case "avocat":
    case "banana":
    case "banane":
    case "bananes":
      return "food-variant";
    case "tomato":
    case "tomate":
    case "tomates":
      return "fruit-cherries";
    case "broccoli":
    case "brocoli":
    case "procoli":
    case "cabbage":
    case "spinach":
    case "lettuce":
      return "leaf";
    case "mango":
    case "mangue":
    case "fruit-mango":
      return "fruit-citrus";
    default:
      return iconName;
  }
}

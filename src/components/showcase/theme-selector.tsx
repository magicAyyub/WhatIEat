import { useAppTheme } from "@/contexts/app-theme-context";
import React from "react";
import { Pressable, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useUniwind } from "uniwind";

type ThemeOption = {
  id: string;
  name: string;
  lightVariant: string;
  darkVariant: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
};

interface ThemeSelectorProps {
  theme: ThemeOption;
  isActive: boolean;
  onPress: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  theme,
  isActive,
  onPress,
}) => {
  const { theme: currentTheme } = useUniwind();

  // Create pie chart paths
  const radius = 28;
  const centerX = 32;
  const centerY = 32;

  // Calculate pie slices
  // First color: 50% (180 degrees)
  // Second color: 25% (90 degrees)
  // Third color: 25% (90 degrees)

  const createPiePath = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(start);
    const y1 = centerY + radius * Math.sin(start);
    const x2 = centerX + radius * Math.cos(end);
    const y2 = centerY + radius * Math.sin(end);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <Pressable onPress={onPress} className="items-center">
      <View className="relative">
        <Svg width={64} height={64} viewBox="0 0 64 64">
          {/* First slice - 50% */}
          <Path d={createPiePath(-90, 90)} fill={theme.colors.primary} />
          {/* Second slice - 25% */}
          <Path d={createPiePath(90, 180)} fill={theme.colors.secondary} />
          {/* Third slice - 25% */}
          <Path d={createPiePath(180, 270)} fill={theme.colors.tertiary} />

          {/* Active indicator ring */}
          {isActive && (
            <Circle
              cx={centerX}
              cy={centerY}
              r={radius + 4}
              fill="none"
              stroke={currentTheme.endsWith("-dark") ? "#ffffff" : "#000000"}
              strokeWidth={3}
              opacity={0.8}
            />
          )}
        </Svg>
      </View>
    </Pressable>
  );
};

const availableThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    lightVariant: "light",
    darkVariant: "dark",
    colors: {
      primary: "#006FEE",
      secondary: "#17C964",
      tertiary: "#F5A524",
    },
  },
];

export const ThemeSelectorBar: React.FC = () => {
  const { currentTheme, setTheme, isLight } = useAppTheme();

  const getCurrentThemeId = () => {
    if (currentTheme === "light" || currentTheme === "dark") return "default";
    return "default";
  };

  const handleThemeSelect = (theme: ThemeOption) => {
    const variant = isLight ? theme.lightVariant : theme.darkVariant;
    setTheme(variant as any);
  };

  return (
    <View className="flex-row justify-around items-center py-4 px-6 bg-overlay rounded-2xl mx-4 mb-6">
      {availableThemes.map((theme) => (
        <ThemeSelector
          key={theme.id}
          theme={theme}
          isActive={getCurrentThemeId() === theme.id}
          onPress={() => handleThemeSelect(theme)}
        />
      ))}
    </View>
  );
};

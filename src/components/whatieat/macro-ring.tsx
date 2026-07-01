import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import Svg, { Circle } from "react-native-svg";
import { View } from "react-native";

type MacroRingProps = {
  value: number;
  max: number;
  color: string;
  label: string;
};

const SIZE = 76;
const STROKE = 7;

export function MacroRing({ value, max, color, label }: MacroRingProps) {
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="flex-1 items-center">
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View
          className="absolute inset-0 items-center justify-center"
          pointerEvents="none"
        >
          <AppText className="text-lg font-bold text-foreground">{value}</AppText>
        </View>
      </View>
      <AppText className="text-[10px] font-semibold text-muted-foreground mt-2 tracking-wide uppercase">
        {label}
      </AppText>
    </View>
  );
}

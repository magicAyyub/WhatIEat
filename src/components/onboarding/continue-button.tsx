import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

type ContinueButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
};

export function ContinueButton({
  onPress,
  disabled = false,
  label = "Continuer",
}: ContinueButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-90"
      style={{
        backgroundColor: disabled ? colors.border : colors.sage,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <AppText className="text-[16px] font-semibold text-white">{label}</AppText>
      <Ionicons name="arrow-forward" size={18} color="#fff" />
    </Pressable>
  );
}

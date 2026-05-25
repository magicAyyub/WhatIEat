import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { TextInput, View } from "react-native";

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  className?: string;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  className,
}: FormFieldProps) {
  return (
    <View className={className}>
      <AppText className="text-[14px] font-semibold text-foreground mb-2">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className="rounded-xl border px-4 py-3.5 text-[16px] text-foreground"
        style={{
          backgroundColor: colors.white,
          borderColor: colors.border,
        }}
        placeholderTextColor={colors.mutedText}
      />
    </View>
  );
}

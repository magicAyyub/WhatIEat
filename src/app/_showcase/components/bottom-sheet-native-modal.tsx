import { BasicBottomSheetContent } from "@/components/ui/bottom-sheet/basic";
import { View } from "react-native";

export default function BottomSheetNativeModalScreen() {
  return (
    <View className="pt-24 px-5">
      <View className="mt-8">
        <BasicBottomSheetContent />
      </View>
    </View>
  );
}

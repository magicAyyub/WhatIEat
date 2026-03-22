import { AppText } from "@/components/ui/app-text";
import { View } from "react-native";

// TODO: implement camera capture using expo-camera
// Install: npx expo install expo-camera
// This component will handle:
// - requesting camera permission
// - rendering the camera preview
// - capturing a photo and passing the URI up via onCapture

type Props = {
  onCapture: (imageUri: string) => void;
};

export function CameraCapture({ onCapture: _onCapture }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <AppText className="text-white">Camera coming soon</AppText>
    </View>
  );
}

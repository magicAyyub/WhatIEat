import { type ReactNode, useEffect, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AppText } from "@/components/ui/app-text";
import { Animated, Pressable, View } from "react-native";

type Props = {
  onCapture: (imageUri: string) => void;
  topRightOverlay?: ReactNode;
};

export function CameraCapture({ onCapture, topRightOverlay }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  async function takePhoto() {
    if (!cameraRef.current || capturing) {
      return;
    }
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <AppText className="text-white text-center">Loading camera permission...</AppText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6 gap-4">
        <AppText className="text-white text-center">
          Camera access is needed to scan your fridge.
        </AppText>
        <Pressable
          className="rounded-xl bg-white px-4 py-3"
          onPress={requestPermission}
        >
          <AppText className="font-semibold">Allow Camera</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        ratio="16:9"
      />

      {topRightOverlay ? (
        <View className="absolute right-4 top-14">{topRightOverlay}</View>
      ) : null}

      <View className="absolute inset-0 items-center justify-center">
        <Animated.View
          style={{
            width: "74%",
            aspectRatio: 1,
            borderWidth: 2,
            borderRadius: 20,
            borderColor: "#22c55e",
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
          }}
        />
        <AppText className="mt-3 text-xs text-white/90">
          Align item inside the square
        </AppText>
      </View>

      <View className="absolute bottom-0 w-full items-center pb-10">
        <Pressable
          className="h-20 w-20 rounded-full border-4 border-white bg-white/30"
          onPress={takePhoto}
        />
        <AppText className="mt-3 text-white">
          {capturing ? "Capturing..." : "Tap to capture"}
        </AppText>
      </View>
    </View>
  );
}

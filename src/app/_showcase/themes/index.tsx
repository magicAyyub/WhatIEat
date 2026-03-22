import { CardContent } from "@/components/showcase/themes-content/card-content";
import { CheckboxContent } from "@/components/showcase/themes-content/checkbox-content";
import { RadioGroupContent } from "@/components/showcase/themes-content/radio-group-content";
import { SwitchContent } from "@/components/showcase/themes-content/switch-content";
import { TextInputContent } from "@/components/showcase/themes-content/text-input-content";
import { useHeaderHeight } from "@react-navigation/elements";
import React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function Themes() {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="gap-12 px-5"
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: 12,
      }}
      bottomOffset={60}
    >
      <CardContent />
      <SwitchContent />
      <CheckboxContent />
      <RadioGroupContent />
      <TextInputContent />
    </KeyboardAwareScrollView>
  );
}

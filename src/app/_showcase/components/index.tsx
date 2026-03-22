import { AppText } from "@/components/ui/app-text";
import { ScreenScrollView } from "@/components/ui/screen-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter, type Href } from "expo-router";
import { Accordion, PressableFeedback, useToast } from "heroui-native";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type Component = {
  title: string;
  href: Href;
};

const components: Component[] = [
  {
    title: "Accordion",
    href: "/_showcase/components/accordion",
  },
  {
    title: "Avatar",
    href: "/_showcase/components/avatar",
  },
  {
    title: "BottomSheet",
    href: "/_showcase/components/bottom-sheet",
  },
  {
    title: "Button",
    href: "/_showcase/components/button",
  },
  {
    title: "Card",
    href: "/_showcase/components/card",
  },
  {
    title: "Checkbox",
    href: "/_showcase/components/checkbox",
  },
  {
    title: "Chip",
    href: "/_showcase/components/chip",
  },
  {
    title: "Description",
    href: "/_showcase/components/description",
  },
  {
    title: "Dialog",
    href: "/_showcase/components/dialog",
  },
  {
    title: "Divider",
    href: "/_showcase/components/divider",
  },
  {
    title: "ErrorView",
    href: "/_showcase/components/error-view",
  },
  {
    title: "FormField",
    href: "/_showcase/components/form-field",
  },
  {
    title: "InputOTP",
    href: "/_showcase/components/input-otp",
  },
  {
    title: "Label",
    href: "/_showcase/components/label",
  },
  {
    title: "Popover",
    href: "/_showcase/components/popover",
  },
  {
    title: "PressableFeedback",
    href: "/_showcase/components/pressable-feedback",
  },
  {
    title: "RadioGroup",
    href: "/_showcase/components/radio-group",
  },
  {
    title: "ScrollShadow",
    href: "/_showcase/components/scroll-shadow",
  },
  {
    title: "Select",
    href: "/_showcase/components/select",
  },
  {
    title: "Skeleton",
    href: "/_showcase/components/skeleton",
  },
  {
    title: "Spinner",
    href: "/_showcase/components/spinner",
  },
  {
    title: "Surface",
    href: "/_showcase/components/surface",
  },
  {
    title: "Switch",
    href: "/_showcase/components/switch",
  },
  {
    title: "Tabs",
    href: "/_showcase/components/tabs",
  },
  {
    title: "TextField",
    href: "/_showcase/components/text-field",
  },
  {
    title: "Toast",
    href: "/_showcase/components/toast",
  },
];

export default function App() {
  const router = useRouter();
  const pathname = usePathname();

  const { toast, isToastVisible } = useToast();

  useEffect(() => {
    if (isToastVisible && pathname.endsWith("/components")) {
      toast.hide("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToastVisible, pathname]);

  return (
    <ScreenScrollView contentContainerClassName="px-4">
      <View className="h-5" />
      <Accordion isCollapsible={false} variant="surface">
        {components.map((item) => (
          <Accordion.Item key={item.title} value={item.title}>
            <Accordion.Trigger
              onPress={() => {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push(item.href);
              }}
              asChild
            >
              <PressableFeedback>
                <AppText className="text-foreground text-base ml-1">
                  {item.title}
                </AppText>
                <Accordion.Indicator>
                  <StyledIonicons
                    name="chevron-forward"
                    size={16}
                    className="text-muted"
                  />
                </Accordion.Indicator>
              </PressableFeedback>
            </Accordion.Trigger>
          </Accordion.Item>
        ))}
      </Accordion>
    </ScreenScrollView>
  );
}

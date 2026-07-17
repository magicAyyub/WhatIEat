import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Extra space below the status bar / notch so titles aren't flush with the top. */
const EXTRA_TOP = 20;

/**
 * Top padding for tab screens (no nav header).
 * Uses safe-area inset + breathing room.
 */
export function useScreenTopPadding(extra: number = EXTRA_TOP): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}

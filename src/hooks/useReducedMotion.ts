import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Hook that returns true when the user has enabled "Reduce Motion" in system settings.
 * Use this to disable or simplify animations.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}

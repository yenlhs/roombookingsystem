import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptic feedback utilities for enhanced mobile UX
 */

/**
 * Light impact haptic feedback for button taps and selections
 */
export const lightImpact = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics not available
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Medium impact haptic feedback for confirmations
 */
export const mediumImpact = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Heavy impact haptic feedback for important actions
 */
export const heavyImpact = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Success haptic feedback for successful operations
 */
export const successFeedback = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Warning haptic feedback for warnings
 */
export const warningFeedback = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Error haptic feedback for errors
 */
export const errorFeedback = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

/**
 * Selection haptic feedback for list selections
 */
export const selectionFeedback = async () => {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.debug("Haptics not available:", error);
    }
  }
};

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useEffect } from "react";

/**
 * Animation utilities using react-native-reanimated
 */

/**
 * Hook for fade-in animation
 * @param delay - Delay before animation starts (in ms)
 * @param duration - Duration of animation (in ms)
 */
export const useFadeIn = (delay = 0, duration = 500) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Hook for slide-up animation
 * @param delay - Delay before animation starts (in ms)
 * @param duration - Duration of animation (in ms)
 * @param distance - Distance to slide up from (in pixels)
 */
export const useSlideUp = (delay = 0, duration = 500, distance = 50) => {
  const translateY = useSharedValue(distance);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      }),
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: duration * 0.7,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Hook for scale animation
 * @param delay - Delay before animation starts (in ms)
 */
export const useScaleIn = (delay = 0) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      }),
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

/**
 * Hook for press animation (scale down and back)
 */
export const usePressScale = () => {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
};

/**
 * Hook for list item staggered animation
 * @param index - Index of the item in the list
 * @param delay - Base delay for stagger effect (in ms)
 */
export const useListItemAnimation = (index: number, delay = 80) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const itemDelay = index * delay;

    opacity.value = withDelay(
      itemDelay,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      }),
    );

    translateY.value = withDelay(
      itemDelay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      }),
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};

/**
 * Hook for shake animation (error state)
 */
export const useShake = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, shake };
};

/**
 * Hook for pulse animation (loading or attention)
 */
export const usePulse = (enabled = true) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (enabled) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      );
    }
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
};

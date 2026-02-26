import React, { useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const DEFAULT_SCALE = 1.0;

interface PinchZoomBoardProps {
  children: React.ReactNode;
}

export function PinchZoomBoard({ children }: PinchZoomBoardProps) {
  const scale = useSharedValue(DEFAULT_SCALE);
  const savedScale = useSharedValue(DEFAULT_SCALE);
  const lastTapTime = useRef(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Pinch gesture — two-finger zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Snap back if out of bounds
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
        savedScale.value = MAX_SCALE;
      }
    });

  // Double-tap gesture — reset scale to default
  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(DEFAULT_SCALE, { damping: 15, stiffness: 150 });
      savedScale.value = DEFAULT_SCALE;
      runOnJS(triggerHaptic)();
    });

  // Compose: pinch takes priority, double-tap as fallback
  const composed = Gesture.Simultaneous(pinchGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

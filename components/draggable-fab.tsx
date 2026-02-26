import React, { useRef, useCallback } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

const FAB_SIZE = 44;
const EDGE_MARGIN = 10;
// Distance threshold to distinguish tap from drag
const DRAG_THRESHOLD = 6;

interface DraggableFabProps {
  onPress: () => void;
  icon?: string;
  initialRight?: number;
  initialBottom?: number;
}

export function DraggableFab({
  onPress,
  icon = "🎵",
  initialRight = EDGE_MARGIN,
  initialBottom = 36,
}: DraggableFabProps) {
  const { width, height } = useWindowDimensions();

  // Initial position: bottom-right corner
  const posX = useRef(new Animated.Value(width - FAB_SIZE - initialRight)).current;
  const posY = useRef(new Animated.Value(height - FAB_SIZE - initialBottom)).current;

  // Track raw position for snap calculation
  const currentX = useRef(width - FAB_SIZE - initialRight);
  const currentY = useRef(height - FAB_SIZE - initialBottom);

  // Track drag distance to distinguish tap from drag
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  const snapToEdge = useCallback(
    (x: number, y: number) => {
      // Clamp Y within screen bounds
      const clampedY = Math.max(
        EDGE_MARGIN,
        Math.min(y, height - FAB_SIZE - EDGE_MARGIN)
      );

      // Snap to nearest horizontal edge
      const snapX =
        x + FAB_SIZE / 2 < width / 2
          ? EDGE_MARGIN
          : width - FAB_SIZE - EDGE_MARGIN;

      currentX.current = snapX;
      currentY.current = clampedY;

      Animated.parallel([
        Animated.spring(posX, {
          toValue: snapX,
          useNativeDriver: false,
          tension: 120,
          friction: 10,
        }),
        Animated.spring(posY, {
          toValue: clampedY,
          useNativeDriver: false,
          tension: 120,
          friction: 10,
        }),
      ]).start();
    },
    [width, height, posX, posY]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only take over if user actually moves
        return (
          Math.abs(gestureState.dx) > DRAG_THRESHOLD ||
          Math.abs(gestureState.dy) > DRAG_THRESHOLD
        );
      },

      onPanResponderGrant: (evt) => {
        dragStartX.current = evt.nativeEvent.pageX;
        dragStartY.current = evt.nativeEvent.pageY;
        isDragging.current = false;
        // Stop any ongoing animation
        posX.stopAnimation((val) => {
          currentX.current = val;
        });
        posY.stopAnimation((val) => {
          currentY.current = val;
        });
      },

      onPanResponderMove: (_, gestureState) => {
        const totalDist = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy
        );
        if (totalDist > DRAG_THRESHOLD) {
          isDragging.current = true;
        }

        const newX = currentX.current + gestureState.dx;
        const newY = currentY.current + gestureState.dy;

        // Clamp within screen during drag
        const clampedX = Math.max(
          EDGE_MARGIN,
          Math.min(newX, width - FAB_SIZE - EDGE_MARGIN)
        );
        const clampedY = Math.max(
          EDGE_MARGIN,
          Math.min(newY, height - FAB_SIZE - EDGE_MARGIN)
        );

        posX.setValue(clampedX);
        posY.setValue(clampedY);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (!isDragging.current) {
          // It was a tap — handled by Pressable onPress
          return;
        }

        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const finalX = currentX.current + gestureState.dx;
        const finalY = currentY.current + gestureState.dy;
        snapToEdge(finalX, finalY);
      },

      onPanResponderTerminate: (_, gestureState) => {
        const finalX = currentX.current + gestureState.dx;
        const finalY = currentY.current + gestureState.dy;
        snapToEdge(finalX, finalY);
      },
    })
  ).current;

  const handlePress = useCallback(() => {
    if (isDragging.current) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          left: posX,
          top: posY,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.inner,
          pressed && !isDragging.current && styles.innerPressed,
        ]}
        hitSlop={0}
      >
        <Text style={styles.icon}>{icon}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: "#E60026",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 999,
  },
  inner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  innerPressed: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: FAB_SIZE / 2,
  },
  icon: {
    fontSize: 20,
  },
});

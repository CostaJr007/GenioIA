import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  variant?: 'text' | 'circular' | 'rectangular';
  style?: ViewStyle;
  animate?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  variant = 'rectangular',
  style,
  animate = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animate) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animate, animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return borderRadius.full;
      case 'text':
        return borderRadius.sm;
      default:
        return borderRadius.md;
    }
  };

  const skeletonStyle: any = {
    width,
    height,
    borderRadius: getBorderRadius(),
    opacity,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        skeletonStyle,
        style,
      ]}
    />
  );
};

// Preset skeleton loaders for common patterns
export const TextSkeleton: React.FC<{ lines?: number; style?: ViewStyle }> = ({
  lines = 3,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          height={16}
          variant="text"
          style={{
            marginBottom: spacing.sm,
            width: index === lines - 1 ? '70%' : '100%',
          }}
        />
      ))}
    </View>
  );
};

export const CardSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <LoadingSkeleton width={60} height={60} variant="circular" style={{ marginBottom: spacing.md }} />
      <TextSkeleton lines={3} />
    </View>
  );
};

export const ImageSkeleton: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <LoadingSkeleton
      height={200}
      style={[styles.imageContainer, style] as unknown as ViewStyle}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  imageContainer: {
    marginBottom: spacing.md,
  },
});

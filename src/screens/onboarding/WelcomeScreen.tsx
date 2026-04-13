import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';

const { width } = Dimensions.get('window');

interface WelcomeSlideProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const slides: WelcomeSlideProps[] = [
  {
    icon: 'robot-happy',
    title: 'Your AI Study Assistant',
    description: 'Get instant help with homework, explanations, and summaries powered by AI',
    color: colors.primary[500],
  },
  {
    icon: 'camera',
    title: 'Snap & Learn',
    description: 'Take photos of questions and get detailed explanations instantly',
    color: colors.secondary[500],
  },
  {
    icon: 'microphone',
    title: 'Record Lectures',
    description: 'Record and transcribe your lectures with AI-powered summaries',
    color: colors.accent[500],
  },
  {
    icon: 'flashcard',
    title: 'Smart Flashcards',
    description: 'Generate flashcards on any topic and study more effectively',
    color: colors.info,
  },
];

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(0);

  const handleNext = () => {
    if (currentIndex.current < slides.length - 1) {
      currentIndex.current += 1;
      Animated.spring(scrollX, {
        toValue: currentIndex.current * width,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      navigation.navigate('ApiKeySetup' as never);
    }
  };

  const handleSkip = () => {
    navigation.navigate('ApiKeySetup' as never);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="brain" size={48} color="#fff" />
          </View>
          <Text style={styles.logoText}>Génius IA</Text>
        </View>
      </View>

      {/* Slides */}
      <Animated.View
        style={[
          styles.slidesContainer,
          {
            transform: [{ translateX: scrollX.interpolate({
              inputRange: [0, width],
              outputRange: [0, -width],
            })}],
          },
        ]}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
              <MaterialCommunityIcons name={slide.icon as any} size={80} color="#fff" />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={currentIndex.current === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="md"
          style={styles.skipButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps & { isActive: boolean }> = ({
  icon,
  title,
  description,
  color,
  isActive,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Card padding="lg" style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon as any} size={40} color="#fff" />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </Card>
    </Animated.View>
  );
};

export const FeatureTourScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const features: Omit<FeatureCardProps, 'delay'>[] = [
    {
      icon: 'chat-processing',
      title: 'AI Chat',
      description: 'Ask anything and get intelligent, helpful responses instantly',
      color: colors.primary[500],
    },
    {
      icon: 'camera',
      title: 'OCR Scanner',
      description: 'Point your camera at questions and get detailed answers',
      color: colors.secondary[500],
    },
    {
      icon: 'microphone',
      title: 'Lecture Recorder',
      description: 'Record classes and get automatic transcriptions and summaries',
      color: colors.accent[500],
    },
    {
      icon: 'flashcard',
      title: 'Flashcards',
      description: 'Generate study cards on any topic with AI-powered content',
      color: colors.info,
    },
    {
      icon: 'file-document',
      title: 'Summaries',
      description: 'Create concise summaries from long texts or documents',
      color: colors.success,
    },
    {
      icon: 'school',
      title: 'Thesis Helper',
      description: 'Get help with research papers and academic writing',
      color: colors.warning,
    },
  ];

  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  const handleGetStarted = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Features</Text>
        <Text style={styles.headerSubtitle}>
          Discover all the powerful features available to help you study
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            {...feature}
            isActive={index <= currentIndex}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <Button
          title={currentIndex === features.length - 1 ? 'Finish' : `Next (${currentIndex + 1}/${features.length})`}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
        />

        <Button
          title="Skip Tour"
          onPress={handleGetStarted}
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
  headerTitle: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  featureCard: {
    marginBottom: spacing.md,
  },
  card: {
    ...shadows.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDisabled,
  },
  progressDotActive: {
    backgroundColor: colors.primary[500],
    width: 24,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});

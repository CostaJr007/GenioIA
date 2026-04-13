import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

interface Flashcard {
  id: number;
  question: string;
  answer: string;
}

export const FlashcardsScreen: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadKey = async () => {
      const storedKey = await AsyncStorage.getItem('openai_api_key');
      if (storedKey) {
        setApiKey(storedKey);
      }
    };
    loadKey();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const generateFlashcards = async () => {
    if (!topic.trim() || !apiKey) return;

    setLoading(true);
    try {
      const responseText = await callChatCompletion(
        apiKey,
        [
          {
            role: "system",
            content: "You are an assistant that creates educational flashcards. Give exactly 5 question/answer pairs on the requested topic. Format your response as a valid JSON list with this exact structure: [{\"question\": \"your question here\", \"answer\": \"your answer here\"}, ...]. No additional text, only JSON."
          },
          { role: "user", content: `Create 5 flashcards on the following topic: ${topic}` }
        ],
        'gpt-4o-mini'
      );

      let parsedFlashcards: Array<{question: string; answer: string}> = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedFlashcards = JSON.parse(jsonMatch[0]);
        } else {
          parsedFlashcards = JSON.parse(responseText);
        }

        if (!Array.isArray(parsedFlashcards)) {
          throw new Error('Response is not an array');
        }

        parsedFlashcards = parsedFlashcards.map((card, index) => ({
          question: String(card.question || `Question ${index + 1}`),
          answer: String(card.answer || `Answer ${index + 1}`),
        }));

        setFlashcards(parsedFlashcards.map((card, index) => ({
          id: Date.now() + index,
          question: card.question,
          answer: card.answer,
        })));
        setCurrentIndex(0);
        setIsFlipped(false);
        showToast('Flashcards generated successfully!', 'success');
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', responseText);
        const lines = responseText.split('\n').filter(line => line.trim());
        setFlashcards(lines.slice(0, 5).map((line, index) => ({
          id: Date.now() + index,
          question: line.replace(/^[0-9]+[\.\)]\s*/, '').trim() || `Point ${index + 1}`,
          answer: `Detailed explanation for: ${line.replace(/^[0-9]+[\.\)]\s*/, '').trim()}`,
        })));
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Flashcards Generation Error:', error);
      showToast('Failed to generate flashcards', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const resetFlashcards = () => {
    setFlashcards([]);
    setTopic('');
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  if (!apiKey && flashcards.length === 0) {
    return (
      <View style={styles.container}>
        <Toast
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onHide={hideToast}
        />
        <EmptyState
          illustration="warning"
          title="API Key Not Configured"
          description="Set up your OpenAI API key to generate AI-powered flashcards."
          actionLabel="Configure API Key"
          onAction={async () => {
            const key = 'sk-placeholder';
            setApiKey(key);
            await AsyncStorage.setItem('openai_api_key', key);
            showToast('API key configured!', 'success');
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />

      {/* Header */}
      <Card style={styles.header} padding="md">
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="flashcard" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>🎯 Flashcard Generator</Text>
            <Text style={styles.headerSubtitle}>
              Create study cards on any topic with AI
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Input Section */}
        {flashcards.length === 0 && (
          <Card style={styles.inputCard} padding="lg">
            <Text style={styles.inputLabel}>Enter a topic to generate flashcards</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., photosynthesis, differential equations, World War II..."
              value={topic}
              onChangeText={setTopic}
              onSubmitEditing={generateFlashcards}
              placeholderTextColor={colors.textTertiary}
            />
            <Button
              title={loading ? 'Generating...' : 'Generate Flashcards'}
              onPress={generateFlashcards}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading || !topic.trim() || !apiKey}
              icon={
                <MaterialCommunityIcons name="play" size={20} color={colors.textInverse} />
              }
            />
          </Card>
        )}

        {/* Flashcard Display */}
        {flashcards.length > 0 && (
          <View style={styles.flashcardSection}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentIndex + 1}/{flashcards.length}
              </Text>
            </View>

            {/* Flashcard */}
            <View style={styles.flashcardWrapper}>
              <TouchableOpacity
                style={styles.flashcardContainer}
                onPress={flipCard}
                activeOpacity={0.9}
              >
                {/* Front */}
                <Animated.View
                  style={[
                    styles.flashcardFace,
                    {
                      transform: [{ rotateY: frontInterpolate }],
                    },
                  ]}
                >
                  <View style={styles.cardFaceContent}>
                    <MaterialCommunityIcons
                      name="help-circle"
                      size={48}
                      color={colors.primary[500]}
                      style={{ marginBottom: spacing.md }}
                    />
                    <Text style={styles.cardLabel}>QUESTION</Text>
                    <Text style={styles.cardText}>{flashcards[currentIndex].question}</Text>
                    <Text style={styles.flipHint}>Tap to reveal answer</Text>
                  </View>
                </Animated.View>

                {/* Back */}
                <Animated.View
                  style={[
                    styles.flashcardFace,
                    styles.flashcardBack,
                    {
                      transform: [{ rotateY: backInterpolate }],
                    },
                  ]}
                >
                  <View style={styles.cardFaceContent}>
                    <MaterialCommunityIcons
                      name="lightbulb"
                      size={48}
                      color={colors.secondary[500]}
                      style={{ marginBottom: spacing.md }}
                    />
                    <Text style={styles.cardLabel}>ANSWER</Text>
                    <Text style={styles.cardText}>{flashcards[currentIndex].answer}</Text>
                    <Text style={styles.flipHint}>Tap to see question</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Navigation */}
            <View style={styles.navigation}>
              <Button
                title="Previous"
                onPress={prevCard}
                variant="outline"
                size="md"
                disabled={currentIndex === 0}
                icon={
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={20}
                    color={currentIndex === 0 ? colors.textDisabled : colors.primary[500]}
                  />
                }
              />
              <Button
                title="Next"
                onPress={nextCard}
                variant="outline"
                size="md"
                disabled={currentIndex === flashcards.length - 1}
                iconPosition="right"
                icon={
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={currentIndex === flashcards.length - 1 ? colors.textDisabled : colors.primary[500]}
                  />
                }
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Generate New Set"
                onPress={resetFlashcards}
                variant="primary"
                size="lg"
                fullWidth
                icon={
                  <MaterialCommunityIcons name="plus" size={20} color={colors.textInverse} />
                }
              />
              <Button
                title="Share Flashcards"
                onPress={() => showToast('Sharing coming soon!', 'info')}
                variant="ghost"
                size="md"
                fullWidth
                icon={
                  <MaterialCommunityIcons name="share" size={20} color={colors.primary[500]} />
                }
              />
            </View>
          </View>
        )}

        {loading && flashcards.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Generating flashcards...</Text>
            <Text style={styles.loadingSubtext}>AI is creating your study cards</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    margin: spacing.md,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  inputCard: {
    ...shadows.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  flashcardSection: {
    gap: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    minWidth: 40,
  },
  flashcardWrapper: {
    marginVertical: spacing.md,
  },
  flashcardContainer: {
    height: 300,
  },
  flashcardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    ...shadows.lg,
  },
  flashcardBack: {
    backgroundColor: colors.primary[50],
  },
  cardFaceContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold,
    color: colors.textTertiary,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  cardText: {
    fontSize: typography.fontSize.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  flipHint: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  navigation: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  loadingSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
  },
});
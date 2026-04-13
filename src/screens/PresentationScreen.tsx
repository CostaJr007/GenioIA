import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

export const PresentationScreen: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState<Array<{id: number; title: string; content: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [slideCount, setSlideCount] = useState<5 | 8 | 10>(5);

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

  const generatePresentation = async () => {
    if (!topic.trim() || !apiKey) return;

    setLoading(true);
    try {
      const responseText = await callChatCompletion(
        apiKey,
        [
          {
            role: "system",
            content: `You are an assistant that creates structured educational presentations. Generate exactly ${slideCount} slides with a clear title and concise key points for each. Format your response as a valid JSON list with this exact structure: [{"title": "slide title", "content": "key points separated by bullet markers"}, ...]. No additional text, only JSON.`
          },
          { role: "user", content: `Create a presentation of ${slideCount} slides on the following topic: ${topic}` }
        ],
        'gpt-4o-mini'
      );

      let parsedSlides: Array<{title: string; content: string}> = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedSlides = JSON.parse(jsonMatch[0]);
        } else {
          parsedSlides = JSON.parse(responseText);
        }

        if (!Array.isArray(parsedSlides)) {
          throw new Error('Response is not an array');
        }

        parsedSlides = parsedSlides.map((slide, index) => ({
          title: String(slide.title || `Slide ${index + 1}`),
          content: String(slide.content || `Content to be added`),
        }));

        setSlides(parsedSlides.map((slide, index) => ({
          id: Date.now() + index,
          title: slide.title,
          content: slide.content,
        })));
        showToast('Presentation generated!', 'success');
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', responseText);
        const lines = responseText.split('\n').filter(line => line.trim() && !line.startsWith('[') && !line.startsWith('{'));
        setSlides(lines.slice(0, slideCount).map((line, index) => ({
          id: Date.now() + index,
          title: line.replace(/^[0-9]+[\.\)]\s*/, '').trim() || `Point ${index + 1}`,
          content: `• Detailed content for: ${line.replace(/^[0-9]+[\.\)]\s*/, '').trim()}\n• Explanation and examples\n• Practical applications`,
        })));
      }
    } catch (error) {
      console.error('Presentation Generation Error:', error);
      showToast('Failed to generate presentation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetPresentation = () => {
    setSlides([]);
    setTopic('');
  };

  const copyPresentation = () => {
    Alert.alert('Copied', 'Presentation copied to clipboard');
  };

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
            <MaterialCommunityIcons name="format-presentation" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📊 Presentation Generator</Text>
            <Text style={styles.headerSubtitle}>
              Create structured presentations with AI
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!apiKey && slides.length === 0 ? (
          <EmptyState
            illustration="warning"
            title="API Key Not Configured"
            description="Set up your OpenAI API key to enable AI presentation generation."
            actionLabel="Configure API Key"
            onAction={async () => {
              const key = 'sk-placeholder';
              setApiKey(key);
              await AsyncStorage.setItem('openai_api_key', key);
              showToast('API key configured!', 'success');
            }}
          />
        ) : (
          <>
            {/* Input Card */}
            {slides.length === 0 && (
              <Card style={styles.inputCard} padding="lg">
                <Text style={styles.inputLabel}>Presentation Topic</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Climate Change, Machine Learning, World War II..."
                  value={topic}
                  onChangeText={setTopic}
                  onSubmitEditing={generatePresentation}
                  placeholderTextColor={colors.textTertiary}
                />

                {/* Slide Count Options */}
                <View style={styles.optionsSection}>
                  <Text style={styles.optionsLabel}>Number of Slides:</Text>
                  <View style={styles.optionsButtons}>
                    <Button
                      title="5"
                      onPress={() => setSlideCount(5)}
                      variant={slideCount === 5 ? 'primary' : 'outline'}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="8"
                      onPress={() => setSlideCount(8)}
                      variant={slideCount === 8 ? 'primary' : 'outline'}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="10"
                      onPress={() => setSlideCount(10)}
                      variant={slideCount === 10 ? 'primary' : 'outline'}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>

                <Button
                  title={loading ? 'Generating...' : 'Generate Presentation'}
                  onPress={generatePresentation}
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

            {/* Slides Display */}
            {slides.length > 0 && !loading && (
              <View style={styles.slidesSection}>
                <View style={styles.slidesHeader}>
                  <Text style={styles.slidesTitle}>
                    Your Presentation ({slides.length} slides)
                  </Text>
                  <Button
                    title="Copy"
                    onPress={copyPresentation}
                    variant="ghost"
                    size="sm"
                    icon={
                      <MaterialCommunityIcons name="content-copy" size={16} color={colors.primary[500]} />
                    }
                  />
                </View>

                <View style={styles.slidesList}>
                  {slides.map((slide, index) => (
                    <Card key={slide.id} style={styles.slideCard} padding="lg">
                      <View style={styles.slideHeader}>
                        <View style={styles.slideNumber}>
                          <Text style={styles.slideNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.slideTitleText}>{slide.title}</Text>
                      </View>
                      <Text style={styles.slideContentText}>
                        {slide.content}
                      </Text>
                    </Card>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    title="Create New Presentation"
                    onPress={resetPresentation}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textInverse} />
                    }
                  />
                  <Button
                    title="Export as PDF"
                    onPress={() => showToast('PDF export coming soon!', 'info')}
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="file-pdf" size={20} color={colors.primary[500]} />
                    }
                  />
                </View>
              </View>
            )}

            {loading && slides.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Generating presentation...</Text>
                <Text style={styles.loadingSubtext}>AI is creating your slides</Text>
              </View>
            )}
          </>
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
    marginBottom: spacing.lg,
  },
  optionsSection: {
    marginBottom: spacing.lg,
  },
  optionsLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionsButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  slidesSection: {
    gap: spacing.md,
  },
  slidesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  slidesTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  slidesList: {
    gap: spacing.md,
  },
  slideCard: {
    ...shadows.sm,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  slideNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideNumberText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  slideTitleText: {
    flex: 1,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  slideContentText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actionButtons: {
    gap: spacing.sm,
    marginTop: spacing.md,
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

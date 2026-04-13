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

export const SummaryScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('medium');

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

  const getSystemPrompt = () => {
    switch (summaryLength) {
      case 'short':
        return 'Create a very concise summary (2-3 sentences) of the following text in French. Focus only on the most essential points.';
      case 'medium':
        return 'Create a clear, structured summary of the following text in French with key points, suitable for quick revision. Include main ideas and important details.';
      case 'detailed':
        return 'Create a comprehensive, detailed summary of the following text in French. Include all key points, examples, and important context. Structure with headings and bullet points.';
      default:
        return 'Create a clear summary of the following text in French with key points.';
    }
  };

  const generateSummary = async () => {
    if (!text.trim() || !apiKey) return;

    if (text.length < 50) {
      showToast('Please enter at least 50 characters for a meaningful summary', 'warning');
      return;
    }

    setLoading(true);
    try {
      const aiResponse = await callChatCompletion(
        apiKey,
        [
          {
            role: "system",
            content: getSystemPrompt()
          },
          { role: "user", content: `Summarize this text:\n\n${text}` }
        ],
        'gpt-4o-mini'
      );

      setSummary(aiResponse || "Sorry, I couldn't generate a summary.");
      showToast('Summary generated!', 'success');
    } catch (error) {
      console.error('Summary Generation Error:', error);
      showToast('Failed to generate summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setText('');
    setSummary(null);
  };

  const copySummary = () => {
    if (summary) {
      Alert.alert('Copied', 'Summary copied to clipboard');
    }
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
            <MaterialCommunityIcons name="format-list-bulleted" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📝 AI Summary Generator</Text>
            <Text style={styles.headerSubtitle}>
              Paste your text and get an instant AI-powered summary
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!apiKey && summary?.length === 0 ? (
          <EmptyState
            illustration="warning"
            title="API Key Not Configured"
            description="Set up your OpenAI API key to enable AI summarization."
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
            <Card style={styles.inputCard} padding="lg">
              <Text style={styles.inputLabel}>Your Text</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Paste your article, book chapter, lecture notes..."
                value={text}
                onChangeText={setText}
                multiline
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={styles.charCount}>{text.length} characters</Text>

              {/* Length Options */}
              <View style={styles.lengthOptions}>
                <Text style={styles.optionsLabel}>Summary Length:</Text>
                <View style={styles.lengthButtons}>
                  <Button
                    title="Short"
                    onPress={() => setSummaryLength('short')}
                    variant={summaryLength === 'short' ? 'primary' : 'outline'}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Medium"
                    onPress={() => setSummaryLength('medium')}
                    variant={summaryLength === 'medium' ? 'primary' : 'outline'}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Detailed"
                    onPress={() => setSummaryLength('detailed')}
                    variant={summaryLength === 'detailed' ? 'primary' : 'outline'}
                    size="sm"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              <Button
                title={loading ? 'Generating...' : 'Generate Summary'}
                onPress={generateSummary}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !text.trim() || !apiKey}
                icon={
                  <MaterialCommunityIcons name="flash" size={20} color={colors.textInverse} />
                }
              />
            </Card>

            {/* Summary Card */}
            {summary && !loading && (
              <Card style={styles.summaryCard} padding="lg">
                <View style={styles.resultHeader}>
                  <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                    <Text style={styles.resultTitle}>Summary</Text>
                  </View>
                  <Button
                    title="Copy"
                    onPress={copySummary}
                    variant="ghost"
                    size="sm"
                    icon={
                      <MaterialCommunityIcons name="content-copy" size={16} color={colors.primary[500]} />
                    }
                  />
                </View>
                <Text style={styles.resultText}>{summary}</Text>
                
                <View style={styles.actionButtons}>
                  <Button
                    title="Summarize New Text"
                    onPress={clearAll}
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textInverse} />
                    }
                  />
                </View>
              </Card>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Generating summary...</Text>
                <Text style={styles.loadingSubtext}>AI is analyzing your text</Text>
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
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  charCount: {
    fontSize: typography.fontSize.micro,
    color: colors.textTertiary,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  lengthOptions: {
    marginBottom: spacing.md,
  },
  optionsLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lengthButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  resultText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  actionButtons: {
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

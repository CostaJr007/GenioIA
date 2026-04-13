import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type AcademicLevel = 'bachelor' | 'master' | 'phd';
type ThesisTool = 'topics' | 'outline' | 'citations' | 'goals';

interface ThesisResults {
  topics?: string;
  outline?: string;
  citations?: string;
  goals?: string;
}

export const ThesisScreen: React.FC = () => {
  const [field, setField] = useState('');
  const [level, setLevel] = useState<AcademicLevel>('bachelor');
  const [results, setResults] = useState<ThesisResults>({});
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ThesisTool | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

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

  const getLevelLabel = (l: AcademicLevel) => {
    switch (l) {
      case 'bachelor': return 'Bachelor';
      case 'master': return 'Master';
      case 'phd': return 'PhD';
    }
  };

  const generateThesisHelp = async (type: ThesisTool) => {
    if (!field.trim() || !apiKey) return;

    setLoading(true);
    setActiveTool(type);
    try {
      let prompt = '';
      let systemMessage = '';

      switch (type) {
        case 'topics':
          systemMessage = 'You are an academic advisor who helps find relevant and original thesis/dissertation topics.';
          prompt = `Give 5 original and feasible thesis/dissertation topics in the following field: ${field}. Academic level: ${getLevelLabel(level)}. For each topic, give a short title and a brief 1-2 sentence description.`;
          break;
        case 'outline':
          systemMessage = 'You are an academic advisor who helps structure thesis/dissertation.';
          prompt = `Create a detailed thesis/dissertation outline for the field: ${field}. Academic level: ${getLevelLabel(level)}. Include classic sections (introduction, development, conclusion) with relevant subsections.`;
          break;
        case 'citations':
          systemMessage = 'You are an assistant who helps find relevant academic references.';
          prompt = `Suggest 5 types of academic sources (books, articles, key theorists) relevant for a thesis/dissertation on: ${field}. Academic level: ${getLevelLabel(level)}. For each type, give 2-3 concrete examples.`;
          break;
        case 'goals':
          systemMessage = 'You are an academic advisor who helps define clear research objectives.';
          prompt = `Formulate 3-4 SMART research objectives (Specific, Measurable, Achievable, Relevant, Time-bound) for a thesis/dissertation on: ${field}. Academic level: ${getLevelLabel(level)}.`;
          break;
      }

      const aiResponse = await callChatCompletion(
        apiKey,
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt }
        ],
        'gpt-4o-mini'
      );

      setResults(prev => ({ ...prev, [type]: aiResponse || "Sorry, I couldn't generate a response." }));
      showToast('Content generated successfully!', 'success');
    } catch (error) {
      console.error('Thesis Generation Error:', error);
      setResults(prev => ({ ...prev, [type]: "Error during generation. Check your connection and API key." }));
      showToast('Failed to generate content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults({});
    setActiveTool(null);
  };

  const getToolIcon = (tool: ThesisTool) => {
    switch (tool) {
      case 'topics': return 'lightbulb';
      case 'outline': return 'format-list-bulleted';
      case 'citations': return 'library';
      case 'goals': return 'target';
    }
  };

  const getToolTitle = (tool: ThesisTool) => {
    switch (tool) {
      case 'topics': return '🎯 Thesis Topics';
      case 'outline': return '📋 Detailed Outline';
      case 'citations': return '📚 Sources & References';
      case 'goals': return '🎯 Research Objectives';
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
            <MaterialCommunityIcons name="school" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>🎓 Thesis Helper</Text>
            <Text style={styles.headerSubtitle}>
              AI-powered academic writing assistance
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!apiKey && Object.keys(results).length === 0 ? (
          <EmptyState
            illustration="warning"
            title="API Key Not Configured"
            description="Set up your OpenAI API key to enable thesis assistance."
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
            {/* Input Form */}
            {Object.keys(results).length === 0 && (
              <>
                <Card style={styles.formCard} padding="lg">
                  <Text style={styles.formLabel}>Research Field</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., molecular biology, international law, AI ethics..."
                    value={field}
                    onChangeText={setField}
                    placeholderTextColor={colors.textTertiary}
                  />

                  {/* Academic Level */}
                  <View style={styles.levelSection}>
                    <Text style={styles.levelLabel}>Academic Level</Text>
                    <View style={styles.levelButtons}>
                      {(['bachelor', 'master', 'phd'] as AcademicLevel[]).map((l) => (
                        <Button
                          key={l}
                          title={getLevelLabel(l)}
                          onPress={() => setLevel(l)}
                          variant={level === l ? 'primary' : 'outline'}
                          size="md"
                          style={{ flex: 1 }}
                        />
                      ))}
                    </View>
                  </View>
                </Card>

                {/* Tool Cards */}
                <View style={styles.toolsSection}>
                  <Text style={styles.toolsTitle}>Choose a Tool</Text>
                  
                  <Card style={styles.toolCard} padding="md">
                    <TouchableOpacity
                      style={styles.toolButton}
                      onPress={() => generateThesisHelp('topics')}
                      disabled={loading || !field.trim() || !apiKey}
                    >
                      <View style={styles.toolIcon}>
                        <MaterialCommunityIcons name="lightbulb" size={24} color={colors.textInverse} />
                      </View>
                      <View style={styles.toolText}>
                        <Text style={styles.toolTitle}>Generate Thesis Topics</Text>
                        <Text style={styles.toolDescription}>Get 5 original and relevant research topics</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </Card>

                  <Card style={styles.toolCard} padding="md">
                    <TouchableOpacity
                      style={styles.toolButton}
                      onPress={() => generateThesisHelp('outline')}
                      disabled={loading || !field.trim() || !apiKey}
                    >
                      <View style={styles.toolIcon}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={24} color={colors.textInverse} />
                      </View>
                      <View style={styles.toolText}>
                        <Text style={styles.toolTitle}>Create Detailed Outline</Text>
                        <Text style={styles.toolDescription}>Structure your thesis with a complete outline</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </Card>

                  <Card style={styles.toolCard} padding="md">
                    <TouchableOpacity
                      style={styles.toolButton}
                      onPress={() => generateThesisHelp('citations')}
                      disabled={loading || !field.trim() || !apiKey}
                    >
                      <View style={styles.toolIcon}>
                        <MaterialCommunityIcons name="library" size={24} color={colors.textInverse} />
                      </View>
                      <View style={styles.toolText}>
                        <Text style={styles.toolTitle}>Find Sources & References</Text>
                        <Text style={styles.toolDescription}>Get academic sources for your research</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </Card>

                  <Card style={styles.toolCard} padding="md">
                    <TouchableOpacity
                      style={styles.toolButton}
                      onPress={() => generateThesisHelp('goals')}
                      disabled={loading || !field.trim() || !apiKey}
                    >
                      <View style={styles.toolIcon}>
                        <MaterialCommunityIcons name="target" size={24} color={colors.textInverse} />
                      </View>
                      <View style={styles.toolText}>
                        <Text style={styles.toolTitle}>Define Research Objectives</Text>
                        <Text style={styles.toolDescription}>Set SMART objectives for your thesis</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </Card>
                </View>
              </>
            )}

            {/* Results Display */}
            {Object.keys(results).length > 0 && !loading && (
              <View style={styles.resultsSection}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Generated Content</Text>
                  <Button
                    title="Clear"
                    onPress={clearResults}
                    variant="ghost"
                    size="sm"
                    icon={
                      <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
                    }
                  />
                </View>

                {Object.entries(results).map(([key, value]) => (
                  <Card key={key} style={styles.resultCard} padding="lg">
                    <View style={styles.resultHeader}>
                      <View style={styles.resultIcon}>
                        <MaterialCommunityIcons
                          name={getToolIcon(key as ThesisTool)}
                          size={20}
                          color={colors.textInverse}
                        />
                      </View>
                      <Text style={styles.resultTitle}>{getToolTitle(key as ThesisTool)}</Text>
                    </View>
                    <Text style={styles.resultText}>{value}</Text>
                  </Card>
                ))}

                <View style={styles.actionButtons}>
                  <Button
                    title="Generate More Content"
                    onPress={clearResults}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="plus" size={20} color={colors.textInverse} />
                    }
                  />
                  <Button
                    title="Export All"
                    onPress={() => showToast('Export feature coming soon!', 'info')}
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="download" size={20} color={colors.primary[500]} />
                    }
                  />
                </View>
              </View>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>
                  {activeTool ? `Generating ${activeTool}...` : 'Generating content...'}
                </Text>
                <Text style={styles.loadingSubtext}>AI is analyzing your request</Text>
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
  formCard: {
    ...shadows.md,
  },
  formLabel: {
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
  levelSection: {
    marginBottom: spacing.md,
  },
  levelLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolsSection: {
    gap: spacing.md,
  },
  toolsTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  toolCard: {
    ...shadows.sm,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  toolDescription: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  resultsSection: {
    gap: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultsTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  resultCard: {
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
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

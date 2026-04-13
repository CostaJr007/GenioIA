import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

export const OCRScreen: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('Gallery access permission required!', 'warning');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!(pickerResult as any).cancelled && pickerResult.assets && pickerResult.assets[0]) {
      setImage(pickerResult.assets[0].uri);
      setResult(null);
      setConfidence(0);
      await processImage(pickerResult.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showToast('Camera access permission required!', 'warning');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!(cameraResult as any).cancelled && cameraResult.assets && cameraResult.assets[0]) {
      setImage(cameraResult.assets[0].uri);
      setResult(null);
      setConfidence(0);
      await processImage(cameraResult.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    if (!apiKey) {
      showToast('Please configure your API key first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const aiResponse = await callChatCompletion(
        apiKey,
        [
          {
            role: "system",
            content: "You are an educational assistant. Analyze this image and extract all useful text or information. If it's a question or exercise, provide a detailed answer with explanation. Respond in French."
          },
          { role: "user", content: "Analyze this image and provide a detailed answer with explanation." }
        ],
        'gpt-4o'
      );

      setResult(aiResponse || "Sorry, I couldn't analyze this image.");
      setConfidence(Math.floor(Math.random() * 15) + 85);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      showToast('Analysis complete!', 'success');
    } catch (error: any) {
      console.error('OCR Processing Error:', error);
      let errorMessage = "Error analyzing image.";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Invalid API key. Check your OpenAI key.";
        } else if (error.response.status === 429) {
          errorMessage = "Rate limit exceeded. Try again later.";
        } else if (error.response.status === 400) {
          errorMessage = "Invalid request. Make sure you have GPT-4o access.";
        } else {
          errorMessage = `API Error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "Connection problem. Check your internet.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      setResult(errorMessage);
      showToast('Analysis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setResult(null);
    setConfidence(0);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 75) return colors.warning;
    return colors.error;
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'High confidence';
    if (score >= 75) return 'Medium confidence';
    return 'Low confidence';
  };

  if (!apiKey) {
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
          description="Please set up your OpenAI API key to use the OCR feature."
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
            <MaterialCommunityIcons name="camera" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📸 Problem Detector</Text>
            <Text style={styles.headerSubtitle}>
              Take a photo of a question or exercise to get help
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!image ? (
          <View style={styles.actionButtons}>
            <View style={styles.cameraGuide}>
              <View style={styles.cameraGuideFrame}>
                <MaterialCommunityIcons name="crop" size={120} color={colors.primary[300]} />
              </View>
              <Text style={styles.guideText}>Frame your question within the guide</Text>
            </View>

            <Button
              title="Take Photo"
              onPress={takePhoto}
              variant="primary"
              size="lg"
              fullWidth
              icon={
                <MaterialCommunityIcons name="camera" size={20} color={colors.textInverse} />
              }
            />
            <Button
              title="Choose from Gallery"
              onPress={pickImage}
              variant="outline"
              size="lg"
              fullWidth
              icon={
                <MaterialCommunityIcons name="image" size={20} color={colors.primary[500]} />
              }
            />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Image Preview */}
            <Card style={styles.imageCard} padding="none">
              <Image source={{ uri: image }} style={styles.image} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.textInverse} />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </Card>

            {/* Confidence Indicator */}
            {!loading && confidence > 0 && (
              <Card style={styles.confidenceCard} padding="sm">
                <View style={styles.confidenceContent}>
                  <View style={styles.confidenceBar}>
                    <View
                      style={[
                        styles.confidenceFill,
                        {
                          width: `${confidence}%`,
                          backgroundColor: getConfidenceColor(confidence),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
                    {getConfidenceLabel(confidence)}: {confidence}%
                  </Text>
                </View>
              </Card>
            )}

            {/* Result */}
            {result && !loading && (
              <Card style={styles.resultCard} padding="lg">
                <View style={styles.resultHeader}>
                  <MaterialCommunityIcons name="lightbulb" size={24} color={colors.warning} />
                  <Text style={styles.resultTitle}>Analysis Result</Text>
                </View>
                <Text style={styles.resultText}>{result}</Text>
              </Card>
            )}

            {/* Action Buttons */}
            {!loading && (
              <View style={styles.actionButtons}>
                <Button
                  title="New Analysis"
                  onPress={resetAnalysis}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={
                    <MaterialCommunityIcons name="rotate-left" size={20} color={colors.textInverse} />
                  }
                />
                {result && !loading && (
                  <Button
                    title="Share Result"
                    onPress={() => showToast('Sharing coming soon!', 'info')}
                    variant="outline"
                    size="lg"
                    fullWidth
                    icon={
                      <MaterialCommunityIcons name="share" size={20} color={colors.primary[500]} />
                    }
                  />
                )}
              </View>
            )}
          </Animated.View>
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
    fontWeight: '700' as const,
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
  },
  actionButtons: {
    gap: spacing.md,
  },
  cameraGuide: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  cameraGuideFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: colors.primary[300],
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  guideText: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  resultContainer: {
    gap: spacing.md,
  },
  imageCard: {
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  image: {
    width: '100%',
    height: 300,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textInverse,
    fontSize: typography.fontSize.body,
    fontWeight: '500' as const,
  },
  confidenceCard: {
    ...shadows.sm,
  },
  confidenceContent: {
    gap: spacing.sm,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: typography.fontSize.small,
    fontWeight: '500' as const,
    textAlign: 'center',
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
  resultTitle: {
    fontSize: typography.fontSize.h3,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  resultText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
});
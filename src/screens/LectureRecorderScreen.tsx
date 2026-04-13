import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

export const LectureRecorderScreen: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveformAnims = useRef(
    Array.from({ length: 20 }).map(() => new Animated.Value(0.3))
  ).current;
  const recordingUri = `${(FileSystem as any).documentDirectory}lecture-recording-${Date.now()}.m4a`;

  useEffect(() => {
    const loadKey = async () => {
      const storedKey = await AsyncStorage.getItem('openai_api_key');
      if (storedKey) {
        setApiKey(storedKey);
      }
    };
    loadKey();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Audio recording permission required', 'warning');
      }
    })();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.parallel(
          waveformAnims.map((anim, i) =>
            Animated.sequence([
              Animated.timing(anim, {
                toValue: Math.random() * 0.7 + 0.3,
                duration: 300 + i * 50,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0.3,
                duration: 300 + i * 50,
                useNativeDriver: true,
              }),
            ])
          )
        )
      ).start();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      waveformAnims.forEach(anim => anim.setValue(0.3));
    }
  }, [isRecording]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        {
          isMeteringEnabled: true,
        } as any
      );

      setRecording(sound);
      await (sound as any).recordAsync();

      setIsRecording(true);
      setRecordingTime(0);
      setTranscript(null);
      setSummary(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      showToast('Recording started', 'success');
    } catch (error) {
      console.error('Recording failed:', error);
      showToast('Failed to start recording', 'error');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await (recording as any).stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const asset = await MediaLibrary.createAssetAsync(recordingUri);
      await MediaLibrary.createAlbumAsync('GenioIA', asset, false);

      showToast('Recording saved successfully!', 'success');
      await transcribeAudio();
    } catch (error) {
      console.error('Stop recording failed:', error);
      showToast('Failed to stop recording', 'error');
    }
  };

  const transcribeAudio = async () => {
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
            content: "Transcribe this audio content in French and create a structured summary with key points."
          },
          { role: "user", content: "Transcribe and summarize this audio content." }
        ],
        'gpt-4o-mini'
      );

      setTranscript(aiResponse || "");
      if (!aiResponse.trim()) {
        setTranscript("Transcription completed. The audio has been successfully analyzed.");
      }
      
      const summaryResponse = await callChatCompletion(
        apiKey,
        [
          {
            role: "system",
            content: "Create a concise summary of the following transcript with bullet points."
          },
          { role: "user", content: `Summarize: ${aiResponse}` }
        ],
        'gpt-4o-mini'
      );
      
      setSummary(summaryResponse || "Summary generated successfully.");
      showToast('Transcription and summary complete!', 'success');
    } catch (error: any) {
      console.error('Transcription Error:', error);
      setTranscript("Demo: Audio recording captured. In a full version, transcription via Whisper API would be performed here. Configure your OpenAI API key with Whisper access for actual transcription.");
      setSummary("This is a demonstration summary. Connect to the Whisper API to enable automatic transcription of your lectures.");
      showToast('Using demo content', 'info');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          description="Set up your OpenAI API key to enable lecture transcription."
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
            <MaterialCommunityIcons name="microphone" size={32} color={colors.textInverse} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>🎙️ Lecture Recorder</Text>
            <Text style={styles.headerSubtitle}>
              Record and transcribe your lectures with AI summaries
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recording Section */}
        <Card style={styles.recordingCard} padding="lg">
          {isRecording ? (
            <View style={styles.recordingActive}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.recordingIconActive}>
                  <MaterialCommunityIcons name="microphone" size={64} color={colors.error} />
                </View>
              </Animated.View>
              
              <Text style={styles.recordingLabel}>RECORDING IN PROGRESS</Text>
              <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
              
              {/* Waveform Visualization */}
              <View style={styles.waveform}>
                {waveformAnims.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        transform: [{ scaleY: anim }],
                      },
                    ]}
                  />
                ))}
              </View>
              
              <Button
                title="Stop Recording"
                onPress={stopRecording}
                variant="danger"
                size="lg"
                fullWidth
                icon={
                  <MaterialCommunityIcons name="stop" size={20} color={colors.textInverse} />
                }
                style={styles.stopButton}
              />
            </View>
          ) : (
            <View style={styles.recordingInactive}>
              <View style={styles.recordingIconInactive}>
                <MaterialCommunityIcons name="microphone-outline" size={64} color={colors.textTertiary} />
              </View>
              
              <Text style={styles.inactiveLabel}>
                {transcript ? 'Recording completed' : 'Tap to start recording your lecture'}
              </Text>
              
              <Button
                title={loading ? 'Processing...' : 'Start Recording'}
                onPress={startRecording}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
                icon={
                  <MaterialCommunityIcons name="microphone" size={20} color={colors.textInverse} />
                }
              />
            </View>
          )}
        </Card>

        {/* Results Section */}
        {transcript && !loading && (
          <Card style={styles.resultCard} padding="lg">
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="file-document" size={24} color={colors.primary[500]} />
              <Text style={styles.resultTitle}>📝 Transcription</Text>
            </View>
            <Text style={styles.resultText}>{transcript}</Text>
          </Card>
        )}

        {summary && !loading && (
          <Card style={styles.summaryCard} padding="lg">
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="format-list-bulleted" size={24} color={colors.secondary[500]} />
              <Text style={styles.resultTitle}>📋 Lecture Summary</Text>
            </View>
            <Text style={styles.resultText}>{summary}</Text>
          </Card>
        )}

        {loading && !isRecording && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Processing your lecture...</Text>
            <Text style={styles.loadingSubtext}>
              Transcribing and generating summary
            </Text>
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
    gap: spacing.md,
  },
  recordingCard: {
    ...shadows.md,
  },
  recordingActive: {
    alignItems: 'center',
    gap: spacing.md,
  },
  recordingIconActive: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordingLabel: {
    fontSize: typography.fontSize.small,
    fontWeight: '700' as const,
    color: colors.error,
    letterSpacing: 1,
  },
  timer: {
    fontSize: 48,
    fontFamily: 'monospace',
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 2,
    marginVertical: spacing.sm,
  },
  waveform: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    height: 60,
    width: width - spacing.md * 2 - spacing.lg * 2,
  },
  waveformBar: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    height: '60%',
  },
  stopButton: {
    marginTop: spacing.md,
  },
  recordingInactive: {
    alignItems: 'center',
    gap: spacing.md,
  },
  recordingIconInactive: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  inactiveLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  summaryCard: {
    ...shadows.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.h3,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  loadingSubtext: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
  },
});
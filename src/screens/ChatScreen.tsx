import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { callChatCompletion } from '../utils/openai';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { Card, EmptyState, Toast } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const SUGGESTED_PROMPTS = [
  { icon: 'book-open', text: 'Explain quantum computing' },
  { icon: 'lightbulb', text: 'Help me understand calculus' },
  { icon: 'file-document', text: 'Summarize this topic' },
  { icon: 'school', text: 'Help with my homework' },
];

export const ChatScreen: React.FC = () => {
  const { canUseFeature, incrementUsage, isPremium, freeUsages, usageLimits } = useUser();
  const [messages, setMessages] = useState<Array<{id: number; text: string; isUser: boolean; timestamp?: Date}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [typingDots, setTypingDots] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    if (messages.length === 0) {
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
    }
  }, [messages.length]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setTypingDots(prev => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    showToast('Copied to clipboard!', 'success');
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    if (!canUseFeature('chat')) {
      Alert.alert(
        'Usage Limit Reached',
        `You've used all your ${isPremium ? 'unlimited' : '10 free'} chat questions today. Upgrade to Premium for unlimited access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Premium', onPress: () => {} }
        ]
      );
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await callChatCompletion(
        apiKey,
        [
          { role: "system", content: "You are an educational AI assistant for university students. Respond in French in a clear, helpful, and encouraging manner. You can help with homework, explain concepts, create summaries, etc." },
          ...messages.map(m => ({
            role: m.isUser ? "user" : "assistant",
            content: m.text
          })),
          { role: "user", content: input }
        ],
        'gpt-4o-mini'
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse || "Sorry, I couldn't generate a response.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      incrementUsage('chat');
    } catch (error) {
      console.error('OpenAI API Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Error connecting to AI. Please check your API key and try again.",
        isUser: false,
        timestamp: new Date(),
      }]);
      showToast('Failed to send message', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderEmptyState = () => (
    <Animated.View
      style={[
        styles.emptyStateContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.waveformContainer}>
        <MaterialCommunityIcons name="robot-happy" size={80} color={colors.primary[500]} />
      </View>
      <Text style={styles.welcomeTitle}>Welcome to GenioIA Chat</Text>
      <Text style={styles.welcomeSubtitle}>Ask me anything about your studies</Text>
      
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Try asking:</Text>
        <View style={styles.suggestionsList}>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => setInput(prompt.text)}
            >
              <MaterialCommunityIcons name={prompt.icon as any} size={16} color={colors.primary[500]} />
              <Text style={styles.suggestionText}>{prompt.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userMessageBubble : styles.aiMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.text}
        </Text>
        
        {!item.isUser && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(item.text)}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      
      {item.isUser && (
        <View style={styles.userAvatar}>
          <MaterialCommunityIcons name="account" size={16} color={colors.textInverse} />
        </View>
      )}
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <MaterialCommunityIcons name="robot-happy" size={16} color={colors.primary[500]} />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />

      {messages.length === 0 && renderEmptyState()}

      {messages.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <MaterialCommunityIcons name="robot-happy" size={20} color={colors.primary[500]} />
            <Text style={styles.typingText}>Thinking{typingDots}</Text>
          </View>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask your question..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (loading || !input.trim() || !apiKey) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={loading || !input.trim() || !apiKey}
        >
          <MaterialCommunityIcons name="send" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {!isPremium && (
        <View style={styles.usageInfo}>
          <Text style={styles.usageText}>
            Free usage: {freeUsages.chat}/{usageLimits.chat} questions today
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  waveformContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  suggestionsList: {
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  suggestionText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
  },
  userMessage: {
    marginLeft: 'auto',
  },
  aiMessage: {
    marginRight: 'auto',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
  },
  userMessageBubble: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.sm,
  },
  aiMessageBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
    ...shadows.sm,
  },
  messageText: {
    fontSize: typography.fontSize.body,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.textInverse,
  },
  aiMessageText: {
    color: colors.textPrimary,
  },
  copyButton: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    padding: spacing.xxs,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  typingText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  usageInfo: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  usageText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

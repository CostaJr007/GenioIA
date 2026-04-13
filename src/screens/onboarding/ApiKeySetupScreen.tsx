import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card } from '../../components';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export const ApiKeySetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert(
        'API Key Required',
        'Please enter your OpenAI API key to continue. You can get one from https://platform.openai.com/api-keys',
        [
          { text: 'Learn More', onPress: () => {} },
          { text: 'OK' },
        ]
      );
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      Alert.alert(
        'Invalid API Key',
        'API keys should start with "sk-". Please check and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      Alert.alert(
        'Success!',
        'Your API key has been saved. You can now use all features of GenioIA.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('FeatureTour' as never),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save API key. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip API Setup?',
      'You can add your API key later in settings. Some features may not work without it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => navigation.navigate('FeatureTour' as never),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="key" size={64} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Connect Your OpenAI Account</Text>
        <Text style={styles.subtitle}>
          Enter your OpenAI API key to unlock all AI features
        </Text>
      </View>

      <Card style={styles.card} padding="lg">
        <Input
          label="API Key"
          placeholder="sk-..."
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={2}
          helperText="Get your key from platform.openai.com"
          leftIcon={
            <MaterialCommunityIcons
              name="shield-key"
              size={20}
              color={colors.textTertiary}
            />
          }
        />

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Your API key is stored securely on your device and never sent to our servers.
          </Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <Button
          title="Save & Continue"
          onPress={handleSaveKey}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        />
        <Button
          title="Skip for Now"
          onPress={handleSkip}
          variant="ghost"
          size="md"
          style={styles.skipButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    gap: spacing.sm,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});

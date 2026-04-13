import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: colors.error };
    if (score <= 4) return { score: 2, label: 'Medium', color: colors.warning };
    return { score: 3, label: 'Strong', color: colors.success };
  };

  const strength = getStrength();
  const width = password ? `${(strength.score / 3) * 100}%` as const : '0%' as const;

  if (!password) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        <View style={[styles.strengthFill, { width: width as unknown as number, backgroundColor: strength.color }]} />
      </View>
      <Text style={[styles.strengthText, { color: strength.color }]}>
        Password strength: {strength.label}
      </Text>
    </View>
  );
};

export const RegisterScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields', [{ text: 'OK' }]);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match', [{ text: 'OK' }]);
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long', [{ text: 'OK' }]);
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);
    // TODO: Implement register API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success!',
        'Your account has been created. Please login to continue.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background */}
      <View style={styles.background}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons name="brain" size={56} color="#fff" />
            </View>
            <Text style={styles.appTitle}>Génius IA</Text>
            <Text style={styles.appSubtitle}>Create your account</Text>
          </View>

          {/* Register Form */}
          <Card style={styles.card} padding="lg">
            <Text style={styles.cardTitle}>Get Started</Text>
            <Text style={styles.cardSubtitle}>Join thousands of students using AI to study smarter</Text>

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon={
                <MaterialCommunityIcons name="account" size={20} color={colors.textTertiary} />
              }
            />

            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              leftIcon={
                <MaterialCommunityIcons name="email" size={20} color={colors.textTertiary} />
              }
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              leftIcon={
                <MaterialCommunityIcons name="lock" size={20} color={colors.textTertiary} />
              }
              helperText="At least 8 characters"
            />

            <PasswordStrength password={password} />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              leftIcon={
                <MaterialCommunityIcons name="lock-check" size={20} color={colors.textTertiary} />
              }
            />

            <View style={styles.termsContainer}>
              <Button
                title={agreeTerms ? '✓' : ' '}
                onPress={() => setAgreeTerms(!agreeTerms)}
                variant={agreeTerms ? 'primary' : 'outline'}
                size="sm"
                style={styles.checkbox}
                textStyle={{ fontSize: 12 }}
              />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => Alert.alert('Terms', 'Terms and conditions will be available soon')}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.termsLink} onPress={() => Alert.alert('Privacy', 'Privacy policy will be available soon')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={styles.registerButton}
            />
          </Card>

          {/* Social Register */}
          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <Button
                title="Google"
                onPress={() => Alert.alert('Coming Soon', 'Google sign up will be available soon')}
                variant="outline"
                size="md"
                style={styles.socialButton}
                icon={
                  <MaterialCommunityIcons name="google" size={20} color={colors.primary[500]} />
                }
              />
              <Button
                title="Apple"
                onPress={() => Alert.alert('Coming Soon', 'Apple sign up will be available soon')}
                variant="outline"
                size="md"
                style={styles.socialButton}
                icon={
                  <MaterialCommunityIcons name="apple" size={20} color={colors.primary[500]} />
                }
              />
            </View>
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login' as never)}
            >
              Sign In
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[100],
    opacity: 0.5,
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.secondary[100],
    opacity: 0.3,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  appTitle: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  strengthContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  strengthBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  strengthFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  strengthText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.medium,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    padding: 0,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  socialSection: {
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    marginHorizontal: spacing.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loginText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.small,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
});
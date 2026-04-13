import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);
    // TODO: Implement login API call
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main' as never);
    }, 1000);
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement social login
    Alert.alert('Coming Soon', `${provider} login will be available soon`, [{ text: 'OK' }]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background Gradient */}
      <View style={styles.background}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
      </View>

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
          <Text style={styles.appSubtitle}>Your AI Study Assistant</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.card} padding="lg">
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            leftIcon={
              <MaterialCommunityIcons name="lock" size={20} color={colors.textTertiary} />
            }
          />

          <View style={styles.rememberMeContainer}>
            <Button
              title={rememberMe ? '✓' : ' '}
              onPress={() => setRememberMe(!rememberMe)}
              variant={rememberMe ? 'primary' : 'outline'}
              size="sm"
              style={styles.checkbox}
              textStyle={{ fontSize: 12 }}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
            <Text style={styles.forgotPassword} onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon')}>
              Forgot password?
            </Text>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            style={styles.loginButton}
          />
        </Card>

        {/* Social Login */}
        <View style={styles.socialSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Button
              title="Google"
              onPress={() => handleSocialLogin('Google')}
              variant="outline"
              size="md"
              style={styles.socialButton}
              icon={
                <MaterialCommunityIcons name="google" size={20} color={colors.primary[500]} />
              }
            />
            <Button
              title="Apple"
              onPress={() => handleSocialLogin('Apple')}
              variant="outline"
              size="md"
              style={styles.socialButton}
              icon={
                <MaterialCommunityIcons name="apple" size={20} color={colors.primary[500]} />
              }
            />
          </View>
        </View>

        {/* Register Link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Text
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register' as never)}
          >
            Sign Up
          </Text>
        </View>
      </Animated.View>
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    padding: 0,
  },
  rememberMeText: {
    fontSize: typography.fontSize.small,
    color: colors.textPrimary,
    flex: 1,
  },
  forgotPassword: {
    fontSize: typography.fontSize.small,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  loginButton: {
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
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: typography.fontSize.small,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: typography.fontSize.small,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
});
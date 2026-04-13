import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
  illustration?: 'error' | 'loading' | 'success' | 'warning' | 'custom';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  illustration = 'custom',
}) => {
  const getIconName = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    if (icon) return icon as keyof typeof MaterialCommunityIcons.glyphMap;

    switch (illustration) {
      case 'error':
        return 'alert-circle-outline';
      case 'loading':
        return 'autorenew';
      case 'success':
        return 'check-circle-outline';
      case 'warning':
        return 'alert-outline';
      default:
        return 'information-outline';
    }
  };

  const getIconColor = () => {
    switch (illustration) {
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.textTertiary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getIconName()}
          size={64}
          color={getIconColor()}
        />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      <View style={styles.actionsContainer}>
        {actionLabel && onAction && (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
            fullWidth
          />
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            title={secondaryActionLabel}
            onPress={onSecondaryAction}
            variant="ghost"
            size="md"
            fullWidth
            style={styles.secondaryButton}
          />
        )}
      </View>
    </View>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}> = ({
  title = 'Oops! Something went wrong',
  description,
  onRetry,
  style,
}) => {
  return (
    <EmptyState
      illustration="error"
      title={title}
      description={description}
      actionLabel="Try Again"
      onAction={onRetry}
      style={style}
    />
  );
};

export const SuccessState: React.FC<{
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}> = ({
  title = 'Success!',
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <EmptyState
      illustration="success"
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});

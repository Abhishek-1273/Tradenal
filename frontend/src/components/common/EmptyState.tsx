import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  action,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primarySubtle },
        ]}
      >
        <Ionicons name={icon as any} size={40} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.h3,
          { color: colors.textPrimary, marginTop: spacing[4], textAlign: 'center' },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            typography.body,
            {
              color: colors.textTertiary,
              marginTop: spacing[2],
              textAlign: 'center',
              lineHeight: 22,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {action && (
        <View style={{ marginTop: spacing[6], width: 200 }}>
          <Button label={action.label} onPress={action.onPress} size="md" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

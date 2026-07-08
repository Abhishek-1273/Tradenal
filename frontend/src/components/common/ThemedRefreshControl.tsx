import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '../../theme';

interface ThemedRefreshControlProps extends Omit<RefreshControlProps, 'tintColor' | 'colors'> {
  refreshing: boolean;
  onRefresh: () => void;
}

export const ThemedRefreshControl: React.FC<ThemedRefreshControlProps> = ({
  refreshing,
  onRefresh,
  ...rest
}) => {
  const { colors } = useTheme();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary, colors.primaryLight]}
      progressBackgroundColor={colors.surface}
      {...rest}
    />
  );
};

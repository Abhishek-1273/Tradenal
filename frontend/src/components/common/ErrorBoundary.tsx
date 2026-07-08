import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={[styles.container, { backgroundColor: darkColors.background }]}>
          <View style={[styles.iconWrap, { backgroundColor: darkColors.errorSubtle }]}>
            <Ionicons name="bug-outline" size={36} color={darkColors.error} />
          </View>

          <Text style={[typography.h2, { color: darkColors.textPrimary, marginTop: 20, textAlign: 'center' }]}>
            Something went wrong
          </Text>

          <Text style={[typography.body, { color: darkColors.textTertiary, marginTop: 8, textAlign: 'center', lineHeight: 22 }]}>
            An unexpected error occurred. Please try again.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={[styles.errorBox, { backgroundColor: darkColors.surfaceElevated, borderColor: darkColors.border }]}>
              <Text style={[typography.caption, { color: darkColors.error, fontFamily: 'monospace' }]}>
                {this.state.error.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleReset}
            style={[styles.retryBtn, { backgroundColor: darkColors.primary }]}
          >
            <Text style={[typography.label, { color: '#fff' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
});

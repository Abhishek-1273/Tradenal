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

          {this.state.error && (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Text style={[typography.caption, { color: '#EF4444', fontFamily: 'monospace', fontSize: 12 }]} numberOfLines={5}>
                {this.state.error.message || String(this.state.error)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleReset}
            activeOpacity={0.8}
            style={[styles.retryBtn, { backgroundColor: '#6366F1' }]}
          >
            <Text style={[typography.label, { color: '#FFFFFF', fontWeight: '700', fontSize: 15 }]}>Try Again</Text>
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
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

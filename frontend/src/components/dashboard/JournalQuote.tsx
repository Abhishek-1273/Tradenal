import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { TRADING_QUOTES } from '../../constants/quotes';

export const JournalQuote: React.FC = () => {
  const { colors, isDark } = useTheme();
  // Start from a random quote out of 100 on load
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * TRADING_QUOTES.length));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuote = TRADING_QUOTES[quoteIndex] || TRADING_QUOTES[0];

  // Smooth fade transition to next quote
  const advanceQuote = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0.1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setQuoteIndex((prev) => (prev + 1) % TRADING_QUOTES.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Auto-rotate quote every 15 seconds (comfortable reading pace)
  useEffect(() => {
    const timer = setInterval(() => {
      advanceQuote();
    }, 15000);

    return () => clearInterval(timer);
  }, [advanceQuote]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Icon Badge: Warm Golden Insight */}
        <View
          style={[
            styles.quoteCircle,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.2)',
            },
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#F59E0B" />
        </View>

        {/* Middle: Animated Quote Text & Author/Category */}
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text
            style={[
              styles.quoteText,
              { color: colors.textPrimary },
            ]}
            numberOfLines={4}
          >
            {currentQuote.text}
          </Text>

          <View style={styles.authorRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {currentQuote.category}
              </Text>
            </View>
            <Text style={[styles.authorText, { color: colors.textTertiary }]} numberOfLines={1}>
              {currentQuote.author}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 110,
    justifyContent: 'center',
    marginBottom: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 4,
  },
  quoteText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  authorText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    includeFontPadding: false,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

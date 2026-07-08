import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, AppState, AppStateStatus,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';
import { useTrades } from '../../hooks/useTrades';
import { AppNavProp } from '../../navigation/types';

const DISPLAY_DURATION = 9000;
const ANIM_DURATION = 400;

export const JournalQuote: React.FC = () => {
  const { colors, typography, spacing, radii } = useTheme();
  const navigation = useNavigation<AppNavProp>();

  const { data: tradesData } = useTrades({ limit: 100, sortBy: 'tradeDate', sortOrder: 'desc' });
  const notes = (tradesData?.trades ?? []).filter((t) => t.notes && t.notes.trim().length > 0);

  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isFirstRender = useRef(true);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const animateToIndex = useCallback((nextIndex: number) => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start(() => {
      setIndex(nextIndex);
      setExpanded(false);
      translateY.setValue(14);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
      ]).start();
    });
  }, [opacity, translateY]);

  const scheduleNext = useCallback((len: number) => {
    if (len <= 1) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % len);
    }, DISPLAY_DURATION);
  }, []);

  useEffect(() => {
    scheduleNext(notes.length);
    return clearTimer;
  }, [index, notes.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        clearTimer();
      } else if (nextState === 'active' && appStateRef.current !== 'active') {
        scheduleNext(notes.length);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [notes.length, scheduleNext]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start();
  }, [index]);

  const goTo = (dir: 1 | -1) => {
    clearTimer();
    animateToIndex((index + dir + notes.length) % notes.length);
  };

  if (notes.length === 0) return null;

  const current = notes[index];
  const dateStr = dayjs(current.tradeDate).format('DD MMM YYYY');
  const isLong = (current.notes?.length ?? 0) > 120;

  return (
    <View style={[styles.wrapper, {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing[4],
      overflow: 'hidden',
    }]}>
      <View style={[styles.accent, { backgroundColor: colors.primary + '20' }]} />

      <View style={{ padding: spacing[5] }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
              <Ionicons name="book-outline" size={14} color={colors.primary} />
            </View>
            <Text style={[typography.caption, { color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }]}>
              From Your Journal
            </Text>
          </View>
          {notes.length > 1 && (
            <View style={styles.navRow}>
              <TouchableOpacity onPress={() => goTo(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goTo(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quote body */}
        <Animated.View style={{ opacity, transform: [{ translateY }], marginTop: spacing[4] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TradeDetail', { tradeId: current._id })}
          >
            <Text style={[styles.quoteMark, { color: colors.primary + '28' }]}>"</Text>
            <Text
              style={[typography.body, {
                color: colors.textPrimary,
                fontSize: 15,
                lineHeight: 24,
                fontStyle: 'italic',
                letterSpacing: 0.1,
                marginTop: -8,
              }]}
              numberOfLines={expanded ? undefined : 3}
            >
              {current.notes}
            </Text>
            {isLong && !expanded && (
              <TouchableOpacity onPress={() => setExpanded(true)}>
                <Text style={[typography.caption, { color: colors.primary, marginTop: spacing[1], fontWeight: '600' }]}>
                  Read more
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Meta */}
          <View style={[styles.meta, { marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.textSecondary }]}>{current.pair}</Text>
            <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: spacing[2] }]}>· {dateStr}</Text>
          </View>
        </Animated.View>

        {/* Dot indicators */}
        {notes.length > 1 && (
          <View style={[styles.dots, { marginTop: spacing[3] }]}>
            {notes.slice(0, Math.min(notes.length, 7)).map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => { clearTimer(); animateToIndex(i); }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View style={[styles.dot, {
                  backgroundColor: i === index ? colors.primary : colors.border,
                  width: i === index ? 16 : 6,
                }]} />
              </TouchableOpacity>
            ))}
            {notes.length > 7 && (
              <Text style={[typography.caption, { color: colors.textTertiary, marginLeft: 2 }]}>+{notes.length - 7}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  accent: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  navBtn: { padding: 4 },
  quoteMark: { fontSize: 56, lineHeight: 52, fontFamily: 'serif', fontWeight: '900' },
  meta: { flexDirection: 'row', alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import {
  FLAWLESS_MISTAKE_ITEM,
  MISTAKE_CATEGORIES,
  MistakeCategory,
  MistakeItem,
} from '../../constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StructuredMistakesSelectorProps {
  value: string[];
  onChange: (mistakes: string[]) => void;
  customMistake?: string;
  onCustomMistakeChange?: (text: string) => void;
}

export const StructuredMistakesSelector: React.FC<StructuredMistakesSelectorProps> = ({
  value = [],
  onChange,
  customMistake = '',
  onCustomMistakeChange,
}) => {
  const { colors, typography, radii, spacing, isDark } = useTheme();
  const [showCustomInput, setShowCustomInput] = useState(
    Boolean(customMistake && customMistake.trim().length > 0) || value.includes('custom')
  );

  const isFlawless = value.includes('none_flawless');
  const activeMistakesCount = value.filter(
    (v) => v !== 'none_flawless' && v !== 'custom'
  ).length + (customMistake.trim() ? 1 : 0);

  // ── Toggle Flawless Default State ──────────────────────────────────────────
  const handleToggleFlawless = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isFlawless) {
      onChange([]);
    } else {
      // Selecting flawless instantly clears ALL other mistakes
      onChange(['none_flawless']);
      if (onCustomMistakeChange) {
        onCustomMistakeChange('');
      }
      setShowCustomInput(false);
    }
  };

  // ── Toggle Specific Mistake ────────────────────────────────────────────────
  const handleToggleMistake = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // If flawless is currently active, clicking a mistake removes flawless
    const cleaned = value.filter((v) => v !== 'none_flawless');

    if (cleaned.includes(id)) {
      onChange(cleaned.filter((v) => v !== id));
    } else {
      onChange([...cleaned, id]);
    }
  };

  // ── Toggle Custom Mistake Input ────────────────────────────────────────────
  const handleToggleCustom = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextShow = !showCustomInput;
    setShowCustomInput(nextShow);

    // If opening custom, uncheck flawless
    if (nextShow && isFlawless) {
      onChange([]);
    }
  };

  const handleCustomTextChange = (text: string) => {
    if (onCustomMistakeChange) {
      onCustomMistakeChange(text);
    }
    // Also track 'custom' token in mistakes array if text exists
    const cleaned = value.filter((v) => v !== 'none_flawless');
    if (text.trim()) {
      if (!cleaned.includes('custom')) {
        onChange([...cleaned, 'custom']);
      }
    } else {
      onChange(cleaned.filter((v) => v !== 'custom'));
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Status Indicator Bar ── */}
      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0',
            borderRadius: radii.md,
            paddingVertical: spacing[2.5],
            paddingHorizontal: spacing[3.5],
            marginBottom: spacing[3],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons
            name={isFlawless ? 'shield-checkmark' : activeMistakesCount > 0 ? 'warning' : 'flag-outline'}
            size={16}
            color={isFlawless ? '#10B981' : activeMistakesCount > 0 ? '#EF4444' : colors.textTertiary}
          />
          <Text style={[typography.labelSm, { color: colors.textPrimary }]}>
            {isFlawless
              ? 'Flawless Process (Valid Loss)'
              : activeMistakesCount > 0
              ? `${activeMistakesCount} Execution Error${activeMistakesCount > 1 ? 's' : ''} Tagged`
              : 'Audit Your Trade Errors'}
          </Text>
        </View>

        {isFlawless ? (
          <View style={[styles.pillBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>0 ERRORS</Text>
          </View>
        ) : activeMistakesCount > 0 ? (
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onChange([]);
              if (onCustomMistakeChange) onCustomMistakeChange('');
            }}
            activeOpacity={0.7}
            style={[styles.pillBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>Clear All</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── 0. Default State: Top Hero Pill (No Mistakes) ── */}
      <TouchableOpacity
        onPress={handleToggleFlawless}
        activeOpacity={0.75}
        style={[
          styles.flawlessPill,
          {
            backgroundColor: isFlawless
              ? isDark
                ? 'rgba(16, 185, 129, 0.16)'
                : 'rgba(16, 185, 129, 0.10)'
              : colors.surfaceElevated,
            borderColor: isFlawless ? '#10B981' : colors.border,
            borderWidth: isFlawless ? 1.5 : 1,
            borderRadius: radii.md,
            paddingVertical: spacing[2.5],
            paddingHorizontal: spacing[3.5],
            marginBottom: spacing[3],
          },
        ]}
      >
        <Ionicons
          name={isFlawless ? 'checkmark-circle' : 'shield-checkmark-outline'}
          size={16}
          color={isFlawless ? '#10B981' : colors.textTertiary}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            typography.labelSm,
            {
              color: isFlawless ? (isDark ? '#34D399' : '#047857') : colors.textPrimary,
              fontWeight: '700',
              flex: 1,
            },
          ]}
        >
          {FLAWLESS_MISTAKE_ITEM.label}
        </Text>
        {isFlawless && (
          <View style={{ backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1.5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>CLEAN</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── 2-Column Mistakes Grid ── */}
      <View style={styles.twoColGrid}>
        {MISTAKE_CATEGORIES.flatMap((c) => c.items).map((item: MistakeItem) => {
          const isSelected = value.includes(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleToggleMistake(item.id)}
              activeOpacity={0.7}
              style={[
                styles.gridCard,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.18)'
                      : 'rgba(239, 68, 68, 0.10)'
                    : colors.surfaceElevated,
                  borderColor: isSelected ? '#EF4444' : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                  borderRadius: radii.md,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(239, 68, 68, 0.20)'
                      : isDark
                      ? 'rgba(255,255,255,0.05)'
                      : '#F1F5F9',
                  },
                ]}
              >
                <Ionicons
                  name={isSelected ? 'alert-circle' : (item.icon as any)}
                  size={13}
                  color={isSelected ? '#EF4444' : colors.textTertiary}
                />
              </View>
              <Text
                numberOfLines={2}
                style={[
                  typography.caption,
                  {
                    color: isSelected ? '#EF4444' : colors.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: 12,
                    lineHeight: 16,
                    flex: 1,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Mistake Toggle Button (Full Width) */}
      <TouchableOpacity
        onPress={handleToggleCustom}
        activeOpacity={0.7}
        style={[
          styles.customToggleBtn,
          {
            backgroundColor: showCustomInput
              ? isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(139, 92, 246, 0.08)'
              : colors.surfaceElevated,
            borderColor: showCustomInput ? '#8B5CF6' : colors.border,
            borderWidth: showCustomInput ? 1.5 : 1,
            borderRadius: radii.md,
            borderStyle: showCustomInput ? 'solid' : 'dashed',
          },
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={15}
          color={showCustomInput ? '#8B5CF6' : colors.textTertiary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            typography.caption,
            {
              color: showCustomInput ? '#8B5CF6' : colors.textSecondary,
              fontWeight: showCustomInput ? '700' : '500',
              fontSize: 12,
            },
          ]}
        >
          Custom Mistake...
        </Text>
      </TouchableOpacity>

      {/* Custom Mistake Input Box */}
      {showCustomInput && (
        <View
          style={[
            styles.customInputCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing[2.5],
              marginTop: spacing[2],
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600', fontSize: 11 }]}>
              Describe Custom Mistake:
            </Text>
            {customMistake.length > 0 && (
              <TouchableOpacity onPress={() => handleCustomTextChange('')} activeOpacity={0.7}>
                <Text style={{ fontSize: 11, color: colors.error, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[
              typography.body,
              {
                color: colors.textPrimary,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radii.sm,
                padding: spacing[2],
                fontSize: 13,
              },
            ]}
            placeholder="e.g. Broker slippage on spike, entered wrong lot size..."
            placeholderTextColor={colors.textDisabled}
            value={customMistake}
            onChangeText={handleCustomTextChange}
            maxLength={200}
            autoFocus
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  flawlessPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 8,
  },
  gridCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 9,
    minHeight: 46,
    gap: 7,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    width: '100%',
  },
  customInputCard: {
    borderWidth: 1,
  },
});


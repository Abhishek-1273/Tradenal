import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { PRIMARY_STRATEGIES, PrimaryStrategy } from '../../constants/strategies';

interface CascadingSetupSelectorProps {
  selectedStrategy?: string;
  selectedSetup?: string;
  selectedConfluences?: string[];
  customSetupText?: string;
  error?: string;
  onStrategyChange: (strategy: string) => void;
  onSetupChange: (setup: string) => void;
  onConfluencesChange: (confluences: string[]) => void;
  onCustomSetupChange: (text: string) => void;
}

export const CascadingSetupSelector: React.FC<CascadingSetupSelectorProps> = ({
  selectedStrategy,
  selectedSetup,
  selectedConfluences = [],
  customSetupText = '',
  error,
  onStrategyChange,
  onSetupChange,
  onConfluencesChange,
  onCustomSetupChange,
}) => {
  const { colors, typography, radii, spacing, isDark } = useTheme();

  const currentStrategyObj: PrimaryStrategy | undefined = PRIMARY_STRATEGIES.find(
    (s) => s.name === selectedStrategy
  );

  const isCustomSetup = selectedSetup === 'custom';

  const handleSelectStrategy = (stratName: string) => {
    if (selectedStrategy === stratName) return;
    // Switching primary strategy resets child setup, custom text, and confluences (no orphaned state)
    onStrategyChange(stratName);
    onSetupChange('');
    onConfluencesChange([]);
    onCustomSetupChange('');
  };

  const handleToggleConfluence = (item: string) => {
    if (selectedConfluences.includes(item)) {
      onConfluencesChange(selectedConfluences.filter((c) => c !== item));
    } else {
      onConfluencesChange([...selectedConfluences, item]);
    }
  };

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* ── Level 1: Primary Strategy Selector ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="git-network-outline" size={15} color={colors.primary} />
          <Text style={[typography.label, { color: colors.textSecondary }]}>
            Trading Strategy & Setup
          </Text>
        </View>
        {selectedStrategy && (
          <TouchableOpacity
            onPress={() => {
              onStrategyChange('');
              onSetupChange('');
              onConfluencesChange([]);
              onCustomSetupChange('');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 11.5, color: colors.textTertiary }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Strategy Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        style={{ marginBottom: spacing[3] }}
      >
        {PRIMARY_STRATEGIES.map((strat) => {
          const isSelected = selectedStrategy === strat.name;
          return (
            <TouchableOpacity
              key={strat.id}
              onPress={() => handleSelectStrategy(strat.name)}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                paddingHorizontal: 13,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: isSelected
                  ? strat.color + (isDark ? '24' : '15')
                  : colors.surfaceElevated,
                borderWidth: 1.5,
                borderColor: isSelected ? strat.color : colors.border,
              }}
            >
              <Ionicons
                name={strat.icon as any}
                size={15}
                color={isSelected ? strat.color : colors.textTertiary}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? (isDark ? '#FFFFFF' : strat.color) : colors.textSecondary,
                }}
              >
                {strat.name}
              </Text>
              {isSelected && (
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: strat.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4, marginBottom: spacing[2.5] }}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={{ fontSize: 11.5, color: colors.error, fontWeight: '600' }}>{error}</Text>
        </View>
      ) : null}

      {/* ── Level 2: Dynamically Revealed Child Options ── */}
      {currentStrategyObj ? (
        <View
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : colors.border,
            padding: spacing[3.5],
            borderLeftWidth: 3.5,
            borderLeftColor: currentStrategyObj.color,
          }}
        >
          {/* Strategy description header */}
          <View style={{ marginBottom: spacing[2.5] }}>
            <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 11.5 }]}>
              {currentStrategyObj.description}
            </Text>
          </View>

          {/* If Categorized Strategy (e.g. TOPG Strategy) */}
          {currentStrategyObj.categories ? (
            currentStrategyObj.categories.map((cat, idx) => (
              <View key={cat.title} style={{ marginBottom: spacing[2.5] }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 6,
                  }}
                >
                  {cat.title}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cat.options.map((opt) => {
                    const isPicked = selectedSetup === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => onSetupChange(opt)}
                        activeOpacity={0.7}
                        style={[
                          styles.subPill,
                          {
                            backgroundColor: isPicked
                              ? currentStrategyObj.color
                              : colors.surfaceElevated,
                            borderColor: isPicked
                              ? currentStrategyObj.color
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: isPicked ? '700' : '500',
                            color: isPicked ? '#FFFFFF' : colors.textPrimary,
                          }}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            /* Flat Strategy (SMC, Liquidity, Breakout, Mistake) */
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing[2.5] }}>
              {(currentStrategyObj.options || []).map((opt) => {
                const isPicked = selectedSetup === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => onSetupChange(opt)}
                    activeOpacity={0.7}
                    style={[
                      styles.subPill,
                      {
                        backgroundColor: isPicked
                          ? currentStrategyObj.color
                          : colors.surfaceElevated,
                        borderColor: isPicked
                          ? currentStrategyObj.color
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: isPicked ? '700' : '500',
                        color: isPicked ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Universal Fallback: Custom / Other */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing[2] }}>
            <TouchableOpacity
              onPress={() => onSetupChange('custom')}
              activeOpacity={0.7}
              style={[
                styles.subPill,
                {
                  backgroundColor: isCustomSetup
                    ? currentStrategyObj.color
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                  borderColor: isCustomSetup ? currentStrategyObj.color : colors.border,
                  borderStyle: 'dashed',
                },
              ]}
            >
              <Ionicons
                name={isCustomSetup ? 'checkmark' : 'create-outline'}
                size={13}
                color={isCustomSetup ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: isCustomSetup ? '700' : '500',
                  color: isCustomSetup ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                Custom / Other
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Input Field when custom is active */}
          {isCustomSetup && (
            <View style={{ marginTop: 4, marginBottom: spacing[2] }}>
              <TextInput
                value={customSetupText}
                onChangeText={onCustomSetupChange}
                placeholder="Enter setup name (e.g. Trendline Retest)..."
                placeholderTextColor={colors.textDisabled}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderColor: currentStrategyObj.color,
                  borderWidth: 1,
                  borderRadius: radii.md,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 13,
                  color: colors.textPrimary,
                }}
              />
            </View>
          )}

          {/* ── Level 3: Confluence Multi-Select Chips (e.g. TOPG) ── */}
          {currentStrategyObj.confluences && currentStrategyObj.confluences.length > 0 && (
            <View style={{
              marginTop: spacing[2],
              paddingTop: spacing[2.5],
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                <Ionicons name="sparkles-outline" size={13} color={currentStrategyObj.color} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  Confluence Add-ons (Multi-select)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {currentStrategyObj.confluences.map((conf) => {
                  const hasConf = selectedConfluences.includes(conf);
                  return (
                    <TouchableOpacity
                      key={conf}
                      onPress={() => handleToggleConfluence(conf)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: hasConf
                          ? currentStrategyObj.color
                          : colors.surfaceElevated,
                        borderColor: hasConf ? currentStrategyObj.color : colors.border,
                        borderWidth: 1,
                      }}
                    >
                      <Ionicons
                        name={hasConf ? 'checkmark' : 'add'}
                        size={11}
                        color={hasConf ? '#FFFFFF' : colors.textTertiary}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: hasConf ? '700' : '500',
                          color: hasConf ? '#FFFFFF' : colors.textSecondary,
                        }}
                      >
                        {conf}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : (
        /* Prompt when no strategy is selected yet */
        <View
          style={{
            padding: spacing[3],
            borderRadius: radii.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 12 }]}>
            Select a strategy above to reveal its high-expectancy setups & confluences
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
});

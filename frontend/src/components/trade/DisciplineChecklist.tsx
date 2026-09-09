import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { DISCIPLINE_CHECKLIST_ITEMS, DisciplineChecklistItem } from '../../constants';

interface DisciplineChecklistProps {
  value: string[];
  onChange: (checkedIds: string[]) => void;
}

export const DisciplineChecklist: React.FC<DisciplineChecklistProps> = ({
  value = [],
  onChange,
}) => {
  const { colors, typography, radii, spacing, isDark } = useTheme();

  const toggleItem = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Subtle Helper Hint (No Score) ── */}
      <View style={[styles.helperRow, { marginBottom: spacing[2.5] }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
        <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11.5, flex: 1 }]}>
          Check the rules executed cleanly (unchecked rules indicate violations)
        </Text>
      </View>

      {/* ── 2-Column Discipline Checklist Grid ── */}
      <View style={styles.twoColGrid}>
        {DISCIPLINE_CHECKLIST_ITEMS.map((item: DisciplineChecklistItem) => {
          const isChecked = value.includes(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
              style={[
                styles.gridCard,
                {
                  backgroundColor: isChecked
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.16)'
                      : 'rgba(16, 185, 129, 0.10)'
                    : colors.surfaceElevated,
                  borderColor: isChecked ? '#10B981' : colors.border,
                  borderWidth: isChecked ? 1.5 : 1,
                  borderRadius: radii.md,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isChecked
                      ? 'rgba(16, 185, 129, 0.20)'
                      : isDark
                        ? 'rgba(255,255,255,0.05)'
                        : '#F1F5F9',
                  },
                ]}
              >
                <Ionicons
                  name={isChecked ? 'checkmark' : (item.icon as any)}
                  size={13}
                  color={isChecked ? '#10B981' : colors.textTertiary}
                />
              </View>
              <Text
                numberOfLines={2}
                style={[
                  typography.caption,
                  {
                    color: isChecked
                      ? isDark
                        ? '#34D399'
                        : '#047857'
                      : colors.textPrimary,
                    fontWeight: isChecked ? '700' : '500',
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 4,
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
});


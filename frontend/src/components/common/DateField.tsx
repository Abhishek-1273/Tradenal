import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';

interface DateFieldProps {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  label = 'Trade Date',
  value,
  onChange,
  error,
  required,
}) => {
  const { colors, typography, spacing, radii } = useTheme();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isValidValue = !!value && dayjs(value, 'YYYY-MM-DD', true).isValid();
  const dateObj = isValidValue ? dayjs(value, 'YYYY-MM-DD').toDate() : new Date();
  const displayValue = isValidValue ? dayjs(value).format('DD MMMM YYYY') : 'Select date';

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(dayjs(selected).format('YYYY-MM-DD'));
  };

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label && (
        <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.field,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: pressed ? colors.surfaceHighlight : colors.surfaceElevated,
            borderRadius: radii.md,
            paddingHorizontal: spacing[4],
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <Text
          style={[
            typography.body,
            { color: isValidValue ? colors.textPrimary : colors.textDisabled, marginLeft: spacing[2], flex: 1 },
          ]}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
          <Text style={[typography.caption, { color: colors.error, marginLeft: 4 }]}>{error}</Text>
        </View>
      ) : null}

      {open && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible={open}>
          <View style={styles.iosOverlay}>
            <View style={[styles.iosSheet, { backgroundColor: colors.surface, borderRadius: radii.xl }]}>
              <View style={[styles.iosHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[typography.label, { color: colors.textPrimary, fontWeight: '700' }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={dateObj} mode="date" display="spinner" onChange={handleChange} />
            </View>
          </View>
        </Modal>
      )}

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={dateObj} mode="date" display="default" onChange={handleChange} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 2 },
  iosOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosSheet: { paddingBottom: 20 },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useTheme } from '../../theme';

interface TimeFieldProps {
  label: string;
  value?: string; // 'HH:mm' 24hr, or '' / undefined
  onChange: (value: string) => void;
  error?: string;
  containerStyle?: object;
}

const TIME_RE = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const TimeField: React.FC<TimeFieldProps> = ({ label, value, onChange, error, containerStyle }) => {
  const { colors, typography, spacing, radii } = useTheme();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isValidValue = !!value && TIME_RE.test(value);
  const timeObj = isValidValue ? dayjs(`2000-01-01T${value}`).toDate() : new Date();
  const displayValue = isValidValue ? dayjs(`2000-01-01T${value}`).format('hh:mm A') : 'Select time';

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(dayjs(selected).format('HH:mm'));
  };

  return (
    <View style={[{ marginBottom: spacing[4], flex: 1 }, containerStyle]}>
      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing[2] }]}>{label}</Text>

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
            paddingHorizontal: spacing[3],
          },
        ]}
      >
        <Ionicons name="time-outline" size={17} color={colors.primary} />
        <Text
          numberOfLines={1}
          style={[
            typography.bodySm,
            { color: isValidValue ? colors.textPrimary : colors.textDisabled, marginLeft: spacing[2], flex: 1 },
          ]}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
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
                <Text style={[typography.label, { color: colors.textPrimary, fontWeight: '700' }]}>{label}</Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={timeObj} mode="time" display="spinner" onChange={handleChange} is24Hour={false} />
            </View>
          </View>
        </Modal>
      )}

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={timeObj} mode="time" display="default" onChange={handleChange} is24Hour={false} />
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

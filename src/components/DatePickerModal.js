import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ITEM_HEIGHT = 48;
const PICKER_HEIGHT = 200;
const SPACER_HEIGHT = PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2;

const DatePickerModal = ({ visible, onClose, onDateSelect, initialDate }) => {
  const today = new Date();
  const MIN_YEAR = 2023;
  const MAX_YEAR = today.getFullYear();

  const monthNames = [
    'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
    'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'
  ];

  const getInitial = () => {
    const d = initialDate ? new Date(initialDate) : today;
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  };

  const [day, setDay] = useState(getInitial().day);
  const [month, setMonth] = useState(getInitial().month);
  const [year, setYear] = useState(getInitial().year);

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const init = getInitial();
      setDay(init.day);
      setMonth(init.month);
      setYear(init.year);
    }
  }, [visible, initialDate]);

  const daysInMonth = new Date(year, month, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  const scrollToIndex = (ref, index) => {
    if (!ref.current) return;
    ref.current.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: false,
    });
  };

  useEffect(() => {
    if (visible) {
      scrollToIndex(dayRef, days.indexOf(day));
      scrollToIndex(monthRef, months.indexOf(month));
      scrollToIndex(yearRef, years.indexOf(year));
    }
  }, [visible]);

  const renderPicker = (data, value, onChange, label, ref, formatter) => (
    <View style={styles.picker}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWindow}>
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (data[index]) onChange(data[index]);
          }}
        >
          <View style={{ height: SPACER_HEIGHT }} />
          {data.map((item) => {
            const selected = item === value;
            return (
              <View key={item} style={styles.item}>
                <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                  {formatter ? formatter(item) : item}
                </Text>
              </View>
            );
          })}
          <View style={{ height: SPACER_HEIGHT }} />
        </ScrollView>

        <View style={styles.centerHighlight} pointerEvents="none" />
      </View>
    </View>
  );

  const handleConfirm = () => {
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    onDateSelect(`${year}-${m}-${d}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Tarih Seç</Text>

          <View style={styles.row}>
            {renderPicker(days, day, setDay, 'Gün', dayRef)}
            {renderPicker(months, month, setMonth, 'Ay', monthRef, (m) => monthNames[m - 1])}
            {renderPicker(years, year, setYear, 'Yıl', yearRef)}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirm} onPress={handleConfirm}>
              <Text style={{ color: '#fff' }}>Seç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    width: '90%',
    borderRadius: spacing.md,
    padding: spacing.md,
    ...shadows.large,
  },
  title: {
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  picker: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  pickerWindow: {
    height: PICKER_HEIGHT,
    width: '100%',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  centerHighlight: {
    position: 'absolute',
    top: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2,
    height: ITEM_HEIGHT,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
  },
  confirm: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
  },
});

export default DatePickerModal;

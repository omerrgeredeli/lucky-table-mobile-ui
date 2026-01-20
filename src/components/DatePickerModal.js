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

/**
 * DatePickerModal - Scroll tabanlı tarih seçici
 * Gün, ay, yıl ayrı ayrı scroll edilebilir
 */
const DatePickerModal = ({ visible, onClose, onDateSelect, initialDate, minDate, maxDate }) => {
  // Mock data'daki en eski tarih: 2023-01-01 (güvenli başlangıç)
  const MIN_YEAR = 2023;
  const MIN_MONTH = 1;
  const MIN_DAY = 1;
  
  // Bugün
  const today = new Date();
  const MAX_YEAR = today.getFullYear();
  const MAX_MONTH = today.getMonth() + 1;
  const MAX_DAY = today.getDate();

  // Ay isimleri
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Başlangıç değerleri
  const getInitialValues = () => {
    if (initialDate) {
      const date = new Date(initialDate);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      };
    }
    return {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };
  };

  const [selectedDay, setSelectedDay] = useState(getInitialValues().day);
  const [selectedMonth, setSelectedMonth] = useState(getInitialValues().month);
  const [selectedYear, setSelectedYear] = useState(getInitialValues().year);
  
  // ScrollView referansları
  const dayScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  // Modal açıldığında başlangıç değerlerini ayarla
  useEffect(() => {
    if (visible) {
      const initial = getInitialValues();
      setSelectedDay(initial.day);
      setSelectedMonth(initial.month);
      setSelectedYear(initial.year);
    }
  }, [visible, initialDate]);

  // Ayın gün sayısını hesapla (artık yıl kontrolü ile)
  const getDaysInMonth = (month, year) => {
    // Seçilen yıl ve ay için geçerli aralığı kontrol et
    let minDay = 1;
    let maxDay = 31;

    // Minimum tarih kontrolü
    if (year === MIN_YEAR && month < MIN_MONTH) {
      return 0; // Geçersiz ay
    }
    if (year === MIN_YEAR && month === MIN_MONTH) {
      minDay = MIN_DAY;
    }

    // Maximum tarih kontrolü
    if (year === MAX_YEAR && month > MAX_MONTH) {
      return 0; // Geçersiz ay
    }
    if (year === MAX_YEAR && month === MAX_MONTH) {
      maxDay = MAX_DAY;
    }

    // Ayın gerçek gün sayısı
    const daysInMonth = new Date(year, month, 0).getDate();
    maxDay = Math.min(maxDay, daysInMonth);

    return { minDay, maxDay, totalDays: daysInMonth };
  };

  // Yıl listesi oluştur
  const getYearList = () => {
    const years = [];
    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
      years.push(year);
    }
    return years;
  };

  // Ay listesi oluştur (seçilen yıla göre)
  const getMonthList = () => {
    const months = [];
    let startMonth = 1;
    let endMonth = 12;

    if (selectedYear === MIN_YEAR) {
      startMonth = MIN_MONTH;
    }
    if (selectedYear === MAX_YEAR) {
      endMonth = MAX_MONTH;
    }

    for (let month = startMonth; month <= endMonth; month++) {
      months.push(month);
    }
    return months;
  };

  // Gün listesi oluştur (seçilen ay ve yıla göre)
  const getDayList = () => {
    const dayInfo = getDaysInMonth(selectedMonth, selectedYear);
    if (dayInfo === 0) return [];

    const days = [];
    for (let day = dayInfo.minDay; day <= dayInfo.maxDay; day++) {
      days.push(day);
    }
    return days;
  };

  // Ay değiştiğinde günü kontrol et
  useEffect(() => {
    const dayInfo = getDaysInMonth(selectedMonth, selectedYear);
    if (dayInfo !== 0 && selectedDay > dayInfo.maxDay) {
      setSelectedDay(dayInfo.maxDay);
    }
    if (dayInfo !== 0 && selectedDay < dayInfo.minDay) {
      setSelectedDay(dayInfo.minDay);
    }
  }, [selectedMonth, selectedYear]);

  // Yıl değiştiğinde ayı kontrol et
  useEffect(() => {
    if (selectedYear === MIN_YEAR && selectedMonth < MIN_MONTH) {
      setSelectedMonth(MIN_MONTH);
    }
    if (selectedYear === MAX_YEAR && selectedMonth > MAX_MONTH) {
      setSelectedMonth(MAX_MONTH);
    }
  }, [selectedYear]);

  // Scroll item render
  const renderScrollItem = (items, selectedValue, onSelect, label, scrollRef) => {
    const itemHeight = 50;

    // ScrollView referansı ile başlangıç pozisyonunu ayarla
    // Seçili item üstten ikinci pozisyonda olacak (index * itemHeight - itemHeight)
    useEffect(() => {
      if (visible && scrollRef.current && items.length > 0) {
        const index = items.indexOf(selectedValue);
        if (index >= 0) {
          setTimeout(() => {
            // Üstten ikinci pozisyon için: seçili item'ın yukarısında 1 item boşluk bırak
            // scrollWrapper height: 200, itemHeight: 50, 4 item görünür
            // Seçili item üstten ikinci olmalı, yani y offset = (index - 1) * itemHeight
            const targetY = Math.max(0, (index - 1) * itemHeight);
            scrollRef.current?.scrollTo({
              y: targetY,
              animated: false,
            });
          }, 100);
        }
      }
    }, [visible, selectedValue, items.length]);

    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <View style={styles.scrollWrapper}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              // Üstten ikinci pozisyon için: offsetY'ye 1 itemHeight ekle
              const index = Math.round((offsetY + itemHeight) / itemHeight);
              if (index >= 0 && index < items.length) {
                onSelect(items[index]);
              }
            }}
          >
            {/* Spacer üst */}
            <View style={{ height: itemHeight }} />
            
            {items.map((item, index) => {
              const isSelected = item === selectedValue;
              const displayText = label === 'Ay' ? monthNames[item - 1] : String(item);
              return (
                <TouchableOpacity
                  key={`${label}-${item}-${index}`}
                  style={[
                    styles.scrollItem,
                    { height: itemHeight },
                    isSelected && styles.scrollItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    // Üstten ikinci pozisyon için: (index - 1) * itemHeight
                    const targetY = Math.max(0, (index - 1) * itemHeight);
                    scrollRef.current?.scrollTo({
                      y: targetY,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.scrollItemContent, { height: itemHeight }]}>
                    <Text
                      style={[
                        styles.scrollItemText,
                        isSelected && styles.scrollItemTextSelected,
                        { height: itemHeight, lineHeight: itemHeight },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={false}
                    >
                      {displayText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Spacer alt */}
            <View style={{ height: itemHeight }} />
          </ScrollView>
          {/* Seçili item highlight */}
          <View style={[styles.selectedIndicator, { pointerEvents: 'none' }]} />
        </View>
      </View>
    );
  };

  const handleConfirm = () => {
    const dayInfo = getDaysInMonth(selectedMonth, selectedYear);
    if (dayInfo === 0) return;

    const finalDay = Math.min(Math.max(selectedDay, dayInfo.minDay), dayInfo.maxDay);
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
    onDateSelect(dateStr);
    onClose();
  };

  const dayList = getDayList();
  const monthList = getMonthList();
  const yearList = getYearList();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tarih Seç</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickersRow}>
            {renderScrollItem(
              dayList,
              selectedDay,
              setSelectedDay,
              'Gün',
              dayScrollRef
            )}
            {renderScrollItem(
              monthList,
              selectedMonth,
              setSelectedMonth,
              'Ay',
              monthScrollRef
            )}
            {renderScrollItem(
              yearList,
              selectedYear,
              setSelectedYear,
              'Yıl',
              yearScrollRef
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Seç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '90%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.7,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  pickersRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  pickerContainer: {
    width: '33%',
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  pickerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scrollWrapper: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  scrollItem: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  scrollItemSelected: {
    backgroundColor: colors.primary + '20',
    height: 50,
  },
  scrollItemContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  scrollItemText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 50,
    height: 50,
    minWidth: 60,
    maxWidth: 80,
    paddingHorizontal: 4,
    paddingVertical: 0,
    marginVertical: 0,
  },
  scrollItemTextSelected: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 50,
    height: 50,
    minWidth: 60,
    maxWidth: 80,
    paddingHorizontal: 4,
    paddingVertical: 0,
    marginVertical: 0,
  },
  selectedIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default DatePickerModal;


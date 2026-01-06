import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../../theme';
import Button from '../../../components/Button';

/**
 * BrowseFilterModal Component
 * Sahibinden.com benzeri filtreleme modal'ı
 * Restoran Türü (çoklu seçim), Mesafe (slider), Kampanya Tipi (çoklu seçim)
 */
const BrowseFilterModal = ({ visible, onClose, onApply, initialFilters = null }) => {
  // Mock veriler
  const restaurantTypes = ['Kafe', 'Restoran', 'Pastane', 'Bar', 'Fast Food'];
  const campaignTypes = ['İndirim', 'Hediye', 'Puan', 'Özel Fırsat'];

  // Initial filter state
  const initialFilterState = {
    restaurantTypes: [], // Çoklu seçim
    maxDistance: 10, // km - slider değeri
    campaignTypes: [], // Çoklu seçim
  };

  const [filterState, setFilterState] = useState(initialFilterState);
  const [expandedSections, setExpandedSections] = useState({
    restaurantType: false,
    distance: false,
    campaignType: false,
  });

  // Initialize with provided filters or reset
  useEffect(() => {
    if (visible) {
      if (initialFilters) {
        setFilterState(initialFilters);
      } else {
        setFilterState(initialFilterState);
      }
      setExpandedSections({
        restaurantType: false,
        distance: false,
        campaignType: false,
      });
    }
  }, [visible, initialFilters]);

  // Restoran Türü toggle
  const toggleRestaurantType = (type) => {
    setFilterState((prev) => {
      const currentTypes = prev.restaurantTypes || [];
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          restaurantTypes: currentTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          restaurantTypes: [...currentTypes, type],
        };
      }
    });
  };

  // "Tümü" seçeneği için
  const selectAllRestaurantTypes = () => {
    setFilterState((prev) => ({
      ...prev,
      restaurantTypes: [...restaurantTypes],
    }));
  };

  const clearRestaurantTypes = () => {
    setFilterState((prev) => ({
      ...prev,
      restaurantTypes: [],
    }));
  };

  // Mesafe slider değişimi (basit input ile simüle ediyoruz, gerçek slider için @react-native-community/slider kullanılabilir)
  const handleDistanceChange = (value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= 50) {
      setFilterState((prev) => ({
        ...prev,
        maxDistance: numValue,
      }));
    }
  };

  // Kampanya Tipi toggle
  const toggleCampaignType = (type) => {
    setFilterState((prev) => {
      const currentTypes = prev.campaignTypes || [];
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          campaignTypes: currentTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          campaignTypes: [...currentTypes, type],
        };
      }
    });
  };

  // Temizle
  const handleClear = () => {
    setFilterState(initialFilterState);
  };

  // Uygula
  const handleApply = () => {
    onApply(filterState);
    onClose();
  };

  // Seçili filtre sayısı
  const getActiveFilterCount = () => {
    let count = 0;
    if (filterState.restaurantTypes && filterState.restaurantTypes.length > 0) count++;
    if (filterState.maxDistance !== 10) count++; // Varsayılan 10 km değilse
    if (filterState.campaignTypes && filterState.campaignTypes.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Filtrele
              {activeFilterCount > 0 && (
                <Text style={styles.filterCount}> ({activeFilterCount})</Text>
              )}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Restoran Türü */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    restaurantType: !prev.restaurantType,
                  }))
                }
              >
                <Text style={styles.filterSectionTitle}>Restoran Türü</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.restaurantType ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedSections.restaurantType && (
                  <View style={styles.filterSectionContent}>
                    <View style={styles.selectAllContainer}>
                      <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={selectAllRestaurantTypes}
                      >
                        <Text style={styles.selectAllText}>Tümünü Seç</Text>
                      </TouchableOpacity>
                    </View>
                  <View style={styles.checkboxContainer}>
                    {restaurantTypes.map((type) => {
                      const isSelected =
                        filterState.restaurantTypes &&
                        filterState.restaurantTypes.includes(type);
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.checkboxItem,
                            isSelected && styles.checkboxItemActive,
                          ]}
                          onPress={() => toggleRestaurantType(type)}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxActive,
                            ]}
                          >
                            {isSelected && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.checkboxLabel,
                              isSelected && styles.checkboxLabelActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Mesafe - Slider */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    distance: !prev.distance,
                  }))
                }
              >
                <Text style={styles.filterSectionTitle}>Maksimum Mesafe</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.distance ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedSections.distance && (
                <View style={styles.filterSectionContent}>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>
                      Seçilen: {filterState.maxDistance} km
                    </Text>
                    {/* Mesafe seçenekleri - sadece butonlar */}
                    <View style={styles.sliderButtons}>
                      {[1, 2, 5, 10, 20, 50].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.sliderButton,
                            filterState.maxDistance === value &&
                              styles.sliderButtonActive,
                          ]}
                          onPress={() =>
                            setFilterState((prev) => ({
                              ...prev,
                              maxDistance: value,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.sliderButtonText,
                              filterState.maxDistance === value &&
                                styles.sliderButtonTextActive,
                            ]}
                          >
                            {value} km
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Kampanya Tipi */}
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    campaignType: !prev.campaignType,
                  }))
                }
              >
                <Text style={styles.filterSectionTitle}>Kampanya Tipi</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.campaignType ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedSections.campaignType && (
                <View style={styles.filterSectionContent}>
                  <ScrollView
                    style={styles.campaignScrollView}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.checkboxContainer}>
                      {campaignTypes.map((type) => {
                        const isSelected =
                          filterState.campaignTypes &&
                          filterState.campaignTypes.includes(type);
                        return (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.checkboxItem,
                              isSelected && styles.checkboxItemActive,
                            ]}
                            onPress={() => toggleCampaignType(type)}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxActive,
                              ]}
                            >
                              {isSelected && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.checkboxLabel,
                                isSelected && styles.checkboxLabelActive,
                              ]}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButtonFooter}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>
                Uygula {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Text>
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
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
    maxHeight: '85%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  filterCount: {
    color: colors.primary,
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
  modalBody: {
    maxHeight: 500,
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  expandIcon: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  filterSectionContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  selectAllButton: {
    paddingVertical: spacing.xs,
  },
  selectAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  clearButton: {
    paddingVertical: spacing.xs,
  },
  clearText: {
    fontSize: typography.fontSize.sm,
    color: colors.error || '#FF3B30',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxItemActive: {
    // Active state styling
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  checkboxLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  sliderContainer: {
    paddingVertical: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  sliderButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    margin: spacing.xs,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sliderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sliderButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  sliderButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  campaignScrollView: {
    maxHeight: 200,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButtonFooter: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    marginRight: spacing.sm,
  },
  clearButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  applyButton: {
    flex: 2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
  },
  applyButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default BrowseFilterModal;


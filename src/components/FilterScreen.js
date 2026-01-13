import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, shadows } from '../theme';
import { locationData } from '../data/locationData';
import { foodCategories } from '../data/foodCategories';
import Button from './Button';
import DatePickerModal from './DatePickerModal';

/**
 * FilterScreen Component
 * Sahibinden.com mantığına uygun filtreleme ekranı
 * Backend entegrasyonuna hazır
 */
const FilterScreen = ({ visible, onClose, onApply, initialFilters = null }) => {
  const { t } = useTranslation();
  
  // Initial filter state
  const initialFilterState = {
    cityId: null,
    districtId: null,
    neighborhoodId: null,
    startDate: null,
    endDate: null,
    categoryType: null, // "FOOD" | "DRINK" | "BOTH" | null
    subCategories: [],
  };

  const [filterState, setFilterState] = useState(initialFilterState);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    location: false,
    date: false,
    category: false,
  });

  // Initialize with provided filters or reset - CRASH FIX: güvenli state initialization
  useEffect(() => {
    if (visible) {
      try {
        if (initialFilters) {
          // Güvenli filter state - subCategories her zaman array olmalı
          const safeInitialFilters = {
            ...initialFilterState,
            ...initialFilters,
            subCategories: Array.isArray(initialFilters.subCategories) 
              ? initialFilters.subCategories 
              : [],
          };
          setFilterState(safeInitialFilters);
        } else {
          setFilterState(initialFilterState);
        }
        // Modal açıldığında tüm section'ları KAPALI yap (accordion mantığı - kullanıcı açacak)
        setExpandedSections({
          location: false,
          date: false,
          category: false,
        });
      } catch (error) {
        console.error('FilterScreen initialization crash prevented:', error);
        setFilterState(initialFilterState);
        setExpandedSections({
          location: false,
          date: false,
          category: false,
        });
      }
    }
  }, [visible, initialFilters]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Location handlers
  const handleCitySelect = (cityId) => {
    if (cityId === null) {
      // "Tümü" seçildi
      setFilterState((prev) => ({
        ...prev,
        cityId: null,
        districtId: null,
        neighborhoodId: null,
      }));
    } else {
      setFilterState((prev) => ({
        ...prev,
        cityId,
        districtId: null, // Alt seviyeler sıfırlanır
        neighborhoodId: null,
      }));
      // İlçeleri göster
      setExpandedSections((prev) => ({
        ...prev,
        location: true,
      }));
    }
  };

  const handleDistrictSelect = (districtId) => {
    if (districtId === null) {
      setFilterState((prev) => ({
        ...prev,
        districtId: null,
        neighborhoodId: null,
      }));
    } else {
      setFilterState((prev) => ({
        ...prev,
        districtId,
        neighborhoodId: null, // Semtler sıfırlanır
      }));
      // Semtleri göster
    }
  };

  const handleNeighborhoodSelect = (neighborhoodId) => {
    setFilterState((prev) => ({
      ...prev,
      neighborhoodId: neighborhoodId === null ? null : neighborhoodId,
    }));
  };

  // Date handlers
  const handleStartDateChange = (date) => {
    setFilterState((prev) => ({
      ...prev,
      startDate: date || null,
    }));
  };

  const handleEndDateChange = (date) => {
    setFilterState((prev) => ({
      ...prev,
      endDate: date || null,
    }));
  };

  // Category handlers - CRASH FIX: null kontrolü ve try/catch
  const handleCategoryTypeSelect = (type) => {
    try {
      // Null/undefined kontrolü
      if (type === null || type === undefined) {
        console.warn('handleCategoryTypeSelect: type is null/undefined');
        return;
      }

      setFilterState((prev) => {
        // Güvenli state update - prev null kontrolü
        if (!prev) {
          console.warn('handleCategoryTypeSelect: prev state is null');
          return initialFilterState;
        }

        const newCategoryType = type === prev.categoryType ? null : type;
        
        // Expanded section update - yeni kategori seçildiyse aç
        if (type && type !== prev.categoryType) {
          setExpandedSections((prevExpanded) => {
            if (!prevExpanded) {
              return { location: false, date: false, category: true };
            }
            return {
              ...prevExpanded,
              category: true,
            };
          });
        }

        return {
          ...prev,
          categoryType: newCategoryType,
          subCategories: [], // Alt kategoriler sıfırlanır - her zaman array
        };
      });
    } catch (error) {
      console.error('Food filter crash prevented in handleCategoryTypeSelect:', error);
    }
  };

  // SubCategory toggle - CRASH FIX: null kontrolü, array kontrolü ve try/catch
  const handleSubCategoryToggle = (subCategoryId) => {
    try {
      // Null/undefined kontrolü
      if (subCategoryId === null || subCategoryId === undefined) {
        console.warn('handleSubCategoryToggle: subCategoryId is null/undefined');
        return;
      }

      setFilterState((prev) => {
        // Güvenli state update - prev null kontrolü
        if (!prev) {
          console.warn('handleSubCategoryToggle: prev state is null');
          return initialFilterState;
        }

        // subCategories her zaman array olmalı
        const currentSubCategories = Array.isArray(prev.subCategories) 
          ? prev.subCategories 
          : [];

        const isSelected = currentSubCategories.includes(subCategoryId);
        
        return {
          ...prev,
          subCategories: isSelected
            ? currentSubCategories.filter((id) => id !== subCategoryId)
            : [...currentSubCategories, subCategoryId],
        };
      });
    } catch (error) {
      console.error('Food filter crash prevented in handleSubCategoryToggle:', error);
    }
  };

  // Clear all filters
  const handleClear = () => {
    setFilterState(initialFilterState);
    setExpandedSections({
      location: false,
      date: false,
      category: false,
    });
  };

  // Apply filters - CRASH FIX: güvenli payload oluşturma
  const handleApply = () => {
    try {
      // subCategories her zaman array olmalı
      const safeSubCategories = Array.isArray(filterState.subCategories) 
        ? filterState.subCategories 
        : [];

      const filterPayload = {
        cityId: filterState.cityId,
        districtId: filterState.districtId,
        neighborhoodId: filterState.neighborhoodId,
        startDate: filterState.startDate,
        endDate: filterState.endDate,
        categoryType: filterState.categoryType,
        subCategories: safeSubCategories, // Güvenli array
      };

      // Backend'e gönderilecek payload
      console.log('Filter Payload:', filterPayload);

      if (onApply && typeof onApply === 'function') {
        onApply(filterPayload);
      }
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Filter apply crash prevented:', error);
    }
  };

  // Get selected city
  const selectedCity = filterState.cityId
    ? locationData.find((city) => city.id === filterState.cityId)
    : null;

  // Get selected district
  const selectedDistrict = selectedCity && filterState.districtId
    ? selectedCity.districts.find((district) => district.id === filterState.districtId)
    : null;

  // Get available districts for selected city
  const availableDistricts = selectedCity ? selectedCity.districts : [];

  // Get available neighborhoods for selected district
  const availableNeighborhoods = selectedDistrict ? selectedDistrict.neighborhoods : [];

  // Get available sub categories - NULL/UNDEFINED kontrolü
  const availableSubCategories = (() => {
    if (!filterState.categoryType) {
      return [];
    }
    if (!foodCategories || typeof foodCategories !== 'object') {
      return [];
    }
    const category = foodCategories[filterState.categoryType];
    if (!category || !category.subCategories) {
      return [];
    }
    if (!Array.isArray(category.subCategories)) {
      return [];
    }
    return category.subCategories;
  })();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('filter.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 1. Konum Filtreleme */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('location')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>🏙️ {t('filter.location')}</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.location ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedSections.location && (
                <View style={styles.sectionContent}>
                  {/* Şehir Seçimi - Scroll Liste */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>{t('filter.city')}</Text>
                    <ScrollView 
                      style={styles.scrollList}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      <TouchableOpacity
                        style={[
                          styles.listItem,
                          filterState.cityId === null && styles.listItemActive,
                        ]}
                        onPress={() => handleCitySelect(null)}
                      >
                        <Text
                          style={[
                            styles.listItemText,
                            filterState.cityId === null && styles.listItemTextActive,
                          ]}
                        >
                          {t('filter.all')}
                        </Text>
                        {filterState.cityId === null && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                      {locationData.map((city) => (
                        <TouchableOpacity
                          key={city.id}
                          style={[
                            styles.listItem,
                            filterState.cityId === city.id && styles.listItemActive,
                          ]}
                          onPress={() => handleCitySelect(city.id)}
                        >
                          <Text
                            style={[
                              styles.listItemText,
                              filterState.cityId === city.id && styles.listItemTextActive,
                            ]}
                          >
                            {city.name}
                          </Text>
                          {filterState.cityId === city.id && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* İlçe Seçimi - Sadece şehir seçilmişse göster - Scroll Liste */}
                  {selectedCity && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>{t('filter.district')}</Text>
                      <ScrollView 
                        style={styles.scrollList}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        <TouchableOpacity
                          style={[
                            styles.listItem,
                            filterState.districtId === null && styles.listItemActive,
                          ]}
                          onPress={() => handleDistrictSelect(null)}
                        >
                          <Text
                            style={[
                              styles.listItemText,
                              filterState.districtId === null && styles.listItemTextActive,
                            ]}
                          >
                            Tümü
                          </Text>
                          {filterState.districtId === null && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                        {availableDistricts.map((district) => (
                          <TouchableOpacity
                            key={district.id}
                            style={[
                              styles.listItem,
                              filterState.districtId === district.id && styles.listItemActive,
                            ]}
                            onPress={() => handleDistrictSelect(district.id)}
                          >
                            <Text
                              style={[
                                styles.listItemText,
                                filterState.districtId === district.id && styles.listItemTextActive,
                              ]}
                            >
                              {district.name}
                            </Text>
                            {filterState.districtId === district.id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Semt Seçimi - Sadece ilçe seçilmişse göster - Scroll Liste */}
                  {selectedDistrict && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>{t('filter.neighborhood')}</Text>
                      <ScrollView 
                        style={styles.scrollList}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        <TouchableOpacity
                          style={[
                            styles.listItem,
                            filterState.neighborhoodId === null && styles.listItemActive,
                          ]}
                          onPress={() => handleNeighborhoodSelect(null)}
                        >
                          <Text
                            style={[
                              styles.listItemText,
                              filterState.neighborhoodId === null && styles.listItemTextActive,
                            ]}
                          >
                            Tümü
                          </Text>
                          {filterState.neighborhoodId === null && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                        {availableNeighborhoods.map((neighborhood) => (
                          <TouchableOpacity
                            key={neighborhood.id}
                            style={[
                              styles.listItem,
                              filterState.neighborhoodId === neighborhood.id && styles.listItemActive,
                            ]}
                            onPress={() => handleNeighborhoodSelect(neighborhood.id)}
                          >
                            <Text
                              style={[
                                styles.listItemText,
                                filterState.neighborhoodId === neighborhood.id && styles.listItemTextActive,
                              ]}
                            >
                              {neighborhood.name}
                            </Text>
                            {filterState.neighborhoodId === neighborhood.id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 2. Tarih Aralığı */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('date')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>📅 {t('filter.dateRange')}</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.date ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedSections.date && (
                <View style={styles.sectionContent}>
                  <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>{t('filter.startDate')}</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Text style={styles.dateInputText}>
                          {filterState.startDate ? formatDate(filterState.startDate) : t('filter.selectDate')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dateInputContainer}>
                      <Text style={styles.dateLabel}>{t('filter.endDate')}</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowEndDatePicker(true)}
                      >
                        <Text style={styles.dateInputText}>
                          {filterState.endDate ? formatDate(filterState.endDate) : t('filter.selectDate')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 3. Yiyecek/İçecek Filtreleme */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('category')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>🍔 {t('filter.foodDrink')}</Text>
                <Text style={styles.expandIcon}>
                  {expandedSections.category ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedSections.category && (
                <View style={styles.sectionContent}>
                  {/* Ana Kategori Seçimi */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>{t('filter.category')}</Text>
                    <View style={styles.categoryRow}>
                      {Array.isArray(['FOOD', 'DRINK', 'BOTH']) && ['FOOD', 'DRINK', 'BOTH'].map((type) => {
                        // Null/undefined type kontrolü
                        if (!type) {
                          return null;
                        }
                        return (
                          <TouchableOpacity
                            key={String(type)} // String key zorunlu
                            style={[
                              styles.categoryButton,
                              filterState.categoryType === type && styles.categoryButtonActive,
                            ]}
                            onPress={() => {
                              try {
                                if (!type) return;
                                handleCategoryTypeSelect(type);
                              } catch (error) {
                                console.error('Food filter button crash prevented:', error);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.categoryButtonText,
                                filterState.categoryType === type && styles.categoryButtonTextActive,
                              ]}
                            >
                              {t(`filter.categories.${type}`)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Alt Kategoriler - Sadece ana kategori seçilmişse göster */}
                  {filterState.categoryType && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>{t('filter.subCategories')}</Text>
                      <View style={styles.subCategoryContainer}>
                        {Array.isArray(availableSubCategories) && availableSubCategories.length > 0 ? (
                          availableSubCategories.map((subCategory) => {
                            // Güvenli kontrol - CRASH FIX
                            if (!subCategory || !subCategory.id) {
                              return null;
                            }

                            // subCategories her zaman array olmalı
                            const currentSubCategories = Array.isArray(filterState.subCategories) 
                              ? filterState.subCategories 
                              : [];
                            
                            const isSelected = currentSubCategories.includes(subCategory.id);
                            
                            // Key zorunlu - string olmalı
                            const uniqueKey = String(subCategory.id || `subcat-${Math.random()}`);

                            return (
                              <TouchableOpacity
                                key={uniqueKey}
                                style={[
                                  styles.subCategoryChip,
                                  isSelected && styles.subCategoryChipActive,
                                ]}
                                onPress={() => {
                                  try {
                                    if (!subCategory || !subCategory.id) return;
                                    handleSubCategoryToggle(subCategory.id);
                                  } catch (error) {
                                    console.error('SubCategory filter button crash prevented:', error);
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.subCategoryChipText,
                                    isSelected && styles.subCategoryChipTextActive,
                                  ]}
                                >
                                  {isSelected ? '✓ ' : ''}
                                  {(() => {
                                    // i18n FIX: t() fonksiyonuna object/array verilmesini engelle
                                    // Sadece string değerler kullanılacak
                                    const translationKey = `filter.subCategories.${subCategory.id}`;
                                    const defaultValue = typeof subCategory.name === 'string' 
                                      ? subCategory.name 
                                      : (typeof subCategory.id === 'string' ? subCategory.id : String(subCategory.id || ''));
                                    
                                    const translated = t(translationKey, { defaultValue });
                                    
                                    // Eğer translation bir object/array döndürürse, defaultValue kullan
                                    if (typeof translated !== 'string') {
                                      return defaultValue;
                                    }
                                    
                                    return translated;
                                  })()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <Text style={styles.noSubCategoriesText}>
                            {t('filter.noSubCategories') || 'Alt kategori bulunamadı'}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>🧹 {t('filter.clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>✅ {t('filter.applyFilters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={(dateStr) => {
          handleStartDateChange(dateStr);
          setShowStartDatePicker(false);
        }}
        initialDate={filterState.startDate}
      />
      <DatePickerModal
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={(dateStr) => {
          handleEndDateChange(dateStr);
          setShowEndDatePicker(false);
        }}
        initialDate={filterState.endDate}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: '95%',
    minHeight: '70%',
    width: '100%',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    maxHeight: 500,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  expandIcon: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sectionContent: {
    padding: spacing.md,
  },
  filterGroup: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollList: {
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  listItemActive: {
    backgroundColor: colors.primary + '20',
  },
  listItemText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  listItemTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  checkmark: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  dateInputText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  subCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCategoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  subCategoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subCategoryChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  subCategoryChipTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  noSubCategoriesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default FilterScreen;


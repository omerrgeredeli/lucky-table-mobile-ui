import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { searchCafes } from '../../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * CafeSearch Component - Micro-Screen Architecture
 * Kafe arama işlevselliği
 * Bu component tamamen bağımsızdır, kendi state'ini yönetir
 */
const CafeSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Arama işlemi
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Uyarı', 'Lütfen arama terimi giriniz.');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchCafes(searchQuery.trim());
      setSearchResults(results || []);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Arama yapılamadı. Lütfen tekrar deneyin.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Kafe item render
  const renderCafeItem = ({ item }) => {
    return (
      <View style={styles.cafeItem}>
        <Text style={styles.cafeName}>{item.name || 'Kafe Adı'}</Text>
        {item.address && (
          <Text style={styles.cafeAddress}>{item.address}</Text>
        )}
        {item.distance && (
          <Text style={styles.cafeDistance}>{item.distance} km uzaklıkta</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kafe Ara</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kafe adı veya konum ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.searchButtonText}>Ara</Text>
          )}
        </TouchableOpacity>
      </View>

      {hasSearched && (
        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Aranıyor...</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
          ) : (
            <>
              <Text style={styles.resultsTitle}>
                {searchResults.length} sonuç bulundu
              </Text>
              <FlatList
                data={searchResults}
                renderItem={renderCafeItem}
                keyExtractor={(item, index) => `cafe-search-${index}`}
                scrollEnabled={false}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm + 4, // 12
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm + 4, // 12
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm + 4, // 12
    paddingVertical: spacing.sm + 2, // 10
    fontSize: typography.fontSize.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg - 4, // 20
    paddingVertical: spacing.sm + 2, // 10
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  resultsContainer: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg - 4, // 20
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg - 4, // 20
  },
  resultsTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 4, // 12
  },
  cafeItem: {
    padding: spacing.sm + 4, // 12
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
  },
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cafeAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cafeDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default CafeSearch;


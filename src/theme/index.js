/**
 * Tema Ana Export Dosyası
 * Tüm tema dosyalarını tek noktadan export eder
 * Kullanım: import { colors, spacing, typography, shadows } from '../theme';
 */

export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

// Tema objesi olarak da export edilebilir (opsiyonel)
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
  shadows: require('./shadows').shadows,
};


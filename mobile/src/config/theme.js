// Artydrop Design System - matching web aesthetic
// Fonts: Inter + Josefin Sans
// Palette: Warm beige/cream with black accents

export const colors = {
  // Core
  background: '#F5F0EA',
  backgroundLight: '#FDF9F3',
  backgroundCard: 'rgba(255,255,255,0.90)',
  backgroundCardSolid: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textPrimary: 'rgba(0,0,0,0.90)',
  textSecondary: 'rgba(0,0,0,0.60)',
  textTertiary: 'rgba(0,0,0,0.40)',
  textInverse: '#FFFFFF',

  // Brand
  black: '#000000',
  white: '#FFFFFF',
  purple: '#7C3AED',
  purpleLight: '#A78BFA',
  orange: '#F97316',
  amber: '#F59E0B',

  // Status
  success: '#059669',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // UI
  border: 'rgba(0,0,0,0.10)',
  borderLight: 'rgba(0,0,0,0.05)',
  borderDark: 'rgba(0,0,0,0.20)',
  overlay: 'rgba(0,0,0,0.50)',
  overlayLight: 'rgba(0,0,0,0.20)',

  // Gradients (as arrays for LinearGradient)
  gradientPurple: ['#7C3AED', '#6D28D9'],
  gradientBlack: ['#1A1A1A', '#000000'],
  gradientWarm: ['#F5F0EA', '#FDF9F3'],
  gradientCard: ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.60)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const fontFamily = {
  serif: 'JosefinSans_500Medium',
  serifBold: 'JosefinSans_600SemiBold',
  serifItalic: 'JosefinSans_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
};

const theme = { colors, spacing, borderRadius, fontSize, fontFamily, shadows };
export default theme;

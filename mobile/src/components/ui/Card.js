import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontFamily, spacing, shadows } from '../../config/theme';

export default function Card({ children, style, variant = 'default' }) {
  const variants = {
    default: {
      backgroundColor: colors.backgroundCard,
      borderColor: colors.border,
    },
    solid: {
      backgroundColor: colors.backgroundCardSolid,
      borderColor: colors.border,
    },
    dark: {
      backgroundColor: colors.black,
      borderColor: 'rgba(255,255,255,0.10)',
    },
  };

  const v = variants[variant];

  return (
    <View style={[
      styles.card,
      { backgroundColor: v.backgroundColor, borderColor: v.borderColor },
      shadows.md,
      style,
    ]}>
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing['2xl'],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.serifBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

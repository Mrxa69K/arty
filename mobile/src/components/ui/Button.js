import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontFamily, shadows } from '../../config/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) {
  const variants = {
    primary: {
      bg: colors.black,
      text: colors.white,
      border: 'transparent',
    },
    secondary: {
      bg: 'rgba(255,255,255,0.60)',
      text: colors.textPrimary,
      border: colors.border,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textSecondary,
      border: 'transparent',
    },
    danger: {
      bg: colors.error,
      text: colors.white,
      border: 'transparent',
    },
    purple: {
      bg: colors.purple,
      text: colors.white,
      border: 'transparent',
    },
  };

  const sizes = {
    sm: { h: 36, px: 16, fs: fontSize.sm },
    md: { h: 44, px: 20, fs: fontSize.base },
    lg: { h: 52, px: 24, fs: fontSize.md },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border !== 'transparent' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'primary' && shadows.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            { color: v.text, fontSize: s.fs },
            icon && { marginLeft: 8 },
            textStyle,
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  text: {
    fontFamily: fontFamily.sansSemiBold,
    letterSpacing: 0.2,
  },
});

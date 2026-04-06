import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontSize, fontFamily, spacing, borderRadius } from '../../config/theme';

export default function Badge({ label, color }) {
  return (
    <View style={[styles.badge, { backgroundColor: color?.bg || '#F3F4F6', borderColor: color?.border || '#D1D5DB' }]}>
      <Text style={[styles.text, { color: color?.text || '#374151' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sansMedium,
    textTransform: 'capitalize',
  },
});

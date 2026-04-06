import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, fontFamily, spacing, shadows } from '../config/theme';
import Badge from './ui/Badge';
import { getStatusColor, formatDate } from '../utils/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

export default function GalleryCard({ gallery, onPress, variant = 'grid' }) {
  const statusColor = getStatusColor(gallery.status);

  if (variant === 'list') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.listCard, shadows.sm]}
      >
        <View style={styles.listThumb}>
          {gallery.cover_image_url || gallery.thumbnail ? (
            <Image
              source={{ uri: gallery.cover_image_url || gallery.thumbnail }}
              style={styles.listImage}
            />
          ) : (
            <View style={styles.listPlaceholder}>
              <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
            </View>
          )}
        </View>
        <View style={styles.listInfo}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {gallery.title || 'Untitled Gallery'}
            </Text>
            <Badge label={gallery.status} color={statusColor} />
          </View>
          <View style={styles.listMeta}>
            {gallery.client_name && (
              <Text style={styles.listMetaText}>
                <Ionicons name="person-outline" size={10} color={colors.textTertiary} />{' '}
                {gallery.client_name}
              </Text>
            )}
            <Text style={styles.listMetaText}>
              {formatDate(gallery.created_at)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }

  // Grid variant
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.gridCard, shadows.md]}
    >
      {gallery.cover_image_url || gallery.thumbnail ? (
        <Image
          source={{ uri: gallery.cover_image_url || gallery.thumbnail }}
          style={styles.gridImage}
        />
      ) : (
        <View style={styles.gridPlaceholder}>
          <Ionicons name="camera-outline" size={32} color="rgba(0,0,0,0.15)" />
        </View>
      )}
      <View style={styles.gridOverlay} />
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {gallery.title || 'Untitled'}
        </Text>
        <View style={styles.gridMeta}>
          <Text style={styles.gridMetaText}>{gallery.status}</Text>
          {gallery.client_name && (
            <>
              <Text style={styles.gridDot}> . </Text>
              <Text style={styles.gridMetaText} numberOfLines={1}>{gallery.client_name}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gridContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  gridTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.serif,
    color: colors.white,
    marginBottom: 2,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridMetaText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    color: 'rgba(255,255,255,0.70)',
  },
  gridDot: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: fontSize.xs,
  },

  // List
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  listThumb: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  listInfo: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.sansSemiBold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listMetaText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    color: colors.textTertiary,
  },
});

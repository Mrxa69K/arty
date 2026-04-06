import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import GalleryCard from '../../components/GalleryCard';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';

export default function GalleriesScreen({ navigation }) {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchGalleries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*, photos:photos(count), gallery_links:gallery_links(count)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setGalleries(data || []);
    } catch (err) {
      console.error('Error loading galleries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  const onRefresh = () => { setRefreshing(true); fetchGalleries(); };

  const handleDelete = async (galleryId) => {
    try {
      await supabase.from('galleries').delete().eq('id', galleryId);
      setGalleries(galleries.filter(g => g.id !== galleryId));
    } catch (err) {
      console.error('Error deleting gallery:', err);
    }
  };

  const filtered = galleries.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (g.title || '').toLowerCase().includes(q) || (g.client_name || '').toLowerCase().includes(q);
  });

  const renderItem = ({ item }) => (
    <GalleryCard
      gallery={item}
      variant="list"
      onPress={() => navigation.navigate('GalleryDetail', { galleryId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage}
        blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <View style={styles.headerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>YOUR GALLERIES</Text>
            <Text style={styles.headerTitle}>All client deliveries</Text>
          </View>
          <Button
            title="New"
            icon={<Ionicons name="add" size={16} color={colors.white} />}
            onPress={() => navigation.navigate('NewGallery')}
            size="sm"
          />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title or client"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textTertiary} />
        </View>
      ) : galleries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No galleries yet</Text>
          <Text style={styles.emptyText}>
            Create your first gallery to start delivering photos.
          </Text>
          <Button
            title="Create Your First Gallery"
            icon={<Ionicons name="add" size={16} color={colors.white} />}
            onPress={() => navigation.navigate('NewGallery')}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />
          }
          ListEmptyComponent={
            <Text style={styles.noResults}>No galleries match "{search}"</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.88)' },
  headerContainer: { paddingTop: spacing['5xl'], paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, zIndex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.xl },
  headerLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.xs },
  headerTitle: { fontSize: fontSize['2xl'], fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textPrimary },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['5xl'] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['3xl'] },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center' },
  noResults: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textTertiary, textAlign: 'center', marginTop: spacing['3xl'] },
});

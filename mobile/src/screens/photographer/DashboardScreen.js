import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import GalleryCard from '../../components/GalleryCard';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';
import { GALLERY_LIMITS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [stats, setStats] = useState({ galleries: 0, photos: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch galleries with thumbnails
      const { data: galleriesData } = await supabase
        .from('galleries')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      const withThumbs = await Promise.all(
        (galleriesData || []).map(async (g) => {
          const { data: photos } = await supabase
            .from('photos')
            .select('image_url, video_url, media_type')
            .eq('gallery_id', g.id)
            .order('sort_order', { ascending: true })
            .limit(1);
          const thumb = photos?.[0];
          return { ...g, thumbnail: thumb?.image_url || thumb?.video_url || null };
        })
      );
      setGalleries(withThumbs);

      // Stats
      const { count: gCount } = await supabase
        .from('galleries')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      const { data: gIds } = await supabase
        .from('galleries')
        .select('id')
        .eq('owner_id', user.id);

      let pCount = 0;
      if (gIds?.length) {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('gallery_id', gIds.map(g => g.id));
        pCount = count || 0;
      }

      setStats({ galleries: gCount || 0, photos: pCount });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    fetchData();
  };

  const handleCreateGallery = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const plan = profile?.plan_type || 'none';
      const limit = GALLERY_LIMITS[plan] || 1;

      if (stats.galleries >= limit) {
        navigation.navigate('Plans');
        setCreating(false);
        return;
      }

      const { data, error } = await supabase
        .from('galleries')
        .insert({ owner_id: user.id, title: 'Untitled Gallery', status: 'draft' })
        .select()
        .single();

      if (error) throw error;
      navigation.navigate('GalleryDetail', { galleryId: data.id, isNew: true });
    } catch (err) {
      console.error('Create gallery error:', err);
    } finally {
      setCreating(false);
    }
  };

  const getPlanName = () => {
    const names = { test: 'Test', payg: 'Pay as you go', studio: 'Studio', none: 'Free' };
    return names[profile?.plan_type] || 'Free';
  };

  const planLimit = GALLERY_LIMITS[profile?.plan_type] || 1;
  const atLimit = stats.galleries >= planLimit && planLimit < 999999;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage}
        blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.brandName}>Artydrop</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.planBadge}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.planBadgeText}>{getPlanName()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.avatarBtn}>
              <Text style={styles.avatarText}>
                {user?.email?.substring(0, 2).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your galleries and share your work beautifully
          </Text>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, shadows.lg]}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Plan Limits</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Plans')}>
              <Text style={styles.upgradeLink}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Galleries</Text>
            <Text style={styles.statValue}>
              {stats.galleries} / {planLimit >= 999999 ? '\u221E' : planLimit}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              {
                width: `${Math.min((stats.galleries / (planLimit >= 999999 ? 1 : planLimit)) * 100, 100)}%`,
                backgroundColor: atLimit ? colors.error : colors.black,
              },
            ]} />
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Photos</Text>
            <Text style={styles.statValue}>{stats.photos}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {atLimit ? (
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardDanger, shadows.lg]}
              onPress={() => navigation.navigate('Plans')}
            >
              <Text style={styles.actionLabel}>LIMIT REACHED</Text>
              <Text style={styles.actionTitle}>Upgrade to create more</Text>
              <View style={styles.actionMeta}>
                <Text style={styles.actionMetaText}>View plans</Text>
                <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.80)" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardDark, shadows.lg]}
              onPress={handleCreateGallery}
              disabled={creating}
            >
              <Text style={styles.actionLabel}>ACTION</Text>
              <Text style={styles.actionTitle}>
                {creating ? 'Creating...' : 'Create gallery'}
              </Text>
              <View style={styles.actionMeta}>
                {creating ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.60)" />
                ) : (
                  <>
                    <Text style={styles.actionMetaText}>Start now</Text>
                    <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.60)" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardLight, shadows.md]}
            onPress={() => navigation.navigate('Plans')}
          >
            <Text style={[styles.actionLabel, { color: colors.textTertiary }]}>UPGRADE</Text>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>View plans</Text>
            <View style={styles.actionMeta}>
              <Text style={[styles.actionMetaText, { color: colors.textSecondary }]}>See options</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Galleries */}
        {galleries.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent galleries</Text>
              <TouchableOpacity onPress={() => navigation.navigate('GalleriesTab')}>
                <Text style={styles.viewAllLink}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.galleriesGrid}>
              {galleries.map((g) => (
                <GalleryCard
                  key={g.id}
                  gallery={g}
                  onPress={() => navigation.navigate('GalleryDetail', { galleryId: g.id })}
                />
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {galleries.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Start creating</Text>
            <Text style={styles.emptyText}>
              You haven't created any galleries yet.
            </Text>
            <Button
              title="Create your first gallery"
              onPress={handleCreateGallery}
              loading={creating}
              size="lg"
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        <View style={{ height: spacing['5xl'] }} />
      </ScrollView>
    </View>
  );
}

// Import at top level was missing for Button
import Button from '../../components/ui/Button';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.85)' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing['5xl'], marginBottom: spacing['2xl'] },
  brandName: { fontSize: fontSize['2xl'], fontFamily: fontFamily.serif, color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: colors.border },
  planBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.textSecondary },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.xs, fontFamily: fontFamily.sansSemiBold, color: colors.white },

  welcomeSection: { marginBottom: spacing['2xl'] },
  welcomeTitle: { fontSize: fontSize['3xl'], fontFamily: fontFamily.serif, color: colors.textPrimary, marginBottom: spacing.xs },
  welcomeSubtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary },

  statsCard: { backgroundColor: 'rgba(255,255,255,0.60)', borderRadius: borderRadius['2xl'], borderWidth: 1, borderColor: colors.border, padding: spacing['2xl'], marginBottom: spacing['2xl'] },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  statsTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.serif, color: colors.textPrimary },
  upgradeLink: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textDecorationLine: 'underline' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  statLabel: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary },
  statValue: { fontSize: fontSize.sm, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary },
  progressBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, marginBottom: spacing.lg, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['3xl'] },
  actionCard: { flex: 1, borderRadius: borderRadius['2xl'], padding: spacing.xl },
  actionCardDark: { backgroundColor: colors.black },
  actionCardDanger: { backgroundColor: colors.error },
  actionCardLight: { backgroundColor: 'rgba(255,255,255,0.50)', borderWidth: 1, borderColor: colors.border },
  actionLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: 'rgba(255,255,255,0.50)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm },
  actionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.serif, color: colors.white, marginBottom: spacing.md },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionMetaText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: 'rgba(255,255,255,0.60)' },

  recentSection: { marginBottom: spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize['2xl'], fontFamily: fontFamily.serif, color: colors.textPrimary },
  viewAllLink: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary },
  galleriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },

  emptyState: { alignItems: 'center', paddingVertical: spacing['5xl'] },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: fontSize['2xl'], fontFamily: fontFamily.serif, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center' },
});

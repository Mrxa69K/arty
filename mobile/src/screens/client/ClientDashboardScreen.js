import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Card from '../../components/ui/Card';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';
import { formatDate } from '../../utils/constants';

export default function ClientDashboardScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClientGalleries = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch galleries where user's email matches client_email
      const { data, error } = await supabase
        .from('galleries')
        .select('*, photos:photos(count)')
        .eq('client_email', user.email)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error) setGalleries(data || []);
    } catch (err) {
      console.error('Error fetching client galleries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchClientGalleries(); }, [fetchClientGalleries]);

  const onRefresh = () => { setRefreshing(true); fetchClientGalleries(); };

  const renderGallery = ({ item }) => (
    <TouchableOpacity
      style={[styles.galleryCard, shadows.md]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ClientGallery', { galleryId: item.id })}
    >
      <View style={styles.galleryIcon}>
        <Ionicons name="images-outline" size={24} color={colors.purple} />
      </View>
      <View style={styles.galleryInfo}>
        <Text style={styles.galleryTitle} numberOfLines={1}>{item.title || 'Gallery'}</Text>
        <Text style={styles.galleryMeta}>
          {item.photos?.[0]?.count || 0} photos  \u00B7  {formatDate(item.created_at)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage} blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>Artydrop</Text>
          <Text style={styles.welcomeText}>
            Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.avatarBtn}>
          <Text style={styles.avatarText}>
            {user?.email?.substring(0, 2).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Galleries</Text>

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
            When a photographer shares a gallery with you, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={galleries}
          renderItem={renderGallery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.88)' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing['5xl'], paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  brandName: { fontSize: fontSize['2xl'], fontFamily: fontFamily.serif, color: colors.textPrimary },
  welcomeText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, marginTop: spacing.xs },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.sm, fontFamily: fontFamily.sansSemiBold, color: colors.white },

  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, paddingHorizontal: spacing.xl, marginBottom: spacing.lg },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['5xl'] },

  galleryCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: '#FDF9F3', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  galleryIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: 'rgba(124,58,237,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg },
  galleryInfo: { flex: 1 },
  galleryTitle: { fontSize: fontSize.base, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary },
  galleryMeta: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary, marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['3xl'] },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

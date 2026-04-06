import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Modal, Alert,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../config/supabase';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';
import { formatDate } from '../../utils/constants';

const { width, height } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.xl * 2 - spacing.sm * 2) / 3;

export default function ClientGalleryScreen({ route, navigation }) {
  const { galleryId } = route.params;
  const [gallery, setGallery] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);

  useEffect(() => { fetchGallery(); }, [galleryId]);

  const fetchGallery = async () => {
    try {
      const { data: g } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single();
      setGallery(g);

      const { data: p } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('sort_order', { ascending: true });
      setPhotos(p || []);

      const { data: link } = await supabase
        .from('gallery_links')
        .select('allow_download')
        .eq('gallery_id', galleryId)
        .single();
      if (link) setAllowDownload(link.allow_download !== false);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photo) => {
    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        return;
      }

      const url = photo.media_type === 'video' ? photo.video_url : photo.image_url;
      const ext = photo.media_type === 'video' ? 'mp4' : 'jpg';
      const fileUri = FileSystem.documentDirectory + `${photo.file_name || `photo_${photo.id}`}.${ext}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);

      Alert.alert('Saved', 'Photo saved to your library');
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download photo');
    } finally {
      setDownloading(false);
    }
  };

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const renderPhoto = ({ item, index }) => (
    <TouchableOpacity
      style={styles.photoItem}
      activeOpacity={0.85}
      onPress={() => openLightbox(index)}
    >
      <Image
        source={{ uri: item.image_url || item.video_url }}
        style={styles.photoImage}
      />
      {item.media_type === 'video' && (
        <View style={styles.playBtn}>
          <Ionicons name="play" size={20} color={colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textTertiary} />
      </View>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage} blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>ARTYDROP</Text>
        </View>
      </View>

      {/* Gallery Info */}
      <View style={[styles.infoCard, shadows.md]}>
        <Text style={styles.galleryTitle}>{gallery?.title || 'Gallery'}</Text>
        <View style={styles.metaRow}>
          {gallery?.client_name && (
            <View style={styles.metaItem}>
              <Ionicons name="camera-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{gallery.client_name}</Text>
            </View>
          )}
          {gallery?.event_date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{formatDate(gallery.event_date)}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="images-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.metaText}>{photos.length} photos</Text>
          </View>
        </View>
        {!allowDownload && (
          <View style={styles.viewOnlyBanner}>
            <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.viewOnlyText}>View-only gallery. Downloads are not available.</Text>
          </View>
        )}
      </View>

      {/* Photo Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />

      {/* Lightbox Modal */}
      <Modal visible={lightboxOpen} animationType="fade" statusBarTranslucent>
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.closeLightbox} onPress={() => setLightboxOpen(false)}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>

          {currentPhoto && (
            <Image
              source={{ uri: currentPhoto.image_url || currentPhoto.video_url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}

          {/* Navigation */}
          <View style={styles.lightboxNav}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setCurrentIndex((currentIndex - 1 + photos.length) % photos.length)}
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.photoCounter}>
              {currentIndex + 1} of {photos.length}
            </Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setCurrentIndex((currentIndex + 1) % photos.length)}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Download in lightbox */}
          {allowDownload && currentPhoto && (
            <Button
              title={downloading ? 'Saving...' : 'Save to Library'}
              icon={<Ionicons name="download-outline" size={16} color={colors.black} />}
              variant="secondary"
              loading={downloading}
              onPress={() => handleDownload(currentPhoto)}
              style={styles.lightboxDownload}
              textStyle={{ color: colors.black }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.88)' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing['5xl'], paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.70)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  logoPill: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(0,0,0,0.30)', backgroundColor: 'rgba(255,255,255,0.50)' },
  logoText: { fontSize: fontSize.xs, fontFamily: fontFamily.serifBold, letterSpacing: 2, color: colors.textPrimary },

  infoCard: { marginHorizontal: spacing.xl, padding: spacing.xl, borderRadius: borderRadius['2xl'], backgroundColor: 'rgba(255,255,255,0.80)', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  galleryTitle: { fontSize: fontSize['2xl'], fontFamily: fontFamily.serif, color: colors.textPrimary, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary },
  viewOnlyBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: colors.borderLight },
  viewOnlyText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, flex: 1 },

  gridContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['5xl'] },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
  photoItem: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.03)' },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  playBtn: { position: 'absolute', top: '50%', left: '50%', marginTop: -20, marginLeft: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.60)', alignItems: 'center', justifyContent: 'center' },

  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  closeLightbox: { position: 'absolute', top: spacing['5xl'], right: spacing.xl, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: width - spacing.xl * 2, height: height * 0.6 },
  lightboxNav: { flexDirection: 'row', alignItems: 'center', gap: spacing['3xl'], marginTop: spacing.xl },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  photoCounter: { fontSize: fontSize.sm, fontFamily: fontFamily.serif, color: 'rgba(255,255,255,0.80)' },
  lightboxDownload: { position: 'absolute', bottom: spacing['5xl'], backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'transparent' },
});

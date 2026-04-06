import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, Dimensions, FlatList,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';
import { getStatusColor, formatDate } from '../../utils/constants';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - spacing.xl * 2 - spacing.sm * 2) / 3;

export default function GalleryDetailScreen({ route, navigation }) {
  const { galleryId, isNew } = route.params;
  const { user } = useAuth();

  const [gallery, setGallery] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [galleryLink, setGalleryLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [copied, setCopied] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    client_email: '',
    event_date: '',
    notes: '',
    status: 'draft',
  });

  const [linkSettings, setLinkSettings] = useState({
    hasPassword: false,
    password: '',
    allow_download: true,
    expires_at: '',
  });

  useEffect(() => { fetchGallery(); }, [galleryId]);

  const fetchGallery = async () => {
    try {
      const { data: g, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single();
      if (error) throw error;

      setGallery(g);
      setFormData({
        title: g.title || '',
        client_name: g.client_name || '',
        client_email: g.client_email || '',
        event_date: g.event_date || '',
        notes: g.notes || '',
        status: g.status || 'draft',
      });

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('sort_order', { ascending: true });
      setPhotos(photosData || []);

      const { data: foldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('sort_order', { ascending: true });
      setFolders(foldersData || []);

      const { data: links } = await supabase
        .from('gallery_links')
        .select('*')
        .eq('gallery_id', galleryId)
        .limit(1);
      if (links?.length) {
        setGalleryLink(links[0]);
        setLinkSettings({
          hasPassword: !!links[0].password_hash,
          password: '',
          allow_download: links[0].allow_download !== false,
          expires_at: links[0].expires_at || '',
        });
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      Alert.alert('Error', 'Gallery not found');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploading(true);
    setUploadProgress(0);
    const uploaded = [];

    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      try {
        const ext = asset.uri.split('.').pop();
        const fileName = `${user.id}/${galleryId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const isVideo = asset.type === 'video';

        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, blob, { contentType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg') });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        const { data: photoData, error: dbError } = await supabase
          .from('photos')
          .insert({
            gallery_id: galleryId,
            storage_path: fileName,
            image_url: isVideo ? null : publicUrl,
            video_url: isVideo ? publicUrl : null,
            media_type: isVideo ? 'video' : 'image',
            file_name: asset.fileName || `file_${i}`,
            file_size: asset.fileSize || 0,
            sort_order: photos.length + i,
          })
          .select()
          .single();

        if (!dbError) uploaded.push(photoData);
      } catch (err) {
        console.error('Upload error:', err);
      }
      setUploadProgress(Math.round(((i + 1) / result.assets.length) * 100));
    }

    if (uploaded.length) {
      setPhotos(prev => [...prev, ...uploaded]);
      Alert.alert('Success', `${uploaded.length} file(s) uploaded`);
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('galleries')
        .update({
          title: formData.title,
          client_name: formData.client_name || null,
          client_email: formData.client_email || null,
          event_date: formData.event_date || null,
          notes: formData.notes || null,
          status: formData.status,
        })
        .eq('id', galleryId);
      if (error) throw error;
      Alert.alert('Saved', 'Gallery saved successfully');
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save gallery');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const { data: existing } = await supabase
        .from('gallery_links')
        .select('*')
        .eq('gallery_id', galleryId)
        .single();

      if (existing) {
        await supabase.from('gallery_links').update({
          allow_download: linkSettings.allow_download,
          expires_at: linkSettings.expires_at || null,
        }).eq('gallery_id', galleryId);
        setGalleryLink(existing);
        Alert.alert('Updated', 'Share settings updated');
      } else {
        const newToken = galleryId;
        const { data, error } = await supabase
          .from('gallery_links')
          .insert({
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            gallery_id: galleryId,
            token: newToken,
            allow_download: linkSettings.allow_download,
            expires_at: linkSettings.expires_at || null,
          })
          .select()
          .single();
        if (error) throw error;
        setGalleryLink(data);
        Alert.alert('Success', 'Share link generated!');
      }
    } catch (err) {
      console.error('Link error:', err);
      Alert.alert('Error', 'Failed to generate link');
    }
  };

  const copyShareLink = async () => {
    if (galleryLink) {
      const url = `${process.env.EXPO_PUBLIC_APP_URL || 'https://artydrop.com'}/g/${galleryLink.token}`;
      await Clipboard.setStringAsync(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeletePhoto = async (photoId, storagePath) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (storagePath) await supabase.storage.from('photos').remove([storagePath]);
          await supabase.from('photos').delete().eq('id', photoId);
          setPhotos(photos.filter(p => p.id !== photoId));
        }
      },
    ]);
  };

  const statusColor = getStatusColor(formData.status);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textTertiary} />
      </View>
    );
  }

  const tabs = [
    { id: 'photos', label: 'Photos', icon: 'camera-outline' },
    { id: 'details', label: 'Details', icon: 'document-text-outline' },
    { id: 'sharing', label: 'Sharing', icon: 'share-outline' },
  ];

  const shareUrl = galleryLink
    ? `${process.env.EXPO_PUBLIC_APP_URL || 'https://artydrop.com'}/g/${galleryLink.token}`
    : null;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage}
        blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} loading={saving} size="sm" />
        </View>

        {/* Title Card */}
        <Card style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.galleryTitle} numberOfLines={2}>
              {formData.title || 'Untitled Gallery'}
            </Text>
            <Badge label={formData.status} color={statusColor} />
          </View>
          <View style={styles.metaRow}>
            {formData.client_name ? (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
                <Text style={styles.metaText}>{formData.client_name}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="images-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.metaText}>{photos.length} photos</Text>
            </View>
          </View>
          {shareUrl && (
            <TouchableOpacity style={styles.copyLinkBtn} onPress={copyShareLink}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={colors.textPrimary} />
              <Text style={styles.copyLinkText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={activeTab === tab.id ? colors.white : colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <Card style={styles.contentCard}>
          {activeTab === 'photos' && (
            <View>
              <View style={styles.photosHeader}>
                <Text style={styles.sectionTitle}>Photos & Videos</Text>
                <Button
                  title={uploading ? `${uploadProgress}%` : 'Upload'}
                  icon={<Ionicons name={uploading ? 'hourglass-outline' : 'cloud-upload-outline'} size={14} color={colors.white} />}
                  onPress={handlePickImages}
                  disabled={uploading}
                  size="sm"
                />
              </View>

              {/* Upload zone */}
              <TouchableOpacity style={styles.uploadZone} onPress={handlePickImages} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="large" color={colors.textTertiary} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={40} color={colors.textTertiary} />
                )}
                <Text style={styles.uploadText}>
                  {uploading ? 'Uploading...' : 'Tap to select photos & videos'}
                </Text>
                <Text style={styles.uploadHint}>JPEG, PNG, WebP, MP4, MOV</Text>
              </TouchableOpacity>

              {/* Photo grid */}
              {photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {photos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.photoItem}
                      onLongPress={() => handleDeletePhoto(photo.id, photo.storage_path)}
                    >
                      <Image
                        source={{ uri: photo.image_url || photo.video_url }}
                        style={styles.photoImage}
                      />
                      {photo.media_type === 'video' && (
                        <View style={styles.videoBadge}>
                          <Ionicons name="videocam" size={10} color={colors.white} />
                          <Text style={styles.videoBadgeText}>VIDEO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {photos.length === 0 && !uploading && (
                <View style={styles.emptyPhotos}>
                  <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                  <Text style={styles.emptyPhotosText}>No photos yet</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'details' && (
            <View>
              <Text style={styles.sectionTitle}>Gallery Details</Text>
              <Text style={styles.sectionSubtitle}>Basic information about this delivery</Text>

              <Input label="Gallery Title" value={formData.title} onChangeText={(v) => setFormData({ ...formData, title: v })} placeholder="e.g., Sarah's Wedding" />
              <Input label="Client Name" value={formData.client_name} onChangeText={(v) => setFormData({ ...formData, client_name: v })} placeholder="e.g., Sarah Johnson" autoCapitalize="words" />
              <Input label="Client Email" value={formData.client_email} onChangeText={(v) => setFormData({ ...formData, client_email: v })} placeholder="client@example.com" keyboardType="email-address" />
              <Input label="Event Date" value={formData.event_date} onChangeText={(v) => setFormData({ ...formData, event_date: v })} placeholder="YYYY-MM-DD" />
              <Input label="Internal Notes" value={formData.notes} onChangeText={(v) => setFormData({ ...formData, notes: v })} placeholder="Private notes (only visible to you)" multiline numberOfLines={4} />

              <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
            </View>
          )}

          {activeTab === 'sharing' && (
            <View>
              <Text style={styles.sectionTitle}>Share Gallery</Text>
              <Text style={styles.sectionSubtitle}>Generate a link to share with your client</Text>

              {shareUrl ? (
                <View>
                  <View style={styles.shareLinkBox}>
                    <Text style={styles.shareLinkLabel}>SHARE LINK</Text>
                    <Text style={styles.shareLinkUrl} numberOfLines={1}>{shareUrl}</Text>
                    <Button
                      title={copied ? 'Copied!' : 'Copy'}
                      icon={<Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={colors.white} />}
                      onPress={copyShareLink}
                      size="sm"
                      style={{ marginTop: spacing.md }}
                    />
                  </View>

                  {/* Settings */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
                      <View>
                        <Text style={styles.settingTitle}>Allow Downloads</Text>
                        <Text style={styles.settingDesc}>Let clients download photos</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.toggle, linkSettings.allow_download && styles.toggleActive]}
                      onPress={() => setLinkSettings({ ...linkSettings, allow_download: !linkSettings.allow_download })}
                    >
                      <View style={[styles.toggleThumb, linkSettings.allow_download && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                  </View>

                  <Button title="Update Settings" onPress={handleGenerateLink} style={{ marginTop: spacing.xl }} />
                </View>
              ) : (
                <View style={styles.noLinkState}>
                  <View style={styles.noLinkIcon}>
                    <Ionicons name="share-outline" size={32} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.noLinkTitle}>No share link yet</Text>
                  <Text style={styles.noLinkText}>
                    Generate a secure link to share this gallery.
                  </Text>
                  <Button
                    title="Generate Share Link"
                    icon={<Ionicons name="link-outline" size={16} color={colors.white} />}
                    onPress={handleGenerateLink}
                    style={{ marginTop: spacing.xl }}
                  />
                </View>
              )}
            </View>
          )}
        </Card>

        <View style={{ height: spacing['5xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.88)' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['5xl'] },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.70)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },

  titleCard: { marginBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  galleryTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary },
  copyLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.60)', borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  copyLinkText: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.textPrimary },

  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.80)', borderRadius: borderRadius.full, padding: 4, marginBottom: spacing.xl, ...shadows.sm },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  tabActive: { backgroundColor: colors.black, ...shadows.md },
  tabText: { fontSize: fontSize.sm, fontFamily: fontFamily.sansMedium, color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  contentCard: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionSubtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, marginBottom: spacing.xl },

  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  uploadZone: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderDark, borderRadius: borderRadius.xl, padding: spacing['3xl'], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  uploadText: { fontSize: fontSize.base, fontFamily: fontFamily.sansMedium, color: colors.textPrimary, marginTop: spacing.md },
  uploadHint: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary, marginTop: spacing.xs },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoItem: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.03)' },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoBadge: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.70)' },
  videoBadgeText: { fontSize: 8, fontFamily: fontFamily.sansSemiBold, color: colors.white },

  emptyPhotos: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyPhotosText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textTertiary, marginTop: spacing.md },

  shareLinkBox: { backgroundColor: 'rgba(255,255,255,0.60)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl },
  shareLinkLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.textTertiary, letterSpacing: 1.5, marginBottom: spacing.xs },
  shareLinkUrl: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textPrimary },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  settingTitle: { fontSize: fontSize.sm, fontFamily: fontFamily.sansMedium, color: colors.textPrimary },
  settingDesc: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.10)', padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: colors.black },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, ...shadows.sm },
  toggleThumbActive: { alignSelf: 'flex-end' },

  noLinkState: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  noLinkIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  noLinkTitle: { fontSize: fontSize.base, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  noLinkText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
});

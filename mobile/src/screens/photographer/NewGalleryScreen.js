import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';
import { TouchableOpacity } from 'react-native';

export default function NewGalleryScreen({ navigation }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a gallery title');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('galleries')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          client_name: clientName.trim() || null,
          client_email: clientEmail.trim() || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      navigation.replace('GalleryDetail', { galleryId: data.id, isNew: true });
    } catch (err) {
      console.error('Create error:', err);
      Alert.alert('Error', 'Failed to create gallery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage} blurRadius={1}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Gallery</Text>
          <View style={{ width: 40 }} />
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Create Gallery</Text>
          <Text style={styles.sectionSubtitle}>Set up your new client delivery</Text>

          <Input
            label="Gallery Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Sarah & Mike's Wedding"
            autoCapitalize="words"
          />
          <Input
            label="Client Name (optional)"
            value={clientName}
            onChangeText={setClientName}
            placeholder="e.g., Sarah Johnson"
            autoCapitalize="words"
          />
          <Input
            label="Client Email (optional)"
            value={clientEmail}
            onChangeText={setClientEmail}
            placeholder="client@example.com"
            keyboardType="email-address"
          />

          <Button
            title={loading ? 'Creating...' : 'Create Gallery'}
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.90)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['5xl'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['2xl'] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.70)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary },
  formCard: { ...shadows.lg },
  sectionTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionSubtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, marginBottom: spacing['2xl'] },
});

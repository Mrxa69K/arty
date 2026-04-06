import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';

export default function SettingsScreen({ navigation }) {
  const { user, profile, signOut, refreshProfile } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.full_name || 'Photographer'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileType}>
                {profile?.user_type === 'photographer' ? 'Photographer' : 'Client'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Plan Card */}
        <Card style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Current Plan</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {profile?.plan_type === 'payg' ? 'Pay as you go' :
                 profile?.plan_type === 'studio' ? 'Studio' :
                 profile?.plan_type === 'test' ? 'Test' : 'Free'}
              </Text>
            </View>
          </View>
          <Button
            title="View Plans"
            variant="secondary"
            onPress={() => navigation.navigate('Plans')}
            style={{ marginTop: spacing.lg }}
          />
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          {[
            { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
            { icon: 'shield-outline', label: 'Privacy & Security', onPress: () => {} },
            { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
            { icon: 'information-circle-outline', label: 'About Artydrop', onPress: () => {} },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={16} color={colors.white} />}
          onPress={handleSignOut}
          style={{ marginTop: spacing.xl }}
        />

        <Text style={styles.version}>Artydrop v1.0.0</Text>
        <View style={{ height: spacing['5xl'] }} />
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

  profileCard: { marginBottom: spacing.lg },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.lg, fontFamily: fontFamily.sansBold, color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.md, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary },
  profileEmail: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, marginTop: 2 },
  profileType: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.textTertiary, marginTop: 4, textTransform: 'capitalize' },

  planCard: { marginBottom: spacing.lg },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitle: { fontSize: fontSize.base, fontFamily: fontFamily.sansMedium, color: colors.textPrimary },
  planBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.20)' },
  planBadgeText: { fontSize: fontSize.xs, fontFamily: fontFamily.sansMedium, color: colors.purple },

  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'], borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  menuItemText: { flex: 1, fontSize: fontSize.base, fontFamily: fontFamily.sans, color: colors.textPrimary },

  version: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary, textAlign: 'center', marginTop: spacing['3xl'] },
});

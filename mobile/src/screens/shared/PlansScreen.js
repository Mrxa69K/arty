import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, ImageBackground, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';

const WORDS = ['clients', 'galleries', 'moments', 'stories', 'memories', 'art'];

export default function PlansScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlan = async (planType) => {
    setLoading(true);
    setSelectedPlan(planType);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // In a real app, this would open Stripe's payment sheet
      // For now, we call the checkout API and get the URL
      const res = await fetch(`${process.env.EXPO_PUBLIC_APP_URL || 'https://artydrop.com'}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planType }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const data = await res.json();

      // In production, use Stripe React Native SDK to handle payment
      // For now, we'd open the Stripe checkout URL in a WebView
      if (data.url) {
        // Navigate to a WebView with Stripe checkout
        navigation.navigate('StripeCheckout', { url: data.url });
      }
    } catch (err) {
      console.error('Plan selection error:', err);
      Alert.alert('Error', err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const plans = [
    {
      id: 'test',
      label: 'CURIOUS',
      icon: 'sparkles-outline',
      price: '1',
      unit: 'once',
      features: ['1 gallery', '10 photos', '3 days'],
      cta: 'Try it out',
      note: 'First time only',
      variant: 'light',
    },
    {
      id: 'payg',
      label: 'FLEXIBLE',
      price: '4.90',
      unit: 'each',
      features: ['Unlimited galleries', 'Unlimited photos', 'No expiration'],
      cta: 'Get Started',
      variant: 'dark',
      featured: true,
    },
    {
      id: 'studio',
      label: 'PRO',
      icon: 'diamond-outline',
      price: '19',
      unit: '/mo',
      features: ['Unlimited galleries', 'Unlimited photos', 'Priority support'],
      cta: 'Go Premium',
      variant: 'purple',
    },
  ];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.bgImage}
        blurRadius={3}
      >
        <View style={styles.bgOverlay} />
      </ImageBackground>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles-outline" size={10} color={colors.textTertiary} />
            <Text style={styles.headerBadgeText}>CHOOSE YOUR PLAN</Text>
          </View>
          <Text style={styles.heroTitle}>Deliver beautiful</Text>
          <Text style={styles.heroWord}>{WORDS[currentWord]}</Text>
        </View>

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isDark = plan.variant === 'dark';
          const isPurple = plan.variant === 'purple';

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isDark && styles.planCardDark,
                isPurple && styles.planCardLight,
                !isDark && !isPurple && styles.planCardLight,
                plan.featured && styles.planCardFeatured,
                shadows.lg,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={[styles.planLabel, isDark && { color: 'rgba(255,255,255,0.50)' }]}>
                {plan.icon && <Ionicons name={plan.icon} size={10} color={isDark ? 'rgba(255,255,255,0.50)' : colors.textTertiary} />}
                {'  '}{plan.label}
              </Text>

              <View style={styles.priceRow}>
                <Text style={[styles.price, isDark && { color: colors.white }]}>{plan.price}</Text>
                <Text style={[styles.priceUnit, isDark && { color: 'rgba(255,255,255,0.60)' }]}>{plan.unit}</Text>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={[styles.featureDot, isDark && { backgroundColor: 'rgba(255,255,255,0.50)' }]} />
                    <Text style={[styles.featureText, isDark && { color: 'rgba(255,255,255,0.80)' }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={[
                styles.ctaBtn,
                isDark && styles.ctaBtnDark,
                isPurple && styles.ctaBtnPurple,
              ]}>
                {loading && selectedPlan === plan.id ? (
                  <ActivityIndicator size="small" color={isDark ? colors.black : colors.white} />
                ) : (
                  <Text style={[styles.ctaText, isDark && { color: colors.black }]}>{plan.cta}</Text>
                )}
              </View>

              {plan.note && (
                <Text style={styles.planNote}>{plan.note}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.footer}>Fair pricing  \u00B7  Cancel anytime  \u00B7  No hidden fees</Text>
        <View style={{ height: spacing['5xl'] }} />
      </ScrollView>
    </View>
  );
}

import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,240,234,0.80)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['5xl'] },

  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.70)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },

  header: { alignItems: 'center', marginBottom: spacing['3xl'] },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  headerBadgeText: { fontSize: 8, fontFamily: fontFamily.sansMedium, color: colors.textTertiary, letterSpacing: 2.5 },
  heroTitle: { fontSize: fontSize['3xl'], fontFamily: fontFamily.serif, color: colors.textPrimary, marginBottom: spacing.sm },
  heroWord: { fontSize: fontSize['4xl'], fontFamily: fontFamily.serif, color: 'rgba(0,0,0,0.25)' },

  planCard: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  planCardDark: { backgroundColor: colors.black },
  planCardLight: { backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: colors.border },
  planCardFeatured: { transform: [{ scale: 1.02 }] },

  planLabel: { fontSize: 8, fontFamily: fontFamily.sansMedium, color: colors.textTertiary, letterSpacing: 2, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginBottom: spacing.lg },
  price: { fontSize: fontSize['4xl'], fontFamily: fontFamily.serif, color: colors.textPrimary },
  priceUnit: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textTertiary },

  featuresList: { marginBottom: spacing.xl, gap: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.25)' },
  featureText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary },

  ctaBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  ctaBtnDark: { backgroundColor: colors.white },
  ctaBtnPurple: { backgroundColor: colors.purple },
  ctaText: { fontSize: fontSize.sm, fontFamily: fontFamily.sansMedium, color: colors.textSecondary },

  planNote: { fontSize: 8, fontFamily: fontFamily.sans, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },

  footer: { fontSize: fontSize.xs, fontFamily: fontFamily.sans, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});

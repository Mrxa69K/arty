import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    const { error: resetError } = await resetPassword(email.trim());
    if (resetError) { setError(resetError.message); }
    else { setSent(true); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=60' }}
        style={styles.background}
        blurRadius={2}
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPill}>
            <Text style={styles.logoText}>ARTYDROP</Text>
          </View>
        </View>

        <Card style={styles.card}>
          {sent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="mail-outline" size={32} color={colors.success} />
              </View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.successText}>
                We've sent a password reset link to {email}
              </Text>
              <Button
                title="Back to login"
                onPress={() => navigation.navigate('Login')}
                size="lg"
                style={{ marginTop: spacing.xl }}
              />
            </View>
          ) : (
            <>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={loading}
              />

              <Button
                title="Send reset link"
                onPress={handleReset}
                loading={loading}
                size="lg"
              />

              <Button
                title="Back to login"
                onPress={() => navigation.navigate('Login')}
                variant="ghost"
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245, 240, 234, 0.75)' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing['2xl'] },
  logoContainer: { alignItems: 'center', marginBottom: spacing['4xl'] },
  logoPill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.80)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logoText: { fontSize: fontSize.sm, fontFamily: fontFamily.serifBold, letterSpacing: 3, color: colors.textPrimary },
  card: { backgroundColor: 'rgba(248, 243, 235, 0.95)', padding: spacing['3xl'], ...shadows.xl },
  title: { fontSize: fontSize.xl, fontFamily: fontFamily.sansSemiBold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['2xl'] },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  errorText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.error, flex: 1 },
  successContainer: { alignItems: 'center' },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  successText: { fontSize: fontSize.base, fontFamily: fontFamily.sans, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

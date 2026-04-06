import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { colors, spacing, fontSize, fontFamily, borderRadius, shadows } from '../../config/theme';

export default function SignupScreen({ navigation }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('photographer');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await signUp(email, password, fullName, userType);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoPill}>
              <Text style={styles.logoText}>ARTYDROP</Text>
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              or{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                log in
              </Text>
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* User Type */}
            <Text style={styles.sectionLabel}>I want to</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, userType === 'photographer' && styles.typeBtnActive]}
                onPress={() => setUserType('photographer')}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={userType === 'photographer' ? colors.white : colors.textTertiary}
                />
                <Text style={[
                  styles.typeBtnText,
                  userType === 'photographer' && styles.typeBtnTextActive,
                ]}>
                  Create galleries
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, userType === 'client' && styles.typeBtnActive]}
                onPress={() => setUserType('client')}
              >
                <Ionicons
                  name="images-outline"
                  size={16}
                  color={userType === 'client' ? colors.white : colors.textTertiary}
                />
                <Text style={[
                  styles.typeBtnText,
                  userType === 'client' && styles.typeBtnTextActive,
                ]}>
                  View galleries
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.typeHint}>
              {userType === 'photographer'
                ? 'Upload and deliver photos to clients'
                : 'Access photos shared with you'}
            </Text>

            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
              disabled={loading}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              disabled={loading}
            />

            {/* Terms */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              <Text style={styles.checkText}>
                I agree to the{' '}
                <Text style={styles.link}>Terms and Conditions</Text>
                {' '}and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <Button
              title="Create account"
              onPress={handleSignup}
              loading={loading}
              disabled={loading || !acceptTerms}
              size="lg"
              style={{ marginTop: spacing.xl }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  background: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245, 240, 234, 0.75)' },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  logoContainer: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoPill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.80)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  logoText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.serifBold,
    letterSpacing: 3,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: 'rgba(248, 243, 235, 0.95)',
    padding: spacing['2xl'],
    ...shadows.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.sansSemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  link: { textDecorationLine: 'underline', color: colors.textPrimary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: { fontSize: fontSize.sm, fontFamily: fontFamily.sans, color: colors.error, flex: 1 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sansMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
    ...shadows.md,
  },
  typeBtnText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sansMedium,
    color: colors.textSecondary,
  },
  typeBtnTextActive: { color: colors.white },
  typeHint: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  checkText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

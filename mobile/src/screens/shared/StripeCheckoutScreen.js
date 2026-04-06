import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '../../config/theme';
import { TouchableOpacity } from 'react-native';

export default function StripeCheckoutScreen({ route, navigation }) {
  const { url } = route.params;

  const handleNavigationChange = (navState) => {
    // Check for success or cancel redirects
    if (navState.url.includes('/success') || navState.url.includes('/dashboard')) {
      navigation.goBack();
    }
    if (navState.url.includes('/cancel')) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.secureTag}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.success} />
          <Text style={styles.secureText}>Secure Checkout</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.textTertiary} />
            <Text style={styles.loadingText}>Loading payment...</Text>
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secureText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sansMedium,
    color: colors.success,
  },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});

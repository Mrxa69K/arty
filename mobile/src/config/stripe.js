// Stripe configuration for mobile payments
// Uses @stripe/stripe-react-native for Apple Pay & Google Pay support

import { StripeProvider } from '@stripe/stripe-react-native';

export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.artydrop',
  urlScheme: 'artydrop',
};

// Apple Pay check
export const isApplePaySupported = async () => {
  try {
    const { isApplePaySupported } = require('@stripe/stripe-react-native');
    return await isApplePaySupported();
  } catch {
    return false;
  }
};

// Google Pay check
export const isGooglePaySupported = async () => {
  try {
    const { isGooglePaySupported } = require('@stripe/stripe-react-native');
    return await isGooglePaySupported({ testEnv: true });
  } catch {
    return false;
  }
};

// Initialize payment sheet for mobile payments
export const initializePaymentSheet = async ({ paymentIntentClientSecret, customerEphemeralKeySecret, customerId }) => {
  try {
    const { initPaymentSheet } = require('@stripe/stripe-react-native');
    const { error } = await initPaymentSheet({
      merchantDisplayName: 'Artydrop',
      paymentIntentClientSecret,
      customerEphemeralKeySecret,
      customerId,
      applePay: {
        merchantCountryCode: 'FR',
      },
      googlePay: {
        merchantCountryCode: 'FR',
        testEnv: true,
      },
      style: 'alwaysLight',
      appearance: {
        colors: {
          primary: '#000000',
          background: '#F5F0EA',
          componentBackground: '#FFFFFF',
          componentBorder: 'rgba(0,0,0,0.10)',
          componentDivider: 'rgba(0,0,0,0.05)',
          primaryText: '#1A1A1A',
          secondaryText: 'rgba(0,0,0,0.60)',
          componentText: '#1A1A1A',
          placeholderText: 'rgba(0,0,0,0.40)',
        },
        shapes: {
          borderRadius: 16,
          borderWidth: 1,
        },
      },
    });
    return { error };
  } catch (err) {
    return { error: err };
  }
};

// Present payment sheet
export const presentPaymentSheet = async () => {
  try {
    const { presentPaymentSheet } = require('@stripe/stripe-react-native');
    const { error } = await presentPaymentSheet();
    return { error };
  } catch (err) {
    return { error: err };
  }
};

// Confirm Apple Pay payment
export const confirmApplePayPayment = async (clientSecret) => {
  try {
    const { confirmApplePayPayment } = require('@stripe/stripe-react-native');
    const { error } = await confirmApplePayPayment({ clientSecret });
    return { error };
  } catch (err) {
    return { error: err };
  }
};

export default STRIPE_CONFIG;

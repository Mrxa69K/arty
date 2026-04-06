# Artydrop Mobile App

React Native (Expo) mobile app for the Artydrop photography delivery platform.

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe with Apple Pay & Google Pay support
- **Notifications**: Expo Notifications (push)
- **Media**: Expo Image Picker, Media Library, File System

## Project Structure

```
mobile/
├── App.js                          # Entry point
├── index.js                        # Root registration
├── app.json                        # Expo config
├── eas.json                        # EAS Build config
├── .env                            # Environment variables
├── src/
│   ├── config/
│   │   ├── supabase.js            # Supabase client
│   │   ├── stripe.js              # Stripe + Apple Pay / Google Pay
│   │   └── theme.js               # Design system (matches web)
│   ├── contexts/
│   │   └── AuthContext.js         # Auth state management
│   ├── navigation/
│   │   ├── AppNavigator.js        # Root navigator (auth check)
│   │   ├── AuthNavigator.js       # Login/Signup/ForgotPassword
│   │   ├── PhotographerNavigator.js  # Photographer tab navigator
│   │   └── ClientNavigator.js     # Client tab navigator
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   ├── photographer/
│   │   │   ├── DashboardScreen.js     # Home + stats + recent galleries
│   │   │   ├── GalleriesScreen.js     # Gallery list + search
│   │   │   ├── GalleryDetailScreen.js # Gallery editor (photos/details/sharing)
│   │   │   ├── NewGalleryScreen.js    # Quick gallery creation
│   │   │   └── SettingsScreen.js      # Profile + settings
│   │   ├── client/
│   │   │   ├── ClientDashboardScreen.js  # Client's galleries
│   │   │   └── ClientGalleryScreen.js    # Gallery viewer + lightbox
│   │   └── shared/
│   │       ├── PlansScreen.js         # Pricing plans
│   │       └── StripeCheckoutScreen.js # WebView checkout
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Card.js
│   │   │   └── Badge.js
│   │   └── GalleryCard.js
│   ├── hooks/
│   │   ├── useNotifications.js    # Push notification setup
│   │   └── useGalleries.js        # Gallery CRUD operations
│   └── utils/
│       └── constants.js           # Plans, helpers, formatters
```

## Features

### Photographer (Creator) View
- **Dashboard**: Stats overview, plan limits, recent galleries, quick create
- **Galleries**: Full CRUD, search/filter, grid & list views
- **Gallery Editor**: 
  - Upload photos & videos from device gallery/camera
  - Edit gallery details (title, client info, notes)
  - Generate shareable links with download permissions
  - Delete photos with long-press
- **Plans**: Interactive plan selection (Test, Pay-as-you-go, Studio)
- **Settings**: Profile, plan management, sign out

### Client View
- **Gallery List**: View all galleries shared via email
- **Gallery Viewer**: Full photo grid with lightbox
- **Download**: Save photos/videos to device library
- **View-only mode**: Respects download permissions set by photographer

### Integrations
- **Supabase Auth**: Email/password authentication
- **Supabase Storage**: Photo/video upload and retrieval
- **Stripe**: Plan payments with Apple Pay & Google Pay support
- **Push Notifications**: Gallery shared / client viewed notifications

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- iOS: Xcode 15+ (for iOS simulator)
- Android: Android Studio (for Android emulator)

### Installation

```bash
cd mobile
yarn install
```

### Run in Development

```bash
# Start Expo dev server
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Scan QR code with Expo Go app on your phone
```

### Build for Testing

```bash
# Login to EAS
eas login

# Build for iOS (simulator)
eas build --platform ios --profile preview

# Build for Android (APK)
eas build --platform android --profile preview

# Build development client (recommended)
eas build --platform all --profile development
```

### Build for Production

```bash
# iOS (App Store)
eas build --platform ios --profile production

# Android (Play Store)
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

Create `.env` in the mobile directory:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EXPO_PUBLIC_APP_URL=https://artydrop.com
```

## Apple Pay & Google Pay Setup

### Apple Pay
1. Create a Merchant ID in Apple Developer Portal
2. Update `app.json` with your merchant identifier
3. Configure Stripe Dashboard > Settings > Apple Pay

### Google Pay
1. Enable Google Pay in your Stripe Dashboard
2. The `@stripe/stripe-react-native` plugin handles the rest
3. Test with Google Pay test cards

## Push Notifications Setup

1. Create an Expo project: `eas init`
2. Update `app.json` with your EAS project ID
3. For iOS: Upload APNs key to Expo dashboard
4. For Android: Upload FCM server key to Expo dashboard

## Design System

The mobile app mirrors the web design:
- **Colors**: Warm beige (#F5F0EA) background, black accents
- **Typography**: Josefin Sans (headings) + Inter (body)
- **Components**: Pill buttons, rounded cards, glass-morphism
- **Aesthetic**: Minimal, warm, premium photography brand

## Supabase Tables Used

- `profiles` - User profiles
- `galleries` - Gallery metadata
- `photos` - Photo/video records
- `folders` - Gallery folder structure
- `gallery_links` - Share links with permissions
- `push_tokens` - Push notification tokens (new for mobile)

> **Note**: You may need to create the `push_tokens` table:
> ```sql
> CREATE TABLE push_tokens (
>   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
>   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
>   token TEXT NOT NULL,
>   platform TEXT NOT NULL,
>   updated_at TIMESTAMPTZ DEFAULT now(),
>   UNIQUE(user_id)
> );
> ```

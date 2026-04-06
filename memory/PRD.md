# Artydrop Mobile App - PRD

## Original Problem Statement
Build a mobile app (iOS/Android) for the Artydrop SaaS platform - a photography gallery delivery service with a pay-as-you-go pricing model. The mobile app should mirror the existing Next.js web app's design, fonts, and frontend aesthetic.

## Architecture
- **Framework**: React Native with Expo SDK 52
- **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
- **Backend**: Supabase (shared with web app - Auth, Database, Storage)
- **Payments**: Stripe with Apple Pay & Google Pay support
- **Notifications**: Expo Notifications (push)
- **Media**: Expo Image Picker, Media Library, File System

## User Personas
1. **Photographer (Creator)**: Part-time or professional photographers who need to deliver galleries to clients without monthly subscriptions
2. **Client (Viewer)**: End clients who receive and view photo/video galleries

## Core Requirements
- Photographer & Client dual views
- Gallery CRUD with photo/video upload from device
- Gallery sharing with secure links
- Lightbox photo viewer with download capability
- Plan selection: Test ($1), Pay-as-you-go ($4.90/gallery), Studio ($19/mo)
- Stripe payments with Apple Pay & Google Pay
- Push notifications (gallery shared, client viewed/downloaded)
- Design matching web: warm beige (#F5F0EA), Josefin Sans + Inter fonts, glass-morphism

## What's Been Implemented (Jan 2026)
- [x] Full Expo project setup with all dependencies
- [x] Design system matching web (theme.js with colors, typography, spacing, shadows)
- [x] Auth flow: Login, Signup (photographer/client), Forgot Password
- [x] Photographer Dashboard with stats, plan limits, recent galleries
- [x] Galleries list with search and grid/list views
- [x] Gallery detail editor (photos tab, details tab, sharing tab)
- [x] Photo/video upload from device gallery
- [x] Share link generation with download permissions
- [x] Plans screen with animated pricing cards
- [x] Client dashboard showing shared galleries
- [x] Client gallery viewer with lightbox and navigation
- [x] Photo download to device library
- [x] Settings screen with profile and plan management
- [x] Navigation structure (tab bars for photographer and client)
- [x] Stripe config with Apple Pay & Google Pay setup
- [x] Push notifications hook with Expo Notifications
- [x] Supabase SQL migration for push_tokens table
- [x] EAS build configuration for dev/preview/production
- [x] Comprehensive README with setup instructions

## P0 (Critical - Before Launch)
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Set up EAS project ID
- [ ] Configure Apple Pay merchant ID
- [ ] Configure push notification credentials (APNs/FCM)
- [ ] Replace placeholder app icons and splash screen

## P1 (Important)
- [ ] Offline gallery caching
- [ ] Image zoom/pinch in lightbox
- [ ] Gallery folder support in mobile
- [ ] Password-protected gallery access for clients
- [ ] Email sending when gallery is shared

## P2 (Nice to Have)
- [ ] Quick camera-to-gallery upload
- [ ] Watermark preview
- [ ] Gallery analytics (views, downloads)
- [ ] Dark mode
- [ ] Batch download all photos
- [ ] Social sharing of gallery links

## Next Tasks
1. Create app icons and splash screen assets
2. Set up EAS project and test builds
3. Test full auth flow on real device
4. Test photo upload on real device
5. Configure Stripe for native Apple Pay/Google Pay payment sheet

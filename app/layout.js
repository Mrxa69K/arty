import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './providers'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import CookieConsent from '@/components/CookieConsent'

const SITE_URL = 'https://artydrop.studio'
const SITE_TITLE = 'ArtyDrop — Premium Photo Gallery Delivery for Photographers'
const SITE_DESCRIPTION =
  'ArtyDrop lets professional photographers deliver secure, beautiful photo galleries to their clients. No monthly subscription required — pay-as-you-go pricing from €4.90 per gallery.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: 'photo gallery, photographer, client delivery, photo sharing, professional photography, galerie photo, livraison photo',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'ArtyDrop',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Cairo + IBM Plex Sans Arabic + Geist Mono (Arabic swap handled via CSS vars in globals.css) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Clash Display + General Sans */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=general-sans@400,500,600&display=swap"
        />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {/* Noise texture overlay */}
        <div className="noise-overlay" aria-hidden="true" />
        
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <CookieConsent />
        </LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161618',
              border: '1px solid rgba(237,235,230,0.1)',
              color: '#EDEBE6',
            },
          }}
        />
      </body>
    </html>
  )
}

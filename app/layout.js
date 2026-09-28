import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './providers'

export const metadata = {
  title: 'ArtyDrop - Premium Photo Gallery Delivery for Photographers',
  description:
    'ArtyDrop is the premium delivery platform for professional photographers. Share secure, beautiful photo galleries with your clients. Pay-as-you-go pricing starting at 4.90 per gallery.',
  keywords: 'photo gallery, photographer, client delivery, photo sharing, professional photography',
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
        
        <AuthProvider>
          {children}
        </AuthProvider>
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

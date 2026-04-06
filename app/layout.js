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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Playfair Display + Manrope + JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#ededed] min-h-screen">
        {/* Noise texture overlay */}
        <div className="noise-overlay" aria-hidden="true" />
        
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#171717',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ededed',
            },
          }}
        />
      </body>
    </html>
  )
}

import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './providers'

export const metadata = {
  title: 'Artydrop – Secure Photo Gallery Delivery',
  description:
    'Artydrop is a premium delivery platform for professional photographers to share secure, beautiful photo galleries with their clients.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inter + Josefin Sans */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Josefin+Sans:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

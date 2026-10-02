export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/client',
        '/api/',
        '/g/',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: 'https://artydrop.studio/sitemap.xml',
  }
}

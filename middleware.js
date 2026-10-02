import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request:  {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env. NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request. cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request. headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // ✅ DEFINE pathname FIRST
  const pathname = request.nextUrl.pathname

  // Public routes - allow everyone
  const publicPaths = ['/', '/login', '/signup', '/faq', '/support', '/opengraph-image']
  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/legal/') || pathname.startsWith('/auth/')
  const isGalleryLink = pathname.startsWith('/g/')
  const isApiRoute = pathname.startsWith('/api/')
  const isNextInternal = pathname.startsWith('/_next') || pathname.includes('.')
  
  if (isPublicPath || isGalleryLink || isApiRoute || isNextInternal) {
    return response
  }

  // Get session
  const { data: { session } } = await supabase. auth.getSession()

  // Not logged in → redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user profile to check type
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single()

  const userType = profile?.user_type || 'photographer'

  // Photographers trying to access client routes → redirect
  if (pathname.startsWith('/client') && userType === 'photographer') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Clients trying to access photographer routes → redirect
  if (pathname.startsWith('/dashboard') && userType === 'client') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon. ico|.*\\. (?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
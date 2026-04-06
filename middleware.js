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
  const publicPaths = ['/', '/login', '/signup', '/terms', '/privacy', '/faq']
  const isPublicPath = publicPaths.includes(pathname)
  const isGalleryLink = pathname.startsWith('/g/')
  const isApiRoute = pathname.startsWith('/api/')
  const isNextInternal = pathname.startsWith('/_next') || pathname.includes('.')
  
  if (isPublicPath || isGalleryLink || isApiRoute || isNextInternal) {
    return response
  }

  // Get session
  const { data: { session } } = await supabase. auth.getSession()

  console.log('🔐 Middleware check:', {
    pathname,
    hasSession: !!session,
    userId: session?.user?.id
  })

  // Not logged in → redirect to login
  if (!session) {
    console.log('❌ No session found - redirecting to login')
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  console.log('✅ Session found - continuing.. .')

  // Get user profile to check type
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', session.user.id)
    .single()

  const userType = profile?.user_type || 'photographer'

  console.log(`✅ User type: ${userType}`)

  // Photographers trying to access client routes → redirect
  if (pathname.startsWith('/client') && userType === 'photographer') {
    console.log('⚠️ Photographer trying to access client area')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Clients trying to access photographer routes → redirect
  if (pathname.startsWith('/dashboard') && userType === 'client') {
    console.log('⚠️ Client trying to access photographer area')
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon. ico|.*\\. (?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
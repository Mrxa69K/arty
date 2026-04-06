import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const galleryId = searchParams.get('galleryId')

  const { data: links } = await supabaseAdmin
    .from('gallery_links')
    .select('view_count')
    .eq('gallery_id', galleryId)

  const totalViews = links?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0
  const isLocked = totalViews >= 1

  return NextResponse.json({ isLocked, totalViews })
}

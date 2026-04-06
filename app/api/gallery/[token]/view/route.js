import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const { token } = await params

  try {
    const { data: linkData } = await supabaseAdmin
      .from('gallery_links')
      .select('id, gallery_id')
      .eq('token', token)
      .single()

    if (!linkData) return NextResponse.json({ ok: false })

    const ua = request.headers.get('user-agent') || ''
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)
    const isTablet = /iPad|Tablet/i.test(ua)
    const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : null

    await supabaseAdmin
      .from('gallery_views')
      .insert({
        gallery_id: linkData.gallery_id,
        gallery_link_id: linkData.id,
        device,
        ip,
      })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

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

    const { count: priorViews } = await supabaseAdmin
      .from('gallery_views')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', linkData.gallery_id)

    await supabaseAdmin
      .from('gallery_views')
      .insert({
        gallery_id: linkData.gallery_id,
        gallery_link_id: linkData.id,
        device,
        ip,
      })

    if (!priorViews) {
      try {
        const { data: gallery } = await supabaseAdmin
          .from('galleries')
          .select('title, owner_id')
          .eq('id', linkData.gallery_id)
          .single()

        if (gallery?.owner_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: gallery.owner_id,
            type: 'gallery_first_view',
            title: `"${gallery.title || 'Your gallery'}" was just opened`,
            body: 'A client viewed it for the first time.',
            link_url: `/dashboard/galleries/${linkData.gallery_id}`,
          })
        }
      } catch (notifError) {
        console.error('Failed to create first-view notification (non-critical):', notifError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

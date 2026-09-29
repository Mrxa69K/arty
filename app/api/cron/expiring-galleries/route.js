import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const REMINDER_WINDOW_DAYS = 3

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('id, title, owner_id, expires_at, expiry_reminder_sent_for')
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .lte('expires_at', windowEnd.toISOString())
    .gte('expires_at', now.toISOString())

  if (error) {
    console.error('Failed to query expiring galleries:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let notified = 0

  for (const gallery of galleries || []) {
    // Skip if we already reminded for this exact expiry date — renewing the
    // gallery changes expires_at, which naturally re-enables a fresh reminder.
    if (gallery.expiry_reminder_sent_for === gallery.expires_at) continue

    const daysLeft = Math.max(1, Math.ceil((new Date(gallery.expires_at) - now) / (24 * 60 * 60 * 1000)))

    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: gallery.owner_id,
        type: 'gallery_expiring_soon',
        title: `"${gallery.title || 'A gallery'}" expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        body: 'Remind your client to download their photos before the link goes dark.',
        link_url: `/dashboard/galleries/${gallery.id}`,
      })

      await supabaseAdmin
        .from('galleries')
        .update({ expiry_reminder_sent_for: gallery.expires_at })
        .eq('id', gallery.id)

      notified++
    } catch (notifError) {
      console.error(`Failed to notify for gallery ${gallery.id}:`, notifError)
    }
  }

  return NextResponse.json({ ok: true, checked: galleries?.length || 0, notified })
}

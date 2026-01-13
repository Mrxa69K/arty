import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { token } = await params

  try {
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .select('title, client_name, event_date, passwordhash, allow_download')  // ✅ Add allow_download
      .eq('id', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    return NextResponse.json({
      gallery: {
        title: data.title || 'Client Gallery',
        client_name: data.client_name,
        event_date: data.event_date
      },
      requires_password: !!data.passwordhash,
      allow_download: data.allow_download !== false  // ✅ From DB
    })
  } catch (error) {
    console.error('Gallery API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

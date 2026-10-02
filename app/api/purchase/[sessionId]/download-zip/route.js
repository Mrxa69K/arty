import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validatePurchaseToken } from '@/lib/purchaseAccess'
import { isAllowedMediaUrl } from '@/lib/safeMediaFetch'
import JSZip from 'jszip'

export async function POST(request, { params }) {
  const { sessionId } = await params

  try {
    const { accessToken } = await request.json().catch(() => ({}))

    if (!accessToken || !validatePurchaseToken(accessToken, sessionId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Always the full set of photos actually paid for in this session —
    // never a client-supplied subset.
    const { data: purchases, error } = await supabaseAdmin
      .from('photo_purchases')
      .select('photo_id, photos(image_url, file_name)')
      .eq('stripe_checkout_session_id', sessionId)

    if (error || !purchases || purchases.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 })
    }

    const zip = new JSZip()
    const BATCH_SIZE = 10

    for (let i = 0; i < purchases.length; i += BATCH_SIZE) {
      await Promise.all(
        purchases.slice(i, i + BATCH_SIZE).map(async (purchase, j) => {
          const url = purchase.photos?.image_url
          if (!url || !isAllowedMediaUrl(url)) return
          try {
            const res = await fetch(url)
            if (!res.ok) return
            const buf = await res.arrayBuffer()
            const filename = purchase.photos.file_name || `photo-${String(i + j + 1).padStart(3, '0')}.jpg`
            zip.file(filename, buf)
          } catch { /* skip failed file */ }
        })
      )
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="photos.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Purchase zip download error:', error)
    return NextResponse.json({ error: 'Failed to create archive' }, { status: 500 })
  }
}

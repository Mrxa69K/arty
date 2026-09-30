import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client fully controls contentType — without an allowlist, an authenticated
// user could upload arbitrary content (e.g. text/html) and get back a public
// URL on our own storage domain, usable for phishing.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

export async function POST(request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileName, contentType } = await request.json()

  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 })
  }

  if (!fileName.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    ContentType: contentType,
  })

  // URL valid for 10 minutes — enough for any file size
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 })
  const publicUrl = `${R2_PUBLIC_URL}/${fileName}`

  return NextResponse.json({ uploadUrl, publicUrl })
}

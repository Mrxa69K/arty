import { NextResponse } from 'next/server'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request) {
  const ip = getClientIp(request)
  const { allowed } = await checkRateLimit(`captcha-verify:${ip}`, { maxAttempts: 30, windowMinutes: 10 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { token } = await request.json()
  const ok = await verifyTurnstileToken(token, ip)

  if (!ok) {
    return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

export function createSession(galleryToken) {
  const payload = `${galleryToken}:${Date.now()}`
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64')
}

export function validateSession(session, galleryToken) {
  try {
    const decoded = Buffer.from(session, 'base64').toString()
    const sigIndex = decoded.lastIndexOf(':')
    if (sigIndex === -1) return false
    const sig = decoded.slice(sigIndex + 1)
    const payload = decoded.slice(0, sigIndex)
    const tokenEnd = payload.indexOf(':')
    if (tokenEnd === -1) return false
    if (payload.slice(0, tokenEnd) !== galleryToken) return false
    const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex')
    const a = Buffer.from(sig), b = Buffer.from(expectedSig)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

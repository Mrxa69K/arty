import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY

// Deliberately permanent, no embedded expiry — the buyer paid for these
// specific photos and there's no business reason to cut off access later.
export function createPurchaseToken(checkoutSessionId) {
  const sig = createHmac('sha256', SECRET).update(checkoutSessionId).digest('hex')
  return Buffer.from(`${checkoutSessionId}:${sig}`).toString('base64')
}

export function validatePurchaseToken(token, checkoutSessionId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const sigIndex = decoded.lastIndexOf(':')
    if (sigIndex === -1) return false
    const sessionId = decoded.slice(0, sigIndex)
    const sig = decoded.slice(sigIndex + 1)
    if (sessionId !== checkoutSessionId) return false
    const expectedSig = createHmac('sha256', SECRET).update(sessionId).digest('hex')
    const a = Buffer.from(sig), b = Buffer.from(expectedSig)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

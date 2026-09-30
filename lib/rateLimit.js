import { supabaseAdmin } from '@/lib/supabase-admin'

// Generic, DB-backed rate limiter (Vercel functions are stateless/ephemeral,
// so anything in-memory resets per cold start and isn't shared across
// regions/instances — this needs to live in Postgres to actually work).
//
// Usage: const { allowed } = await checkRateLimit(`checkout:${user.id}`, { maxAttempts: 10, windowMinutes: 10 })
export async function checkRateLimit(key, { maxAttempts, windowMinutes }) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('rate_limit_hits')
    .select('*', { count: 'exact', head: true })
    .eq('rate_key', key)
    .gte('created_at', windowStart)

  if ((count || 0) >= maxAttempts) {
    return { allowed: false }
  }

  await supabaseAdmin.from('rate_limit_hits').insert({ rate_key: key })
  return { allowed: true }
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}

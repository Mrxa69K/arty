import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    // Shared PostHog project with other businesses on this account —
    // tag every event so Artydrop can be filtered on its own.
    loaded: (ph) => {
      ph.register({ app: 'artydrop' })
    },
  })
  initialized = true
}

export function shutdownPostHog() {
  if (!initialized) return
  posthog.opt_out_capturing()
  posthog.reset()
  initialized = false
}

export { posthog }

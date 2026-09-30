const STORAGE_KEY = 'artydrop_cookie_consent'

// 'accepted' | 'rejected' | null (not yet decided)
export function getCookieConsent() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function setCookieConsent(value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, value)
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: value }))
}

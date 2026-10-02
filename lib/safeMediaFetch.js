import { R2_PUBLIC_URL } from '@/lib/r2'

const ALLOWED_HOST = (() => {
  try {
    return new URL(R2_PUBLIC_URL).host
  } catch {
    return null
  }
})()

// photo/video URLs are stored client-supplied (set at upload time, then
// trusted on every later read) but only ever meant to point at our own R2
// bucket. Without this check a photo row crafted with an arbitrary
// image_url would make the server fetch whatever host an attacker chose —
// an SSRF primitive via the watermark/zip/download pipelines.
export function isAllowedMediaUrl(url) {
  if (!url || !ALLOWED_HOST) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.host === ALLOWED_HOST
  } catch {
    return false
  }
}

export async function fetchMedia(url) {
  if (!isAllowedMediaUrl(url)) {
    throw new Error('Refusing to fetch media from an untrusted host')
  }
  return fetch(url)
}

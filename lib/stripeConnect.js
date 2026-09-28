// ArtyDrop's platform commission on per-photo marketplace sales.
// Tips ("buy me a coffee") never use this — those are 0% by design.
export const PLATFORM_FEE_BPS = 1200 // 12%

export function computeApplicationFeeCents(subtotalCents) {
  return Math.round(subtotalCents * (PLATFORM_FEE_BPS / 10000))
}

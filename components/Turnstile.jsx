'use client'

import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import Script from 'next/script'

const Turnstile = forwardRef(function Turnstile({ onVerify }, ref) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: onVerify,
      'expired-callback': () => onVerify(''),
    })
  }, [onVerify])

  // next/script dedupes by src across the app, so onLoad only fires for
  // whichever page's mount happened to load it first — a client-side nav
  // to a second page using this component (e.g. login -> signup) never
  // gets its own onLoad call, leaving that page's widget permanently
  // unrendered and its submit button permanently disabled. Poll for
  // window.turnstile on mount as a fallback for exactly that case.
  useEffect(() => {
    if (window.turnstile) {
      renderWidget()
      return
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        renderWidget()
        clearInterval(interval)
      }
    }, 150)
    return () => clearInterval(interval)
  }, [renderWidget])

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
    },
  }))

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} />
    </>
  )
})

export default Turnstile

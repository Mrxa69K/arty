'use client'

import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
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

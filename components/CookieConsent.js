'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { getCookieConsent, setCookieConsent } from '@/lib/cookieConsent'

export default function CookieConsent() {
  const { t } = useLanguage()
  const [consent, setConsent] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    setConsent(getCookieConsent())
    setShowBanner(!getCookieConsent())

    const reopen = () => setShowBanner(true)
    window.addEventListener('open-cookie-preferences', reopen)
    return () => window.removeEventListener('open-cookie-preferences', reopen)
  }, [])

  const choose = (value) => {
    setCookieConsent(value)
    setConsent(value)
    setShowBanner(false)
  }

  return (
    <>
      {/* Cookieless by design (no persistent identifier, no cookies), but
          treated as opt-in analytics anyway — the more conservative, more
          defensible default for an EU-facing site. */}
      {consent === 'accepted' && <Analytics />}

      {showBanner && (
        <div
          className="fixed bottom-0 inset-x-0 z-[200] p-4 sm:p-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="max-w-3xl mx-auto bg-[#121212] border border-white/10 rounded-sm p-5 sm:p-6 shadow-dark-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm text-white/60 font-body leading-relaxed flex-1">
              {t('cookies.bannerBody')}{' '}
              <a href="/legal/privacy" className="text-white/80 underline underline-offset-2 hover:text-white transition-colors">
                {t('cookies.learnMore')}
              </a>
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => choose('rejected')}
                className="h-10 px-4 text-sm font-body text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-sm transition-colors whitespace-nowrap"
              >
                {t('cookies.reject')}
              </button>
              <button
                onClick={() => choose('accepted')}
                className="h-10 px-5 text-sm font-body font-semibold bg-gold text-black hover:bg-gold-light rounded-sm transition-colors whitespace-nowrap"
              >
                {t('cookies.accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

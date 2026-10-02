'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function SupportContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const context = searchParams.get('from') || 'homepage'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState(context === 'dashboard' ? 'account' : 'other')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || '')
        setName(session.user.user_metadata?.full_name || '')
      }
    })
  }, [])

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileRef.current || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, context, message, turnstileToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(res.status === 429 ? t('support.errorRateLimit') : (data.error || t('support.errorGeneric')))
        setIsLoading(false)
        if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken('')
        return
      }

      setSent(true)
    } catch {
      setError(t('support.errorGeneric'))
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [
    { value: 'bug', label: t('support.categoryBug') },
    { value: 'billing', label: t('support.categoryBilling') },
    { value: 'account', label: t('support.categoryAccount') },
    { value: 'gallery', label: t('support.categoryGallery') },
    { value: 'other', label: t('support.categoryOther') },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex items-center justify-center px-6 py-16">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={renderTurnstile}
      />
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-xl text-white/60 hover:text-white transition-colors">
          ArtyDrop
        </Link>

        {sent ? (
          <div className="mt-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-gold mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-display text-2xl text-white mb-2">{t('support.successTitle')}</h1>
            <p className="text-sm text-white/50 font-body mb-8">{t('support.successBody')}</p>
            <button
              onClick={() => { setSent(false); setMessage('') }}
              className="text-sm text-white/40 hover:text-white font-body underline underline-offset-2 transition-colors"
            >
              {t('support.sendAnother')}
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mt-10 mb-2">{t('support.eyebrow')}</p>
            <h1 className="font-display text-3xl text-white mb-2">{t('support.title')}</h1>
            <p className="text-sm text-white/40 font-body mb-8">{t('support.subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/60 font-body text-xs">
                  {t('support.labelName')} <span className="text-white/30">{t('support.labelNameOptional')}</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/60 font-body text-xs">{t('support.labelEmail')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60 font-body text-xs">{t('support.labelCategory')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-white/60 font-body text-xs">{t('support.labelMessage')}</Label>
                <Textarea
                  id="message"
                  required
                  rows={5}
                  placeholder={t('support.placeholderMessage')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-white/[0.03] border-white/10 text-white resize-none"
                />
              </div>

              <div ref={turnstileRef} />

              {error && (
                <p className="text-sm text-red-400 font-body">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full h-11 bg-gold text-black hover:bg-gold-light rounded-sm font-body font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('support.submitButton')
                )}
              </Button>
            </form>
          </>
        )}

        <Link href="/" className="block mt-10 text-xs text-white/30 hover:text-white/60 font-body transition-colors">
          {t('support.backHome')}
        </Link>
      </div>
    </div>
  )
}

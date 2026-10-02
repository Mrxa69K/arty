'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function MentionsLegalesContent() {
  const { t } = useLanguage()

  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">{t('legal.eyebrow')}</p>
      <h1 className="font-display text-3xl text-white mb-2">{t('legal.title')}</h1>
      <p className="text-xs text-white/25 font-body mb-12">{t('legal.subtitle')}</p>

      <Section title={t('legal.publisherTitle')}>
        <Row label={t('legal.labelName')} value="ArtyDrop" />
        <Row label={t('legal.labelStatus')} value={t('legal.statusValue')} />
        <Row label={t('legal.labelSiret')} value={t('legal.siretValue')} />
        <Row label={t('legal.labelAddress')} value={t('legal.addressValue')} />
        <Row label={t('legal.labelEmail')} value="support@artydrop.studio" />
        <Row label={t('legal.labelWebsite')} value="artydrop.studio" />
        <p className="mt-4 text-white/30 italic text-xs">{t('legal.publisherNote')}</p>
      </Section>

      <Section title={t('legal.directorTitle')}>
        <p>{t('legal.directorValue')}</p>
      </Section>

      <Section title={t('legal.hostingTitle')}>
        <Row label={t('legal.labelHost')} value="Vercel Inc." />
        <Row label={t('legal.labelAddress')} value="340 S Lemon Ave #4133, Walnut, CA 91789, USA" />
        <Row label={t('legal.labelWebsite')} value="vercel.com" />
        <p className="mt-3">{t('legal.mediaStorageIntro')}</p>
        <Row label={t('legal.labelProvider')} value="Cloudflare, Inc. (R2 Storage)" />
        <Row label={t('legal.labelAddress')} value="101 Townsend St, San Francisco, CA 94107, USA" />
      </Section>

      <Section title={t('legal.ipTitle')}>
        <p>{t('legal.ipText1')}</p>
        <p>{t('legal.ipText2')}</p>
      </Section>

      <Section title={t('legal.dataTitle')}>
        <p>
          {t('legal.dataText1Pre')}
          <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            {t('legal.privacyPolicyLink')}
          </a>
          .
        </p>
        <p>{t('legal.dataText2')}</p>
        <p>
          {t('legal.dataText3Pre')}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            www.cnil.fr
          </a>
          .
        </p>
      </Section>

      <Section title={t('legal.cookiesTitle')}>
        <p>
          {t('legal.cookiesTextPre')}
          <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            {t('legal.privacyPolicyLink')}
          </a>
          .
        </p>
      </Section>

      <Section title={t('legal.mediationTitle')}>
        <p>{t('legal.mediationText')}</p>
      </Section>

      <Section title={t('legal.supportTitle')}>
        <p>{t('legal.supportText')}</p>
        <p>
          <a href="mailto:support@artydrop.studio" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            support@artydrop.studio
          </a>
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg text-white mb-4">{title}</h2>
      <div className="text-sm text-white/50 font-body leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-white/25 w-36 flex-shrink-0">{label}:</span>
      <span className="text-white/55">{value}</span>
    </div>
  )
}

'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function PrivacyContent() {
  const { t, tList } = useLanguage()
  const s2Items = tList('privacy.s2Items')
  const s3Items = tList('privacy.s3Items')
  const s4Items = tList('privacy.s4Items')
  const s5Items = tList('privacy.s5Items')
  const s6Items = tList('privacy.s6Items')
  const s7Items = tList('privacy.s7Items')
  const s8Items = tList('privacy.s8Items')

  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">{t('privacy.pageLabel')}</p>
      <h1 className="font-display text-3xl text-white mb-2">{t('privacy.title')}</h1>
      <p className="text-xs text-white/25 font-body mb-12">{t('privacy.lastUpdated')}</p>

      <Section title={t('privacy.s1Title')}>
        <p>
          {t('privacy.s1Pre')}
          <a href="/legal/mentions-legales" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            {t('privacy.s1LinkText')}
          </a>
          {t('privacy.s1Post')}
        </p>
      </Section>

      <Section title={t('privacy.s2Title')}>
        <p>{t('privacy.s2Intro')}</p>
        <ul>
          {s2Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong> {item.body}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('privacy.s3Title')}>
        <p>{t('privacy.s3Intro')}</p>
        <ul>
          {s3Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('privacy.s4Title')}>
        <ul>
          {s4Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong> {item.body}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('privacy.s5Title')}>
        <ul>
          {s5Items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('privacy.s6Title')}>
        <p>{t('privacy.s6Intro')}</p>
        <ul>
          {s6Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong> {item.body}</li>
          ))}
        </ul>
      </Section>

      <Section title={t('privacy.s7Title')}>
        <p>{t('privacy.s7Intro')}</p>
        <ul>
          {s7Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong>{item.body}</li>
          ))}
        </ul>
        <p>
          {t('privacy.s7OutroPre')}
          <a href="mailto:support@artydrop.studio" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
            {t('privacy.s7OutroEmail')}
          </a>
          {t('privacy.s7OutroMid')}
          <strong>{t('privacy.s7OutroStrong')}</strong>
          {t('privacy.s7OutroPost')}
        </p>
      </Section>

      <Section title={t('privacy.s8Title')}>
        <p>{t('privacy.s8Intro')}</p>
        <ul>
          {s8Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong> {item.body}</li>
          ))}
        </ul>
        <p>{t('privacy.s8Outro')}</p>
      </Section>

      <Section title={t('privacy.s9Title')}>
        <p>{t('privacy.s9Body')}</p>
      </Section>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg text-white mb-4">{title}</h2>
      <div className="text-sm text-white/50 font-body leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

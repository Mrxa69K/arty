'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function TermsContent() {
  const { t, tList } = useLanguage()
  const s3Items = tList('terms.s3Items')

  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">{t('terms.pageLabel')}</p>
      <h1 className="font-display text-3xl text-white mb-2">{t('terms.title')}</h1>
      <p className="text-xs text-white/25 font-body mb-12">{t('terms.lastUpdated')}</p>

      <Section title={t('terms.s1Title')}>
        <p>{t('terms.s1Pre')}<strong>artydrop.studio</strong>{t('terms.s1Post')}</p>
      </Section>

      <Section title={t('terms.s2Title')}>
        <p>{t('terms.s2Body')}</p>
      </Section>

      <Section title={t('terms.s3Title')}>
        <p>{t('terms.s3Intro')}</p>
        <ul>
          {s3Items.map((item, i) => (
            <li key={i}><strong>{item.label}</strong> {item.body}</li>
          ))}
        </ul>
        <p>{t('terms.s3Outro')}</p>
      </Section>

      <Section title={t('terms.s4Title')}>
        <p>{t('terms.s4Body1')}</p>
        <p>{t('terms.s4Body2')}</p>
      </Section>

      <Section title={t('terms.s5Title')}>
        <p>{t('terms.s5Body1')}</p>
        <p>{t('terms.s5Body2')}</p>
        <p>{t('terms.s5Body3')}</p>
      </Section>

      <Section title={t('terms.s6Title')}>
        <p>{t('terms.s6Body')}</p>
      </Section>

      <Section title={t('terms.s7Title')}>
        <p>{t('terms.s7Body')}</p>
      </Section>

      <Section title={t('terms.s8Title')}>
        <p>{t('terms.s8Body')}</p>
      </Section>

      <Section title={t('terms.s9Title')}>
        <p>{t('terms.s9Body')}</p>
      </Section>

      <Section title={t('terms.s10Title')}>
        <p>{t('terms.s10Body')}</p>
      </Section>

      <Section title={t('terms.s11Title')}>
        <p>{t('terms.s11Body')}</p>
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

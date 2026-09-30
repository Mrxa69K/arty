export const metadata = {
  title: 'Legal Notice | ArtyDrop',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Legal</p>
      <h1 className="font-display text-3xl text-white mb-2">Legal Notice</h1>
      <p className="text-xs text-white/25 font-body mb-12">In accordance with French law n°2004-575 of June 21, 2004 for Confidence in the Digital Economy (LCEN)</p>

      <Section title="Site publisher">
        <Row label="Legal name" value="[Name or first name]" />
        <Row label="Status" value="Independent photographer / Sole trader" />
        <Row label="Address" value="[Address]" />
        <Row label="Email" value="[contact@domain.com]" />
        <Row label="Website" value="artydrop.netlify.app" />
        <p className="mt-4 text-white/30 italic text-xs">The information in brackets will be filled in at production launch, once a dedicated domain and formal legal structure are in place.</p>
      </Section>

      <Section title="Publication director">
        <p>[Director's name]</p>
      </Section>

      <Section title="Hosting">
        <Row label="Host" value="Vercel Inc." />
        <Row label="Address" value="340 S Lemon Ave #4133, Walnut, CA 91789, USA" />
        <Row label="Website" value="vercel.com" />
        <p className="mt-3">Media storage:</p>
        <Row label="Provider" value="Cloudflare, Inc. (R2 Storage)" />
        <Row label="Address" value="101 Townsend St, San Francisco, CA 94107, USA" />
      </Section>

      <Section title="Intellectual property">
        <p>Everything that makes up the ArtyDrop website (source code, design, text, logo) belongs to the Publisher. Reproducing, representing, modifying, or using any of it without express permission is prohibited.</p>
        <p>Photographs shown in galleries remain the exclusive property of the photographers who uploaded them. ArtyDrop claims no rights over this content.</p>
      </Section>

      <Section title="Personal data">
        <p>How personal data is processed through ArtyDrop is described in our <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>.</p>
        <p>Under the GDPR (EU Regulation 2016/679), you can exercise your rights by contacting the Publisher at the email address listed above.</p>
        <p>You can also file a complaint with the French data protection authority (CNIL): <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">www.cnil.fr</a>.</p>
      </Section>

      <Section title="Cookies">
        <p>This site uses cookies strictly necessary for it to function (session handling, authentication), plus optional, cookieless analytics only after you accept them via the cookie banner. For more details, see our <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Privacy Policy</a>.</p>
      </Section>

      <Section title="Mediation">
        <p>If a dispute can't be resolved amicably, the consumer may refer the matter to a consumer mediator in accordance with Article L.616-1 of the French Consumer Code.</p>
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

export const metadata = {
  title: "Terms of Service | ArtyDrop",
}

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Terms of Service</p>
      <h1 className="font-display text-3xl text-white mb-2">Terms of Service</h1>
      <p className="text-xs text-white/25 font-body mb-12">Last updated: April 2026</p>

      <Section title="1. Service overview">
        <p>ArtyDrop is an online platform that lets professional photographers securely deliver photo galleries to their clients. The service is available at <strong>artydrop.studio</strong> and is operated by an independent photographer (referred to below as "the Publisher").</p>
      </Section>

      <Section title="2. Acceptance of these terms">
        <p>Using the ArtyDrop service means you fully accept these Terms of Service. These terms apply to anyone accessing the service, whether a photographer (registered user) or a client (recipient of a gallery link).</p>
      </Section>

      <Section title="3. Accessing the service">
        <p>ArtyDrop offers two ways to access the service:</p>
        <ul>
          <li><strong>Photographers:</strong> access by registering with an email address and password. A subscription or credits may be required to create galleries.</li>
          <li><strong>Clients:</strong> access to galleries through a unique link (token) provided by the photographer, with or without a password.</li>
        </ul>
        <p>The Publisher reserves the right to suspend or delete any account that violates these terms.</p>
      </Section>

      <Section title="4. Content and intellectual property">
        <p>Photos uploaded to ArtyDrop remain the exclusive property of the photographer who publishes them. ArtyDrop claims no ownership rights over any uploaded content.</p>
        <p>The photographer warrants that they hold the necessary rights to the content they publish, and that it doesn't infringe on any third party's rights (image rights, copyright, etc.).</p>
      </Section>

      <Section title="5. How long galleries stay available">
        <p>Galleries remain accessible for a period set by the photographer or determined by their pricing plan. Once that period ends, the gallery is deactivated and can no longer be viewed or downloaded through the original link.</p>
        <p>Clients whose gallery has expired can regain access by purchasing a renewal directly from the expired gallery page, which reopens viewing and downloading for a further period. The Publisher does not guarantee that renewal will remain available indefinitely, nor that gallery files are kept beyond their original or renewed access period.</p>
        <p>Clients are strongly encouraged to download their photos before their gallery link expires.</p>
      </Section>

      <Section title="6. Liability">
        <p>ArtyDrop is a delivery tool. The Publisher accepts no responsibility for the content of galleries published by photographers. The Publisher cannot be held liable for data loss caused by technical failure, gallery expiration, or malicious action by a third party.</p>
      </Section>

      <Section title="7. Changes to these terms">
        <p>The Publisher reserves the right to modify these terms at any time. Users will be notified of any material change by email or through the dashboard.</p>
      </Section>

      <Section title="8. Governing law">
        <p>These terms are governed by French law. In the event of a dispute, both parties agree to seek an amicable resolution before pursuing any legal action.</p>
      </Section>

      <Section title="9. Contact">
        <p>If you have any questions about these terms, you can reach us at the address listed in the Legal Notice.</p>
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

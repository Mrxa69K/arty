export const metadata = {
  title: 'Privacy Policy | ArtyDrop',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Privacy</p>
      <h1 className="font-display text-3xl text-white mb-2">Privacy Policy</h1>
      <p className="text-xs text-white/25 font-body mb-12">Last updated: April 2026 (GDPR compliant)</p>

      <Section title="1. Data controller">
        <p>The data controller for personal data collected through ArtyDrop is the Publisher of the service (the independent photographer operating the platform). To exercise your rights, contact us using the details in the <a href="/legal/mentions-legales" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Legal Notice</a>.</p>
      </Section>

      <Section title="2. Data we collect">
        <p>We collect the following data:</p>
        <ul>
          <li><strong>Account data (photographers):</strong> email address, full name, public profile information (bio, social links).</li>
          <li><strong>Payment data:</strong> handled exclusively by Stripe. ArtyDrop never stores any banking details.</li>
          <li><strong>Gallery viewing data:</strong> visit timestamp, device type (mobile/desktop), IP address (anonymized after processing).</li>
          <li><strong>Browsing data:</strong> technical cookies needed for the service to work (session, authentication).</li>
        </ul>
      </Section>

      <Section title="3. Why we process this data">
        <p>Your data is used to:</p>
        <ul>
          <li>Provide the photo gallery delivery service</li>
          <li>Manage photographer accounts and subscriptions</li>
          <li>Generate anonymous viewing statistics (for photographers)</li>
          <li>Keep the service secure and stable</li>
          <li>Meet our legal obligations</li>
        </ul>
      </Section>

      <Section title="4. Legal basis for processing">
        <ul>
          <li><strong>Contract performance:</strong> for data needed to provide the service.</li>
          <li><strong>Legitimate interest:</strong> for gallery-viewing statistics.</li>
          <li><strong>Legal obligation:</strong> for retaining certain billing records.</li>
        </ul>
      </Section>

      <Section title="5. How long we keep your data">
        <ul>
          <li>Account data: kept for as long as the account is active, then deleted within 30 days of a deletion request.</li>
          <li>Galleries and photos: deleted once the gallery expires, or after 90 days of inactivity on a deleted account.</li>
          <li>Viewing data: kept for 12 months.</li>
          <li>Billing data: 10 years (French legal requirement).</li>
        </ul>
      </Section>

      <Section title="6. Subprocessors">
        <p>ArtyDrop relies on the following subprocessors, each bound by GDPR-compliant safeguards:</p>
        <ul>
          <li><strong>Supabase</strong> (database and authentication): USA/EU, DPA available</li>
          <li><strong>Cloudflare R2</strong> (file storage): USA/EU, DPA available</li>
          <li><strong>Stripe</strong> (payments): USA/EU, DPA available</li>
          <li><strong>Vercel</strong> (hosting): USA, DPA available</li>
        </ul>
      </Section>

      <Section title="7. Your rights">
        <p>Under the GDPR, you have the right to:</p>
        <ul>
          <li><strong>Access</strong>: obtain a copy of your data</li>
          <li><strong>Rectification</strong>: correct inaccurate data</li>
          <li><strong>Erasure</strong>: request that your data be deleted</li>
          <li><strong>Portability</strong>: receive your data in a structured format</li>
          <li><strong>Object</strong>: object to certain uses of your data</li>
        </ul>
        <p>To exercise these rights, contact us using the details in the Legal Notice. You can also file a complaint with <strong>CNIL</strong>, the French data protection authority (cnil.fr).</p>
      </Section>

      <Section title="8. Cookies">
        <p>ArtyDrop only uses cookies that are strictly necessary for the service to work (session handling, authentication). These don't require consent under the ePrivacy directive. We never use advertising or third-party tracking cookies.</p>
      </Section>

      <Section title="9. Security">
        <p>We use appropriate technical and organizational measures to protect your data: encryption in transit (HTTPS), secure password storage (hashing), and restricted access to sensitive data.</p>
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

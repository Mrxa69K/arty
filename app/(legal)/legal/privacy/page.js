export const metadata = {
  title: 'Politique de confidentialité — ArtyDrop',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Confidentialité</p>
      <h1 className="font-display text-3xl text-white mb-2">Politique de confidentialité</h1>
      <p className="text-xs text-white/25 font-body mb-12">Dernière mise à jour : avril 2026 — Conforme au RGPD</p>

      <Section title="1. Responsable du traitement">
        <p>Le responsable du traitement des données personnelles collectées via ArtyDrop est l'Éditeur du service (photographe indépendant opérant la plateforme). Pour exercer vos droits, contactez-nous via les coordonnées disponibles dans les <a href="/legal/mentions-legales" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">mentions légales</a>.</p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons les données suivantes :</p>
        <ul>
          <li><strong>Données de compte (photographes) :</strong> adresse e-mail, nom complet, informations de profil public (bio, liens sociaux).</li>
          <li><strong>Données de paiement :</strong> gérées exclusivement par Stripe. ArtyDrop ne stocke aucune donnée bancaire.</li>
          <li><strong>Données de consultation des galeries :</strong> horodatage de la visite, type d'appareil (mobile/desktop), adresse IP (anonymisée après traitement).</li>
          <li><strong>Données de navigation :</strong> cookies techniques nécessaires au fonctionnement du service (session, authentification).</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Fournir le service de livraison de galeries photos</li>
          <li>Gérer les comptes photographes et les abonnements</li>
          <li>Produire des statistiques de consultation anonymes (pour les photographes)</li>
          <li>Assurer la sécurité et la stabilité du service</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </Section>

      <Section title="4. Base légale du traitement">
        <ul>
          <li><strong>Exécution du contrat</strong> : pour les données nécessaires à la fourniture du service.</li>
          <li><strong>Intérêt légitime</strong> : pour les données statistiques de consultation.</li>
          <li><strong>Obligation légale</strong> : pour la conservation de certaines données de facturation.</li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul>
          <li>Données de compte : conservées tant que le compte est actif, puis supprimées sous 30 jours après demande de suppression.</li>
          <li>Galeries et photos : supprimées à l'expiration de la galerie ou après 90 jours sans activité sur un compte supprimé.</li>
          <li>Données de consultation : conservées 12 mois.</li>
          <li>Données de facturation : 10 ans (obligation légale française).</li>
        </ul>
      </Section>

      <Section title="6. Sous-traitants">
        <p>ArtyDrop fait appel aux sous-traitants suivants, chacun soumis à des garanties RGPD :</p>
        <ul>
          <li><strong>Supabase</strong> (base de données et authentification) — USA/EU, DPA disponible</li>
          <li><strong>Cloudflare R2</strong> (stockage des fichiers) — USA/EU, DPA disponible</li>
          <li><strong>Stripe</strong> (paiements) — USA/EU, DPA disponible</li>
          <li><strong>Netlify</strong> (hébergement) — USA, DPA disponible</li>
        </ul>
      </Section>

      <Section title="7. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p>Pour exercer ces droits, contactez-nous via les coordonnées disponibles dans les mentions légales. Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (cnil.fr).</p>
      </Section>

      <Section title="8. Cookies">
        <p>ArtyDrop utilise uniquement des cookies strictement nécessaires au fonctionnement du service (gestion de session, authentification). Ces cookies ne requièrent pas de consentement selon la directive ePrivacy. Aucun cookie publicitaire ou de suivi tiers n'est utilisé.</p>
      </Section>

      <Section title="9. Sécurité">
        <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement en transit (HTTPS), stockage sécurisé des mots de passe (hachage), accès restreint aux données sensibles.</p>
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

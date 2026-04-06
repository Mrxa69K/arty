export const metadata = {
  title: 'Mentions légales — ArtyDrop',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Légal</p>
      <h1 className="font-display text-3xl text-white mb-2">Mentions légales</h1>
      <p className="text-xs text-white/25 font-body mb-12">Conformément à la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN)</p>

      <Section title="Éditeur du site">
        <Row label="Raison sociale" value="[Nom ou prénom]" />
        <Row label="Statut" value="Photographe indépendant / Auto-entrepreneur" />
        <Row label="Adresse" value="[Adresse]" />
        <Row label="E-mail" value="[contact@domaine.com ]" />
        <Row label="Site" value="artydrop.netlify.app" />
        <p className="mt-4 text-white/30 italic text-xs">Les informations entre crochets seront complétées lors de la mise en production avec un domaine propre et une structure légale formalisée.</p>
      </Section>

      <Section title="Directeur de la publication">
        <p>[Nom du Directeur ]</p>
      </Section>

      <Section title="Hébergement">
        <Row label="Hébergeur" value="Netlify, Inc." />
        <Row label="Adresse" value="512 2nd Street, Suite 200, San Francisco, CA 94107, USA" />
        <Row label="Site" value="netlify.com" />
        <p className="mt-3">Stockage des médias :</p>
        <Row label="Prestataire" value="Cloudflare, Inc. (R2 Storage)" />
        <Row label="Adresse" value="101 Townsend St, San Francisco, CA 94107, USA" />
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble des éléments constituant le site ArtyDrop (code source, design, textes, logo) est la propriété de l'Éditeur. Toute reproduction, représentation, modification ou exploitation sans autorisation expresse est interdite.</p>
        <p>Les photographies présentes dans les galeries sont la propriété exclusive des photographes qui les ont téléversées. ArtyDrop ne revendique aucun droit sur ces contenus.</p>
      </Section>

      <Section title="Données personnelles">
        <p>Le traitement des données personnelles effectué via ArtyDrop est décrit dans notre <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Politique de confidentialité</a>.</p>
        <p>Conformément au RGPD (Règlement UE 2016/679), vous pouvez exercer vos droits en contactant l'Éditeur à l'adresse e-mail mentionnée ci-dessus.</p>
        <p>Vous avez également la possibilité d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">www.cnil.fr</a>.</p>
      </Section>

      <Section title="Cookies">
        <p>Le site utilise uniquement des cookies techniques nécessaires à son fonctionnement (gestion de session, authentification). Pour plus d'informations, consultez notre <a href="/legal/privacy" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Politique de confidentialité</a>.</p>
      </Section>

      <Section title="Médiation">
        <p>En cas de litige n'ayant pu être résolu à l'amiable, le consommateur a la possibilité de recourir à un médiateur de la consommation conformément à l'article L.616-1 du Code de la consommation.</p>
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
      <span className="text-white/25 w-36 flex-shrink-0">{label} :</span>
      <span className="text-white/55">{value}</span>
    </div>
  )
}

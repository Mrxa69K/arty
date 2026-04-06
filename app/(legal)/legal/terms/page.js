export const metadata = {
  title: "Conditions Générales d'Utilisation — ArtyDrop",
}

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-body mb-4">Conditions générales</p>
      <h1 className="font-display text-3xl text-white mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-xs text-white/25 font-body mb-12">Dernière mise à jour : avril 2026</p>

      <Section title="1. Présentation du service">
        <p>ArtyDrop est une plateforme en ligne permettant aux photographes professionnels de livrer des galeries photos à leurs clients de manière sécurisée. Le service est accessible à l'adresse <strong>artydrop.netlify.app</strong> et est opéré par un photographe indépendant (ci-après « l'Éditeur »).</p>
      </Section>

      <Section title="2. Acceptation des conditions">
        <p>L'utilisation du service ArtyDrop implique l'acceptation pleine et entière des présentes conditions générales d'utilisation. Ces conditions s'appliquent à toute personne accédant au service, qu'elle soit photographe (utilisateur inscrit) ou client final (destinataire d'un lien de galerie).</p>
      </Section>

      <Section title="3. Accès au service">
        <p>ArtyDrop propose deux modes d'accès :</p>
        <ul>
          <li><strong>Photographes :</strong> Accès par inscription avec adresse e-mail et mot de passe. Un abonnement ou des crédits peuvent être requis pour créer des galeries.</li>
          <li><strong>Clients :</strong> Accès aux galeries via un lien unique (token) fourni par le photographe, avec ou sans mot de passe.</li>
        </ul>
        <p>L'Éditeur se réserve le droit de suspendre ou de supprimer tout compte en cas de violation des présentes conditions.</p>
      </Section>

      <Section title="4. Contenu et propriété intellectuelle">
        <p>Les photographies téléversées sur ArtyDrop restent la propriété exclusive du photographe qui les publie. ArtyDrop ne revendique aucun droit de propriété sur les contenus déposés.</p>
        <p>Le photographe garantit qu'il dispose des droits nécessaires sur les contenus publiés et qu'ils ne violent aucun droit de tiers (droit à l'image, droits d'auteur, etc.).</p>
      </Section>

      <Section title="5. Durée de conservation des galeries">
        <p>Les galeries sont accessibles pendant une durée définie par le photographe ou par son plan tarifaire. À l'expiration, les galeries sont désactivées. L'Éditeur ne garantit pas la conservation des fichiers au-delà de cette période.</p>
        <p>Il est fortement recommandé aux clients de télécharger leurs photos avant l'expiration du lien.</p>
      </Section>

      <Section title="6. Responsabilité">
        <p>ArtyDrop est un outil de livraison. L'Éditeur décline toute responsabilité quant au contenu des galeries publiées par les photographes. La responsabilité de l'Éditeur ne saurait être engagée en cas de perte de données due à une défaillance technique, à l'expiration d'une galerie, ou à un acte malveillant de tiers.</p>
      </Section>

      <Section title="7. Modification des conditions">
        <p>L'Éditeur se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle par e-mail ou via le tableau de bord.</p>
      </Section>

      <Section title="8. Droit applicable">
        <p>Les présentes conditions sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.</p>
      </Section>

      <Section title="9. Contact">
        <p>Pour toute question relative aux présentes conditions, vous pouvez nous contacter à l'adresse indiquée dans les mentions légales.</p>
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

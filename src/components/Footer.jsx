import Container from './Container.jsx';
import { footerNavigation, footerPartners } from '../data/navigation.js';

export default function Footer() {
  return (
    <footer className="ev39-footer relative mt-20 overflow-hidden border-t border-brand-border/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-soft/30 via-transparent to-brand-primary/10" />
      <Container className="ev39-footer__inner relative py-16">
        <div className="ev39-footer__grid grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <section className="ev39-footer__section">
            <h2 className="ev39-footer__title font-bold tracking-tight text-brand-text">Navigation</h2>
            <nav className="ev39-footer__links mt-4 grid gap-2" aria-label="Navigation du pied de page">
              {footerNavigation.map((link) => <a key={link.href} href={link.href} className="min-h-[34px] text-sm font-medium text-brand-body hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{link.label}</a>)}
            </nav>
          </section>
          <section className="ev39-footer__section">
            <h2 className="ev39-footer__title font-bold tracking-tight text-brand-text">Liens utiles</h2>
            <nav className="ev39-footer__links mt-4 grid gap-2" aria-label="Liens partenaires et institutions">
              {footerPartners.map((link) => <a key={link.href} href={link.href} className="min-h-[34px] text-sm font-medium text-brand-body hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{link.label}</a>)}
            </nav>
          </section>
          <section className="ev39-footer__section">
            <h2 className="ev39-footer__title font-bold tracking-tight text-brand-text">Contact & informations</h2>
            <div className="ev39-footer__contact mt-4 grid gap-2 text-sm text-brand-body">
              <a href="mailto:equilibrevital.bruxelles@gmail.com">equilibrevital.bruxelles@gmail.com</a>
              <a href="tel:+32492691070">0492/691.070</a>
              <p>BCE : 1019487618</p>
              <p className="ev39-footer__payment pt-3 text-xs text-brand-muted"><span>IBAN : BE17 5230 8164 9221</span><br /><span>BIC : TRIOBEBB</span></p>
            </div>
          </section>
        </div>
        <div className="ev39-footer__bottom mt-12 flex flex-col gap-4 border-t border-brand-border/40 pt-6 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© Équilibre Vital asbl</span>
          <nav className="ev39-footer__legal flex flex-wrap gap-4" aria-label="Liens légaux">
            <a href="/pssr/mentions-legales.html">Mentions légales</a>
            <a href="/pssr/confidentialite-rgpd.html#rgpd">RGPD</a>
            <a href="/pssr/confidentialite-rgpd.html">Politique de confidentialité</a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

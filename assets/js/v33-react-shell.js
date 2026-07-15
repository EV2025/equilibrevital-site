/* V33 — Navigation componentisée pour GitHub Pages.
   Même logique que des composants React : données séparées, rendu unique, accessibilité. */
(function(){
  const navItems = [
    { label: 'Activités', href: 'activites.html' },
    { label: 'Dispositifs', href: 'dispositifs.html' },
    { label: 'PSSR', href: 'pssr.html' }
  ];
  const actionItems = [
    { label: 'Connexion', href: 'dashboard.html', variant: 'secondary' },
    { label: 'Je m’inscris', href: 'inscription.html', variant: 'primary' }
  ];
  const footerColumns = [
    {
      title: 'Navigation',
      links: [
        { label: 'Accueil', href: 'index.html' },
        { label: 'Activités', href: 'activites.html' },
        { label: 'Dispositifs', href: 'dispositifs.html' },
        { label: 'PSSR', href: 'pssr.html' },
        { label: 'Ateliers', href: 'dispositifs.html' },
        { label: 'Partenaires', href: 'ecoles-atl.html' }
      ]
    },
    {
      title: 'Ressources',
      links: [
        { label: 'Présentation', href: 'presentation-pssr.html' },
        { label: 'Réserver', href: 'reservation.html' },
        { label: 'Documents', href: 'documents.html' },
        { label: 'FAQ', href: 'faq.html' },
        { label: 'Formation & emploi', href: 'ressources-emploi-insertion.html' },
        { label: 'Écoles & ATL', href: 'ecoles-atl.html' }
      ]
    }
  ];
  function depthPrefix(){
    const path = window.location.pathname || '';
    const after = path.split('/pssr/')[1] || path.split('/').filter(Boolean).slice(-2).join('/');
    const clean = after || 'index.html';
    const parts = clean.split('/').filter(Boolean);
    const depth = Math.max(0, parts.length - 1);
    return depth ? '../'.repeat(depth) : './';
  }
  function href(path){
    if(/^https?:|^mailto:|^tel:|^#/.test(path)) return path;
    return depthPrefix() + path.replace(/^\.\//,'');
  }
  function linkHTML(item, className=''){
    return `<a${className ? ` class="${className}"` : ''} href="${href(item.href)}">${item.label}</a>`;
  }
  function headerHTML(){
    const desktopNav = navItems.map(item => linkHTML(item)).join('');
    const desktopActions = actionItems.map(item => linkHTML(item, `ev-btn ev-btn--${item.variant}`)).join('');
    const mobileLinks = navItems.map(item => linkHTML(item)).join('') + actionItems.map(item => linkHTML(item, item.variant === 'primary' ? 'ev-mobile-signup' : 'ev-mobile-login')).join('');
    return `
      <header class="ev-header" role="banner">
        <div class="ev-container ev-header__inner">
          <a class="ev-brand" href="${href('index.html')}" aria-label="Retour à l’accueil Équilibre Vital">
            <img class="ev-brand__logo" src="${href('wp-content/uploads/2025/09/equilibre-vital-logo-transparent.png')}" alt="Logo Équilibre Vital" loading="lazy">
            <span class="ev-brand__text"><strong class="ev-brand__name">Équilibre Vital</strong><small class="ev-brand__sub">PSSR · Bruxelles</small></span>
          </a>
          <nav class="ev-navbar" aria-label="Navigation principale">${desktopNav}</nav>
          <div class="ev-actions">${desktopActions}</div>
          <button class="ev-menu-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-menu-v33">
            <span class="ev-menu-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
          </button>
        </div>
        <nav id="mobile-menu-v33" class="ev-mobile-menu" aria-label="Navigation mobile">${mobileLinks}</nav>
      </header>`;
  }
  function footerHTML(){
    return `
      <footer class="ev-footer" role="contentinfo">
        <div class="ev-container ev-footer__inner">
          <div class="ev-footer__grid">
            <section>
              <h2 class="ev-footer__title">Équilibre Vital asbl</h2>
              <p>Plateforme socio-sportive d’accompagnement, d’inclusion et de remise en mouvement à Bruxelles-Capitale.</p>
              <p>Bouger, reprendre confiance et avancer à son rythme.</p>
            </section>
            ${footerColumns.map(column => `
              <section>
                <h2 class="ev-footer__title">${column.title}</h2>
                <nav class="ev-footer__links" aria-label="${column.title}">
                  ${column.links.map(item => linkHTML(item)).join('')}
                </nav>
              </section>
            `).join('')}
            <section>
              <h2 class="ev-footer__title">Contact & informations</h2>
              <p>Email : <a href="mailto:equilibrevital.bruxelles@gmail.com">equilibrevital.bruxelles@gmail.com</a></p>
              <p>Téléphone : <a href="tel:+32492691070">0492/691.070</a></p>
              <p>BCE : 1019487618</p>
              <div class="ev-footer__payment">
                <p>IBAN : BE17 5230 8164 9221</p>
                <p>BIC : TRIOBEBB</p>
              </div>
            </section>
          </div>
          <div class="ev-footer__bottom">
            <span>EV© 2026 — Tous droits réservés.</span>
            <nav class="ev-footer__legal" aria-label="Liens légaux">
              <a href="${href('mentions-legales.html')}">Mentions légales</a>
              <a href="${href('confidentialite-rgpd.html')}">RGPD</a>
              <a href="${href('confidentialite-rgpd.html')}">Politique de confidentialité</a>
            </nav>
          </div>
        </div>
      </footer>`;
  }
  function mountShell(){
    const existingHeader = document.querySelector('body > header, .pssr-header, .v32-header, .ev-header');
    if(existingHeader){ existingHeader.outerHTML = headerHTML(); }
    else { document.body.insertAdjacentHTML('afterbegin', headerHTML()); }
    const existingFooter = document.querySelector('body > footer, .site-footer, .v32-footer, .ev-footer');
    if(existingFooter){ existingFooter.outerHTML = footerHTML(); }
    else { document.body.insertAdjacentHTML('beforeend', footerHTML()); }
    initMobileMenu();
  }
  function initMobileMenu(){
    const button = document.querySelector('.ev-menu-toggle');
    const menu = document.getElementById('mobile-menu-v33');
    if(!button || !menu) return;
    function close(){
      menu.classList.remove('is-open');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Ouvrir le menu');
      document.body.classList.remove('ev-menu-open');
    }
    function open(){
      menu.classList.add('is-open');
      button.setAttribute('aria-expanded','true');
      button.setAttribute('aria-label','Fermer le menu');
      document.body.classList.add('ev-menu-open');
    }
    button.addEventListener('click', function(event){
      event.stopPropagation();
      menu.classList.contains('is-open') ? close() : open();
    });
    menu.addEventListener('click', function(event){ if(event.target.closest('a')) close(); });
    document.addEventListener('click', function(event){ if(!menu.contains(event.target) && !button.contains(event.target)) close(); });
    document.addEventListener('keydown', function(event){ if(event.key === 'Escape') close(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountShell); else mountShell();
})();

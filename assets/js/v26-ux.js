/* PSSR V26 — micro-améliorations UX sans modifier les fonctionnalités existantes. */
(function(){
  const root = document.documentElement;

  // Lien d’évitement clavier.
  if(!document.querySelector('.skip-link-v26')){
    const skip = document.createElement('a');
    skip.className = 'skip-link-v26';
    skip.href = '#contenu';
    skip.textContent = 'Aller au contenu';
    document.body.prepend(skip);
  }

  // Garantit une cible principale pour l’accessibilité.
  const main = document.querySelector('main');
  if(main && !main.id) main.id = 'contenu';

  // État actif du menu selon la page courante.
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a[href]').forEach(link => {
    try{
      const url = new URL(link.getAttribute('href'), location.href);
      const file = url.pathname.split('/').pop() || 'index.html';
      if(file === current) link.setAttribute('aria-current','page');
    }catch(e){}
  });

  // Ferme le menu mobile après clic sur un lien.
  document.addEventListener('click', e => {
    const link = e.target.closest('.menu.open a, .menu.is-open a, .main-nav-short.open a, .main-nav-short.is-open a');
    if(!link) return;
    document.querySelectorAll('.menu.open,.menu.is-open,.main-nav-short.open,.main-nav-short.is-open').forEach(menu => menu.classList.remove('open','is-open'));
    document.querySelectorAll('.burger,.menu-burger-v15').forEach(btn => btn.setAttribute('aria-expanded','false'));
  });

  // Bouton retour haut discret.
  if(!document.querySelector('.back-to-top-v26')){
    const btn = document.createElement('button');
    btn.className = 'back-to-top-v26';
    btn.type = 'button';
    btn.setAttribute('aria-label','Retour en haut de page');
    btn.textContent = '↑';
    document.body.append(btn);
    btn.addEventListener('click', () => window.scrollTo({top:0, behavior: root.style.scrollBehavior === 'auto' ? 'auto' : 'smooth'}));
    const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 700);
    toggle();
    window.addEventListener('scroll', toggle, {passive:true});
  }

  // Empêche les doubles envois accidentels tout en gardant Firebase intact.
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
      const submit = form.querySelector('button[type="submit"], input[type="submit"]');
      if(!submit || submit.dataset.v26Lock === 'true') return;
      submit.dataset.v26Lock = 'true';
      setTimeout(() => { submit.dataset.v26Lock = 'false'; }, 3500);
    });
  });
})();

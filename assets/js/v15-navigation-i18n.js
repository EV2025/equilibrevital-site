/* V15 — burger menu + bouton FR/NL discret */
(function(){
  const dict = {
    'Accueil':'Start','PSSR':'PSSR','Parcours PSSR':'PSSR-traject','Activités & tarifs':'Activiteiten & tarieven','Ateliers':'Workshops','Ressources':'Bronnen','Contact':'Contact','Réserver':'Reserveren','Connexion':'Inloggen','Je m’inscris':'Ik schrijf me in','Déconnexion':'Uitloggen',
    'Accéder à l’espace membre':'Naar ledenruimte','Accéder à l’espace admin':'Naar beheerruimte','Mot de passe oublié ?':'Wachtwoord vergeten?','Envoyer le lien sécurisé':'Veilige link versturen','Retour espace membre':'Terug naar ledenruimte','Retour admin':'Terug naar admin',
    'Bouge ton corps,':'Beweeg je lichaam,','avance dans ta vie !':'vooruit in je leven!','Je rejoins le mouvement':'Ik doe mee','Réserver un cours collectif':'Groepsles reserveren','Demander un rendez-vous':'Afspraak aanvragen','Flyer':'Flyer',
    'confiance':'vertrouwen','santé':'gezondheid','équilibre':'evenwicht','Les ateliers':'Workshops','Apprenez':'Leren','Pratiquez':'Oefenen','Partagez':'Delen','Accompagnement socio-professionnel':'Socio-professionele begeleiding','Téléchargements':'Downloads','Contact':'Contact',
    'Réservation':'Reservatie','Réservation PSSR':'PSSR-reservatie','Nom complet':'Volledige naam','Email':'E-mail','Téléphone':'Telefoon','Message':'Bericht','Envoyer la demande':'Aanvraag versturen','Objectif principal':'Hoofddoel','Activité ou module souhaité':'Gewenste activiteit of module','Modules sélectionnés':'Geselecteerde modules',
    'Connexion membre':'Ledenlogin','Mon espace PSSR':'Mijn PSSR-ruimte','Bienvenue':'Welkom','Parcours personnel':'Persoonlijk traject','Étape actuelle':'Huidige stap','Présences':'Aanwezigheden','Code membre':'Ledencode','Voir mes modules':'Mijn modules bekijken','Faire une nouvelle demande':'Nieuwe aanvraag doen','Imprimer mon passeport':'Mijn paspoort afdrukken','Informations personnelles':'Persoonlijke gegevens','Mon dossier':'Mijn dossier','Suivi du parcours':'Trajectopvolging','Mes étapes PSSR':'Mijn PSSR-stappen','Mes demandes':'Mijn aanvragen','Mes réservations':'Mijn reservaties','Données personnelles':'Persoonsgegevens','Demander la suppression de mes données':'Verwijdering van mijn gegevens aanvragen',
    'Accès privé':'Privétoegang','Connexion au tableau de bord':'Inloggen op dashboard','Email admin':'Admin e-mail','Mot de passe':'Wachtwoord','Administration PSSR':'PSSR-beheer','Messages':'Berichten','Réservations':'Reservaties','Clients':'Deelnemers','Services':'Diensten','Calendrier':'Kalender','Paiements':'Betalingen','Notifications':'Meldingen','Contenu pages':'Pagina-inhoud','Présences':'Aanwezigheden','Statistiques':'Statistieken','Exporter CSV':'CSV exporteren',
    'Équilibre Vital asbl':'Équilibre Vital vzw','Plateforme socio-sportive d’accompagnement, d’inclusion et de remise en mouvement à Bruxelles-Capitale.':'Socio-sportief platform voor begeleiding, inclusie en beweging in het Brussels Hoofdstedelijk Gewest.','Bouger, reprendre confiance et avancer à son rythme.':'Bewegen, vertrouwen hervinden en op eigen tempo vooruitgaan.','Participer':'Meedoen','S’inscrire':'Inschrijven','Ateliers':'Workshops','Écoles & ATL':'Scholen & ATL','Formation & emploi':'Werk & inschakeling','Documents':'Documenten','FAQ':'FAQ','Contact & informations':'Contact & informatie','Informations de paiement':'Betalingsgegevens','Mentions légales':'Wettelijke vermeldingen','RGPD':'AVG','Politique de confidentialité':'Privacybeleid','Tous droits réservés.':'Alle rechten voorbehouden.'
  };
  const ph = {
    'votre@email.be':'uw@email.be','exemple@domaine.be':'voorbeeld@domein.be','Prénom Nom':'Voornaam Naam','Votre numéro de téléphone':'Uw telefoonnummer','Minimum 6 caractères':'Minimaal 6 tekens','Votre adresse complète':'Uw volledig adres'
  };
  function ensureBurger(header){
    if(!header) return;
    const nav = header.querySelector('.main-nav-short');
    if(!nav) return;
    nav.id = nav.id || 'site-menu-v15';
    if(!header.querySelector('.header-actions-v15')){
      const actions = document.createElement('div');
      actions.className = 'header-actions-v15';
      const lang = document.createElement('button'); lang.type='button'; lang.className='lang-toggle-v15'; lang.setAttribute('aria-label','Changer de langue'); lang.textContent='NL';
      const btn = document.createElement('button'); btn.type='button'; btn.className='menu-burger-v15'; btn.setAttribute('aria-label','Ouvrir le menu'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-controls',nav.id); btn.textContent='☰';
      actions.append(lang,btn); header.insertBefore(actions, nav);
    }
    if(!nav.querySelector('.nav-signup')){
      const prefix = location.pathname.includes('/admin/') || location.pathname.includes('/member/') || location.pathname.includes('/coach/') ? '../' : './';
      const signup=document.createElement('a'); signup.href=prefix+'inscription.html'; signup.className='nav-signup'; signup.textContent='Je m’inscris';
      nav.append(signup);
    }
  }
  document.querySelectorAll('.pssr-header').forEach(ensureBurger);
  const indexNav=document.getElementById('nav');
  if(indexNav){
    const inner=indexNav.querySelector('.inner');
    const burger=indexNav.querySelector('.burger');
    if(inner && !inner.querySelector('.lang-toggle-v15')){
      const lang=document.createElement('button'); lang.type='button'; lang.className='lang-toggle-v15'; lang.setAttribute('aria-label','Changer de langue'); lang.textContent='NL';
      if(burger) inner.insertBefore(lang, burger); else inner.appendChild(lang);
    }
  }
  function closeOthers(current){
    document.querySelectorAll('.main-nav-short.open,.main-nav-short.is-open,#nav .menu.open,#nav .menu.is-open').forEach(m=>{ if(m!==current) m.classList.remove('open','is-open'); });
    document.querySelectorAll('.menu-burger-v15,.burger').forEach(b=>{ if(!current || b.getAttribute('aria-controls')!==current.id) b.setAttribute('aria-expanded','false'); });
  }
  document.addEventListener('click', e=>{
    const btn=e.target.closest('.menu-burger-v15,.burger');
    if(btn){
      e.preventDefault();
      const id=btn.getAttribute('aria-controls') || 'menu';
      const menu=document.getElementById(id) || btn.closest('header,nav')?.querySelector('.main-nav-short,.menu');
      if(!menu) return;
      const willOpen=!menu.classList.contains('open') && !menu.classList.contains('is-open');
      closeOthers(menu);
      menu.classList.toggle('open',willOpen); menu.classList.toggle('is-open',willOpen);
      btn.setAttribute('aria-expanded',String(willOpen));
      return;
    }
    if(!e.target.closest('.pssr-header,#nav')) closeOthers(null);
  });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeOthers(null); });
  function storeFr(el){ if(!el.dataset.fr) el.dataset.fr=el.textContent.trim(); }
  function applyLang(lang){
    document.documentElement.lang = lang === 'nl' ? 'nl' : 'fr';
    document.querySelectorAll('.lang-toggle-v15').forEach(b=>{ b.textContent = lang === 'nl' ? 'FR' : 'NL'; });
    document.querySelectorAll('a,button,h1,h2,h3,h4,p,span,strong,label,summary,li,td,th,option,small').forEach(el=>{
      const hasElementChild=[...el.childNodes].some(n=>n.nodeType===1 && !['BR'].includes(n.nodeName));
      if(hasElementChild) return;
      const t=el.dataset.fr || el.textContent.trim();
      if(!t) return;
      if(dict[t]){ storeFr(el); el.textContent = lang==='nl' ? dict[t] : el.dataset.fr; }
    });
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{
      if(!el.dataset.frPlaceholder) el.dataset.frPlaceholder=el.getAttribute('placeholder')||'';
      const t=el.dataset.frPlaceholder;
      el.setAttribute('placeholder', lang==='nl' && ph[t] ? ph[t] : t);
    });
    try{localStorage.setItem('pssr-lang',lang);}catch(e){}
  }
  document.addEventListener('click', e=>{
    const langBtn=e.target.closest('.lang-toggle-v15');
    if(!langBtn) return;
    const current=document.documentElement.lang==='nl'?'nl':'fr';
    applyLang(current==='nl'?'fr':'nl');
  });
  let saved='fr'; try{saved=localStorage.getItem('pssr-lang')||'fr';}catch(e){}
  if(saved==='nl') applyLang('nl'); else document.querySelectorAll('.lang-toggle-v15').forEach(b=>b.textContent='NL');
})();

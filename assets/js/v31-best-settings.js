// V31 — expérience utilisateur globale légère, sans dépendance.
(function(){
  function ready(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    document.documentElement.classList.add('v31-ready');

    // Menu burger : robuste même si plusieurs anciennes classes existent.
    var burgers = document.querySelectorAll('.menu-burger-v15, [aria-controls="site-menu-v15"]');
    burgers.forEach(function(btn){
      var targetId = btn.getAttribute('aria-controls') || 'site-menu-v15';
      var menu = document.getElementById(targetId);
      if(!menu) return;
      btn.addEventListener('click', function(){
        var open = menu.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){
          menu.classList.remove('is-open');
          btn.setAttribute('aria-expanded','false');
        });
      });
    });

    // Active link simple.
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a[href]').forEach(function(a){
      var href = a.getAttribute('href') || '';
      var clean = href.split('#')[0].split('?')[0].split('/').pop() || 'index.html';
      if(clean === path) a.setAttribute('aria-current','page');
    });

    // Amélioration images.
    document.querySelectorAll('img').forEach(function(img){
      if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
      if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
    });

    // Empêche les doubles clics rapides sur les soumissions, mais sans bloquer durablement.
    document.querySelectorAll('form').forEach(function(form){
      form.addEventListener('submit', function(){
        var submit = form.querySelector('button[type="submit"], input[type="submit"]');
        if(submit){
          submit.setAttribute('aria-busy','true');
          setTimeout(function(){ submit.removeAttribute('aria-busy'); }, 3500);
        }
      });
    });

    // Retour en haut discret.
    var back = document.createElement('a');
    back.href = '#';
    back.className = 'v31-backtop';
    back.setAttribute('aria-label','Retour en haut');
    back.textContent = '↑';
    document.body.appendChild(back);
    window.addEventListener('scroll', function(){
      back.classList.toggle('is-visible', window.scrollY > 700);
    }, {passive:true});
  });
})();

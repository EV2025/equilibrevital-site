/* V41 — Burger robuste. S'exécute après la V39 et prend la main uniquement sur le menu mobile. */
(function(){
  'use strict';

  function getMenu(button){
    var id = button && button.getAttribute('aria-controls');
    return id ? document.getElementById(id) : document.getElementById('mobile-menu-v39');
  }

  function setMenuState(button, menu, open){
    if(!button || !menu) return;
    if(open){
      menu.hidden = false;
      menu.removeAttribute('hidden');
      menu.classList.add('is-open');
      button.setAttribute('aria-expanded','true');
      button.setAttribute('aria-label','Fermer le menu');
      button.classList.add('is-open');
      document.body.classList.add('ev41-menu-open');
      document.body.classList.add('ev39-menu-open');
    }else{
      menu.classList.remove('is-open');
      menu.hidden = true;
      menu.setAttribute('hidden','');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Ouvrir le menu');
      button.classList.remove('is-open');
      document.body.classList.remove('ev41-menu-open');
      document.body.classList.remove('ev39-menu-open');
    }
  }

  function initBurger(){
    var buttons = document.querySelectorAll('.ev39-menu-toggle, .ev-menu-toggle, [aria-controls="mobile-menu-v39"]');
    buttons.forEach(function(button){
      if(button.dataset.ev41Burger === 'ready') return;
      var menu = getMenu(button);
      if(!menu) return;

      button.dataset.ev41Burger = 'ready';
      menu.classList.remove('is-open');
      menu.hidden = true;
      menu.setAttribute('hidden','');
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Ouvrir le menu');
      button.classList.remove('is-open');

      button.addEventListener('click', function(event){
        event.preventDefault();
        event.stopPropagation();
        if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        var isOpen = button.getAttribute('aria-expanded') === 'true' || menu.classList.contains('is-open') || !menu.hidden;
        setMenuState(button, menu, !isOpen);
      }, true);

      menu.addEventListener('click', function(event){
        if(event.target.closest('a')) setMenuState(button, menu, false);
      });

      document.addEventListener('click', function(event){
        if(menu.classList.contains('is-open') && !menu.contains(event.target) && !button.contains(event.target)){
          setMenuState(button, menu, false);
        }
      });

      document.addEventListener('keydown', function(event){
        if(event.key === 'Escape' && menu.classList.contains('is-open')){
          setMenuState(button, menu, false);
          button.focus({preventScroll:true});
        }
      });

      window.addEventListener('resize', function(){
        if(window.matchMedia('(min-width: 981px)').matches){
          setMenuState(button, menu, false);
        }
      });
    });
  }

  function init(){
    initBurger();
    // La V39 injecte le header au chargement. Cette seconde passe couvre les cas où l'injection arrive juste après.
    window.setTimeout(initBurger, 80);
    window.setTimeout(initBurger, 300);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

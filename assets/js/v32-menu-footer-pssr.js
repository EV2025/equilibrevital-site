
(function(){
  function initMenu(){
    const btn = document.querySelector('.v32-burger');
    const nav = document.getElementById('site-menu-v32');
    if(!btn || !nav) return;
    function close(){ nav.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open-v32'); }
    function open(){ nav.classList.add('is-open'); btn.setAttribute('aria-expanded','true'); document.body.classList.add('menu-open-v32'); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); nav.classList.contains('is-open') ? close() : open(); });
    nav.addEventListener('click', function(e){ if(e.target.closest('a')) close(); });
    document.addEventListener('click', function(e){ if(!nav.contains(e.target) && !btn.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMenu); else initMenu();
})();

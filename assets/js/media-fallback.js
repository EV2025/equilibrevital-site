(function(){
  const script = document.currentScript;
  const fallback = script?.dataset?.fallback || new URL('../img/media-manquante.svg', script?.src || location.href).href;
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = '1';
      img.classList.add('missing-media');
      img.src = fallback;
      img.alt = img.alt || 'Média à placer dans wp-content/uploads';
    }, { once:true });
  });
})();

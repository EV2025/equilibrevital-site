(function(){
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {scope:'/'}).catch(error => console.warn('PWA registration:', error));
  }, {once:true});
})();

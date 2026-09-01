(function () {
  const target = document.getElementById('reservation-msg');
  if (!target) return;

  const addInvitation = () => {
    const receipt = target.querySelector('.receipt-card-v58');
    if (!receipt || receipt.querySelector('[data-pwa-receipt-promo]')) return;
    const promo = document.createElement('aside');
    promo.className = 'pwa-promo-v1';
    promo.dataset.pwaReceiptPromo = '';
    promo.innerHTML = '<h3>Suivez votre réservation sur votre téléphone</h3><p>Installez gratuitement l’application Équilibre Vital pour retrouver vos activités et votre parcours PSSR.</p><div class="pwa-promo-actions-v1"><button class="btn" data-install-app type="button">Installer l’application</button><a class="btn secondary" href="./application.html">Ouvrir l’application</a></div><p class="pwa-promo-help-v1" data-install-status hidden aria-live="polite"></p>';
    receipt.appendChild(promo);
  };

  new MutationObserver(addInvitation).observe(target, {childList: true, subtree: true});
  addInvitation();
})();

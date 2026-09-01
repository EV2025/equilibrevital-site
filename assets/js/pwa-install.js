(function () {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let installPrompt = null;

  const installButtons = () => Array.from(document.querySelectorAll('[data-install-app]'));
  const statusNodes = () => Array.from(document.querySelectorAll('[data-install-status]'));
  const setStatus = message => statusNodes().forEach(node => {
    node.textContent = message;
    node.hidden = !message;
  });
  const hideButtons = () => installButtons().forEach(button => button.hidden = true);
  const showButtons = () => installButtons().forEach(button => button.hidden = false);

  if (standalone) {
    hideButtons();
    setStatus('L’application est installée sur cet appareil.');
    return;
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    showButtons();
  });

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-install-app]');
    if (!button) return;
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      installPrompt = null;
      if (choice.outcome === 'accepted') {
        hideButtons();
        setStatus('Installation en cours…');
      }
      return;
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setStatus(isIOS
      ? 'Sur iPhone ou iPad : ouvrez le menu Partager, puis choisissez « Sur l’écran d’accueil ».'
      : 'Ouvrez le menu de votre navigateur, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».');
  });

  window.addEventListener('appinstalled', () => {
    hideButtons();
    setStatus('Application installée. Vous pouvez maintenant l’ouvrir depuis votre écran d’accueil.');
  });
})();

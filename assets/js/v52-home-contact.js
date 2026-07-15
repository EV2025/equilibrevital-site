// V52 — formulaire contact accueil statique
(function () {
  function encode(value) {
    return encodeURIComponent(value || '').replace(/%20/g, '+');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('home-contact-form-v52');
    if (!form) return;

    var confirm = document.getElementById('home-contact-confirm-v52');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var name = data.get('name') || '';
      var email = data.get('email') || '';
      var phone = data.get('phone') || 'Non renseigné';
      var subject = data.get('subject') || 'Question depuis le site PSSR';
      var message = data.get('message') || '';

      var body = [
        'Nom : ' + name,
        'Email : ' + email,
        'Téléphone : ' + phone,
        'Sujet : ' + subject,
        '',
        'Message :',
        message
      ].join('\n');

      if (confirm) {
        confirm.hidden = false;
      }

      window.location.href = 'mailto:equilibrevital.bruxelles@gmail.com?subject=' + encode(subject) + '&body=' + encode(body);
    });
  });
})();

(function(){
  const style = document.createElement('style');
  style.textContent = `
    .password-control-v82{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;width:100%;margin-top:6px}
    .password-control-v82 input{width:100%;min-width:0;margin:0!important;font-size:16px}
    .password-toggle-v82{min-height:44px;padding:8px 13px;border:1px solid rgba(124,58,237,.28);border-radius:12px;background:#fff;color:#5b21b6;font:800 .88rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
    .password-toggle-v82:focus-visible{outline:3px solid rgba(217,46,131,.28);outline-offset:2px}
    @media(max-width:420px){.password-control-v82{grid-template-columns:1fr}.password-toggle-v82{width:100%}}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('input[type="password"]').forEach((input, index) => {
    if (input.closest('.password-control-v82')) return;
    if (!input.id) input.id = `password-field-v82-${index + 1}`;
    const wrapper = document.createElement('span');
    wrapper.className = 'password-control-v82';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle-v82';
    button.textContent = 'Afficher';
    button.setAttribute('aria-controls', input.id);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Afficher le mot de passe');
    button.addEventListener('click', () => {
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Masquer' : 'Afficher';
      button.setAttribute('aria-pressed', String(reveal));
      button.setAttribute('aria-label', reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      input.focus({preventScroll:true});
    });
    wrapper.appendChild(button);
  });
})();

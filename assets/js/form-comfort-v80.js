document.querySelectorAll('form.form-comfort-v80').forEach(form => {
  const controls = Array.from(form.querySelectorAll('input,select,textarea')).filter(field => {
    const type = (field.type || '').toLowerCase();
    return field.name !== 'website' && !['hidden','submit','button','reset'].includes(type);
  });
  controls.forEach(field => {
    if (field.name === 'email' && !field.autocomplete) field.autocomplete = 'email';
    if (['tel','phone','telephone'].includes(field.name) && !field.autocomplete) field.autocomplete = 'tel';
    if (['tel','phone','telephone'].includes(field.name) && !field.inputMode) field.inputMode = 'tel';
    const label = field.closest('label');
    if (field.required && label && !label.querySelector('.form-required-v80')){
      const marker = document.createElement('span');
      marker.className = 'form-required-v80';
      marker.textContent = '*';
      marker.setAttribute('aria-hidden','true');
      label.insertBefore(marker, field);
    }
  });

  const required = controls.filter(field => field.required);
  if (required.length){
    const progress = document.createElement('div');
    progress.className = 'form-progress-v80';
    progress.setAttribute('aria-live','polite');
    progress.innerHTML = '<div class="form-progress-track-v80" aria-hidden="true"><span class="form-progress-bar-v80"></span></div><small></small>';
    const anchor = form.querySelector('fieldset,.form-step-title,.ev39-form-section,label');
    if (anchor) anchor.insertAdjacentElement('beforebegin', progress);
    else form.prepend(progress);
    const updateProgress = () => {
      const completed = required.filter(field => field.type === 'checkbox' ? field.checked : field.checkValidity() && String(field.value || '').trim()).length;
      const percent = Math.round((completed / required.length) * 100);
      progress.querySelector('.form-progress-bar-v80').style.width = percent + '%';
      progress.querySelector('small').textContent = completed === required.length
        ? 'Informations essentielles complétées.'
        : completed + ' champ' + (completed > 1 ? 's' : '') + ' essentiel' + (completed > 1 ? 's' : '') + ' complété' + (completed > 1 ? 's' : '') + ' sur ' + required.length + '.';
    };
    controls.forEach(field => {
      field.addEventListener('input', updateProgress);
      field.addEventListener('change', updateProgress);
      field.addEventListener('blur', () => field.classList.toggle('is-invalid-v80', Boolean(field.required && !field.checkValidity())));
    });
    updateProgress();
  }

  form.addEventListener('invalid', event => {
    event.target.classList.add('is-invalid-v80');
    const details = event.target.closest('details');
    if (details) details.open = true;
  }, true);
});

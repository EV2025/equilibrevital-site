(function(){
  'use strict';

  const script = document.currentScript;
  const dataUrl = script?.dataset?.programmesSrc || './assets/data/programmes-v84.json';
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function list(items){
    return `<ul>${(items || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  function renderProgramme(programme){
    const detailsId = `programme-details-${programme.id}`;
    const perspective = programme.perspective
      ? `<aside class="programme-perspective-v84"><h4>Et si je veux aller plus loin ?</h4><p>${esc(programme.perspective)}</p></aside>`
      : '';
    return `<article class="programme-card-v84 programme-${esc(programme.universe)}-v84" id="${esc(programme.id)}">
      <div class="programme-card-top-v84">
        <div class="programme-schedule-v94">
          <p class="programme-day-v84">${esc(programme.day)}</p>
          <p class="programme-time-v94">${esc(programme.time)}</p>
        </div>
        <span class="programme-audience-v84">${esc(programme.audience)}</span>
      </div>
      <h3>${esc(programme.name)}</h3>
      ${programme.activities?.length ? `<p class="programme-activities-v94">${programme.activities.map(esc).join(' <span aria-hidden="true">•</span> ')}</p>` : ''}
      <div class="programme-actions-v84">
        <button aria-controls="${detailsId}" aria-expanded="false" class="btn secondary" data-programme-toggle="${detailsId}" type="button">Découvrir</button>
        <a class="btn" href="./reservation.html?programme=${encodeURIComponent(programme.id)}">S’inscrire</a>
      </div>
      <section class="programme-details-v84" hidden id="${detailsId}">
        <p class="programme-hook-v84">${esc(programme.hook)}</p>
        <p>${esc(programme.shortDescription)}</p>
        <div class="programme-highlights-v84">${programme.highlights.map(item => `<span>${esc(item)}</span>`).join('')}</div>
        <h4>Un créneau socio-sportif complet</h4>
        <p>Les deux heures forment un seul programme. Le contenu s’adapte à la séance, au groupe et à la progression des participants.</p>
        <div class="programme-detail-columns-v84">
          <div><h4>Le programme peut associer</h4>${list(programme.contents)}</div>
          <div><h4>Objectifs sportifs</h4>${list(programme.sportsObjectives)}</div>
          <div><h4>Dimensions personnelles et sociales</h4>${list(programme.transverseDimensions)}</div>
        </div>
        ${perspective}
      </section>
    </article>`;
  }

  function wireProgrammeDetails(container){
    container.querySelectorAll('[data-programme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        const details = document.getElementById(button.dataset.programmeToggle);
        if (!details) return;
        const opening = details.hidden;
        details.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
        button.textContent = opening ? 'Réduire' : 'Découvrir';
        if (opening) details.scrollIntoView({behavior:'smooth', block:'nearest'});
      });
    });
  }

  function renderActivities(data){
    const container = document.getElementById('programmes-grid');
    if (!container) return;
    container.innerHTML = data.programmes.map(renderProgramme).join('');
    wireProgrammeDetails(container);
    const fee = document.querySelector('[data-programme-fee]');
    if (fee && data.annualFee) fee.textContent = `${data.annualFee} € / année académique`;
    const structured = document.getElementById('programme-structured-data');
    if (structured){
      structured.textContent = JSON.stringify({
        '@context':'https://schema.org',
        '@type':'ItemList',
        name:'Programmes Équilibre Vital',
        itemListElement:data.programmes.map((programme, index) => ({
          '@type':'ListItem',
          position:index + 1,
          item:{
            '@type':'Service',
            name:programme.name,
            description:programme.shortDescription,
            audience:{'@type':'Audience', audienceType:programme.audience}
          }
        }))
      });
    }
  }

  function programmeOption(programme){
    const option = document.createElement('option');
    option.value = programme.reservationLabel;
    option.textContent = `${programme.day} ${programme.time} — ${programme.name} — ${programme.audience}`;
    option.dataset.programmeId = programme.id;
    option.dataset.modules = programme.modulesLabel;
    return option;
  }

  function populateReservation(data){
    const group = document.getElementById('programme-options');
    if (!group) return;
    group.replaceChildren(...data.programmes.map(programmeOption));
  }

  function prefillReservation(){
    const form = document.getElementById('reservation-form');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const programmeId = params.get('programme') || '';
    const modules = params.get('modules') || params.get('module') || '';
    const select = form.elements.creneau;
    const modulesField = form.elements.modules;
    const options = Array.from(select?.options || []);
    let found = programmeId ? options.find(option => option.dataset.programmeId === programmeId) : null;
    if (!found && modules){
      const decoded = modules.replace(/\s*,\s*/g, ', ');
      const first = decoded.split(',')[0].trim();
      found = options.find(option => option.textContent.includes(first) || first.includes(option.textContent));
      if (!found && select){
        found = new Option(first, first, true, true);
        select.add(found);
      }
    }
    if (!found) return;
    select.value = found.value;
    if (modulesField) modulesField.value = found.dataset.modules || modules || found.textContent.trim();
  }

  fetch(dataUrl, {credentials:'same-origin'})
    .then(response => {
      if (!response.ok) throw new Error(`Programmes indisponibles (${response.status})`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.programmes) || !data.programmes.length) throw new Error('Liste de programmes invalide');
      renderActivities(data);
      populateReservation(data);
      prefillReservation();
    })
    .catch(error => {
      console.error('Programmes:', error);
      prefillReservation();
      const status = document.getElementById('programmes-status');
      if (status) status.textContent = 'Les informations détaillées sont momentanément indisponibles. Les créneaux essentiels restent accessibles ci-dessous.';
    });
})();

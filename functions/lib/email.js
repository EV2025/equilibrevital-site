"use strict";

function clean(value, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 3000).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function validEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean(value, 180));
}

function reservationView(data = {}, reservationId = "") {
  return {
    id: clean(reservationId, 160),
    code: clean(data.reservationCode || data.trackingCode || reservationId, 160),
    name: clean(data.nom || data.name, 120),
    email: clean(data.email, 180).toLowerCase(),
    phone: clean(data.tel || data.telephone || data.phone, 60),
    activity: clean(data.creneau || data.modules || data.objectif || "À préciser", 500),
  };
}

function sharedSender(config) {
  return {
    sender: {name: clean(config.senderName, 70), email: clean(config.senderEmail, 180)},
    replyTo: {name: clean(config.adminName || config.senderName, 70), email: clean(config.adminEmail, 180)},
    tags: ["reservation-pssr"],
  };
}

function adminEmail(reservation, config) {
  const dashboardUrl = `${clean(config.siteUrl, 240).replace(/\/$/, "")}/admin/`;
  return {
    ...sharedSender(config),
    to: [{email: clean(config.adminEmail, 180), name: clean(config.adminName, 70)}],
    replyTo: {email: reservation.email, name: reservation.name},
    subject: `Nouvelle réservation PSSR — ${reservation.code}`,
    textContent: [
      "Une nouvelle réservation a été enregistrée.",
      `Référence : ${reservation.code}`,
      `Nom : ${reservation.name}`,
      `E-mail : ${reservation.email}`,
      `Téléphone : ${reservation.phone || "Non renseigné"}`,
      `Activité : ${reservation.activity}`,
      `Suivi sécurisé : ${dashboardUrl}`,
    ].join("\n"),
    htmlContent: `
      <h1>Nouvelle réservation PSSR</h1>
      <p>Une nouvelle demande a été enregistrée dans Firebase.</p>
      <table role="presentation" cellpadding="7">
        <tr><th align="left">Référence</th><td><strong>${escapeHtml(reservation.code)}</strong></td></tr>
        <tr><th align="left">Nom</th><td>${escapeHtml(reservation.name)}</td></tr>
        <tr><th align="left">E-mail</th><td>${escapeHtml(reservation.email)}</td></tr>
        <tr><th align="left">Téléphone</th><td>${escapeHtml(reservation.phone || "Non renseigné")}</td></tr>
        <tr><th align="left">Activité</th><td>${escapeHtml(reservation.activity)}</td></tr>
      </table>
      <p><a href="${escapeHtml(dashboardUrl)}">Ouvrir le tableau de bord sécurisé</a></p>
      <p>Les autres informations restent consultables dans Firebase et ne sont pas reproduites dans cet e-mail.</p>
    `,
  };
}

function participantEmail(reservation, config) {
  const siteUrl = clean(config.siteUrl, 240).replace(/\/$/, "");
  return {
    ...sharedSender(config),
    to: [{email: reservation.email, name: reservation.name}],
    subject: `Votre réservation Équilibre Vital — ${reservation.code}`,
    textContent: [
      `Bonjour ${reservation.name},`,
      "Votre demande de réservation a bien été enregistrée.",
      `Référence : ${reservation.code}`,
      `Activité : ${reservation.activity}`,
      "Statut : reçue, en attente de vérification par notre équipe.",
      `Site : ${siteUrl}`,
    ].join("\n"),
    htmlContent: `
      <h1>Réservation bien reçue</h1>
      <p>Bonjour ${escapeHtml(reservation.name)},</p>
      <p>Votre demande a bien été enregistrée. L’équipe Équilibre Vital vérifiera la disponibilité et vous recontactera.</p>
      <p><strong>Référence :</strong> ${escapeHtml(reservation.code)}<br>
      <strong>Activité :</strong> ${escapeHtml(reservation.activity)}<br>
      <strong>Statut :</strong> reçue, en attente de vérification</p>
      <p>Conservez cette référence pour tout échange avec notre équipe.</p>
      <p><a href="${escapeHtml(siteUrl)}">Accéder au site Équilibre Vital</a></p>
    `,
  };
}

module.exports = {
  adminEmail,
  escapeHtml,
  participantEmail,
  reservationView,
  validEmail,
};

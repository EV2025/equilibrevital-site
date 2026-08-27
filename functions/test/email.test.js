"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  adminEmail,
  participantEmail,
  reservationView,
  validEmail,
} = require("../lib/email");

const config = {
  adminEmail: "admin@example.test",
  adminName: "Équilibre Vital",
  senderEmail: "notifications@example.test",
  senderName: "Équilibre Vital",
  siteUrl: "https://equilibrevital.be",
};

test("normalise une réservation existante", () => {
  const reservation = reservationView({
    nom: "Marie Dupont",
    email: "Marie@Example.Test",
    tel: "0490 00 00 00",
    creneau: "Fitness loisirs",
    reservationCode: "PSSR-RES-20260827-ABCD",
  }, "document-id");

  assert.equal(reservation.email, "marie@example.test");
  assert.equal(reservation.activity, "Fitness loisirs");
  assert.equal(reservation.code, "PSSR-RES-20260827-ABCD");
});

test("échappe les valeurs injectées dans les modèles", () => {
  const reservation = reservationView({
    nom: "<script>alert(1)</script>",
    email: "participant@example.test",
    creneau: "Boxe & mobilité",
    reservationCode: "PSSR-RES-20260827-TEST",
  });
  const message = participantEmail(reservation, config);

  assert.doesNotMatch(message.htmlContent, /<script>/);
  assert.match(message.htmlContent, /&lt;script&gt;/);
  assert.match(message.textContent, /PSSR-RES-20260827-TEST/);
});

test("prépare le suivi administratif sans données bancaires", () => {
  const reservation = reservationView({
    nom: "Participant",
    email: "participant@example.test",
    tel: "0490 00 00 00",
    modules: "Coaching individuel",
    trackingCode: "PSSR-RES-20260827-SUIV",
  });
  const message = adminEmail(reservation, config);

  assert.match(message.htmlContent, /tableau de bord sécurisé/);
  assert.doesNotMatch(message.htmlContent, /IBAN|BIC|carte bancaire/i);
  assert.equal(message.replyTo.email, "participant@example.test");
});

test("valide les adresses e-mail attendues", () => {
  assert.equal(validEmail("personne@example.test"), true);
  assert.equal(validEmail("adresse-invalide"), false);
});

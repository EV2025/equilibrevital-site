"use strict";

const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");
const {defineSecret, defineString} = require("firebase-functions/params");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {
  adminEmail,
  participantEmail,
  reservationView,
  validEmail,
} = require("./lib/email");

initializeApp();

const BREVO_API_KEY = defineSecret("BREVO_API_KEY");
const ADMIN_EMAIL = defineString("ADMIN_EMAIL");
const SENDER_EMAIL = defineString("SENDER_EMAIL");
const SENDER_NAME = defineString("SENDER_NAME", {default: "Équilibre Vital"});
const SITE_URL = defineString("SITE_URL", {default: "https://equilibrevital.be"});

async function sendWithBrevo(message) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": BREVO_API_KEY.value(),
      "content-type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Brevo ${response.status}: ${detail}`);
  }
  return response.json();
}

exports.notifyNewReservation = onDocumentCreated({
  document: "reservations/{reservationId}",
  region: "europe-west1",
  secrets: [BREVO_API_KEY],
  retry: false,
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const reservation = reservationView(snapshot.data(), event.params.reservationId);
  const config = {
    adminEmail: ADMIN_EMAIL.value(),
    adminName: SENDER_NAME.value(),
    senderEmail: SENDER_EMAIL.value(),
    senderName: SENDER_NAME.value(),
    siteUrl: SITE_URL.value(),
  };

  if (!validEmail(reservation.email)) {
    await snapshot.ref.set({
      notificationStatus: "ignorée",
      notificationError: "Adresse e-mail du participant invalide",
      notificationUpdatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    logger.warn("Réservation sans adresse e-mail valide", {reservationId: reservation.id});
    return;
  }

  if (!validEmail(config.adminEmail) || !validEmail(config.senderEmail)) {
    throw new Error("ADMIN_EMAIL ou SENDER_EMAIL est absent ou invalide.");
  }

  const db = getFirestore();
  const logRef = db.collection("emailLogs").doc(event.id);
  await snapshot.ref.set({
    notificationStatus: "envoi en cours",
    notificationUpdatedAt: FieldValue.serverTimestamp(),
  }, {merge: true});

  try {
    const adminResult = await sendWithBrevo(adminEmail(reservation, config));
    await snapshot.ref.set({
      adminNotificationSentAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    const participantResult = await sendWithBrevo(participantEmail(reservation, config));
    await snapshot.ref.set({
      notificationStatus: "envoyée",
      userConfirmationSentAt: FieldValue.serverTimestamp(),
      notificationUpdatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    await logRef.set({
      reservationId: reservation.id,
      reservationCode: reservation.code,
      type: "reservation_created",
      status: "envoyé",
      adminMessageId: adminResult.messageId || null,
      participantMessageId: participantResult.messageId || null,
      createdAt: FieldValue.serverTimestamp(),
    });
    logger.info("Notifications de réservation envoyées", {reservationId: reservation.id});
  } catch (error) {
    const safeError = String(error?.message || error).slice(0, 500);
    await snapshot.ref.set({
      notificationStatus: "échec",
      notificationError: safeError,
      notificationUpdatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});
    await logRef.set({
      reservationId: reservation.id,
      reservationCode: reservation.code,
      type: "reservation_created",
      status: "échec",
      error: safeError,
      createdAt: FieldValue.serverTimestamp(),
    });
    logger.error("Échec des notifications de réservation", {
      reservationId: reservation.id,
      error: safeError,
    });
  }
});

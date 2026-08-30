// Configuration Firebase du site PSSR.
// Projet Firebase : PSSR Site Web / pssr-site-web
// Site officiel : https://equilibrevital.be/

export const firebaseConfig = {
  apiKey: "AIzaSyBdBiJqKc3TIugS139kNad_T61f8Ea4ayc",
  authDomain: "pssr-site-web.firebaseapp.com",
  projectId: "pssr-site-web",
  storageBucket: "pssr-site-web.firebasestorage.app",
  messagingSenderId: "309935983079",
  appId: "1:309935983079:web:f97d879f897e8173b75542",
  measurementId: "G-FQ8CEFLEB2"
};

export const siteConfig = {
  siteUrl: "https://equilibrevital.be/",
  contactEmail: "equilibrevital.bruxelles@gmail.com"
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("<") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("<") &&
  firebaseConfig.appId &&
  !firebaseConfig.appId.includes("<")
);

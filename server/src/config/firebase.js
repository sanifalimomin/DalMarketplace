const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// In production (Render) the service account is passed as a JSON-string env var, so no
// credential file is committed/baked into the image. Locally we fall back to the
// git-ignored file at server/.firebase/serviceAccount.json.
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  return require('../../.firebase/serviceAccount.json');
}

initializeApp({
  credential: cert(loadServiceAccount()),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true }); // Ignore undefined so login by bannerId works when other fields are absent

module.exports = { db };

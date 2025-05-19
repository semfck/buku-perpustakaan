const admin = require('firebase-admin');

// Ganti {PATH_TO_SERVICE_ACCOUNT_JSON} dengan path ke file service account key kamu
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Ganti UID di bawah ini dengan UID akun admin yang ingin diberi claim admin: true
const uid = '3vpTcKRuqOctbIvMvzLZDwBC1Nb2';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Custom claim admin: true berhasil diset untuk UID ${uid}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error('Gagal set custom claim:', e);
    process.exit(1);
  });
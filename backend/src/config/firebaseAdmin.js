const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

require("dotenv").config();

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });

const auth = getAuth(firebaseApp);

module.exports = auth;
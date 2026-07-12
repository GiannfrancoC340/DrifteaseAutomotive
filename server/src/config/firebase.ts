import { initializeApp, cert, getApps } from 'firebase-admin/app';
import dotenv from 'dotenv';

dotenv.config();

// Only initialize once - prevents "app already exists" errors if this
// module gets imported in multiple places (which it will).
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key comes from env as a single line with literal \n's -
      // this replace is required or Firebase will reject the key format.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
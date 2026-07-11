import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

// Extend Express's Request type so req.user is typed everywhere you use it
export interface AuthedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

/**
 * Verifies the Firebase ID token sent from the frontend and attaches
 * { uid, email } to req.user. The frontend needs to send the token as:
 *
 *   Authorization: Bearer <idToken>
 *
 * Get the token client-side with: await firebase.auth().currentUser.getIdToken()
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Missing auth token' });
    return;
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
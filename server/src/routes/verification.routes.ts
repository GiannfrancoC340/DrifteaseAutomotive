import { Router } from 'express';
import {
  createVerificationSession,
  getVerificationStatus,
} from '../controllers/verification.controller';

import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/create-session', requireAuth, createVerificationSession);
router.get('/status', requireAuth, getVerificationStatus);

export default router;
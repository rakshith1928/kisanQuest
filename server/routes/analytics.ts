import { Router } from 'express';
import { trackEvent } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Track events (optional auth to allow logging onboarding events before register)
// Need to handle missing token if we want anonymous events
router.post('/event', trackEvent as any);

export default router;

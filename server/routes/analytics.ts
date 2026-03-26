import { Router } from 'express';
import { trackEvent, getPlayerEvents, getPopularEvents, getEventsOverTime } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Track events (optional auth to allow logging onboarding events before register)
// Need to handle missing token if we want anonymous events
router.post('/event', authenticateToken, trackEvent as any);

router.get('/player/:id', authenticateToken, getPlayerEvents as any);
router.get('/popular', getPopularEvents as any);
router.get('/timeline', getEventsOverTime as any);

export default router;

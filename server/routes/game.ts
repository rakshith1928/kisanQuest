import { Router } from 'express';
import { syncGameState, getLeaderboard } from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/sync', authenticateToken as any, syncGameState as any);
router.get('/leaderboard', getLeaderboard);

export default router;

import { Router } from 'express';
import { processSTT, processTTS } from '../controllers/voiceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Voice requires authentication in production to prevent abuse
router.post('/stt', authenticateToken as any, processSTT as any);
router.post('/tts', authenticateToken as any, processTTS as any);

export default router;

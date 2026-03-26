import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const trackEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventName, eventData } = req.body;
    const playerId = req.playerId;

    if (!eventName) {
      return res.status(400).json({ error: 'Event name required' });
    }

    // In a prod app, send to Mixpanel, Amplitude, or log to DB.
    console.log(`[Analytics] [Player: ${playerId || 'anonymous'}] Event: ${eventName}`, eventData);

    res.status(200).json({ message: 'Event logged successfully' });
  } catch (error) {
    console.error('Analytics track error:', error);
    res.status(500).json({ error: 'Failed to log analytics event' });
  }
};

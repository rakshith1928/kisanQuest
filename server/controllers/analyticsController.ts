import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Analytics from '../models/Analytics';

export const trackEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventName, eventData } = req.body;
    const playerId = req.playerId || 'anonymous';

    if (!eventName) {
      return res.status(400).json({ error: 'Event name required' });
    }

    // Save to MongoDB
    const event = await Analytics.create({
      playerId,
      eventName,
      eventData
    });

    console.log('[Analytics Saved]', event);

    res.status(200).json({ message: 'Event saved successfully' });
  } catch (error) {
    console.error('Analytics track error:', error);
    res.status(500).json({ error: 'Failed to log analytics event' });
  }
};

export const getPlayerEvents = async (req: AuthRequest, res: Response) => {
  try {
    const playerId = req.params.id;

    const events = await Analytics.find({ playerId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getPopularEvents = async (req: Request, res: Response) => {
  try {
    const result = await Analytics.aggregate([
      {
        $group: {
          _id: "$eventName",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular events' });
  }
};

export const getEventsOverTime = async (req: Request, res: Response) => {
  try {
    const result = await Analytics.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.month": 1, "_id.day": 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};



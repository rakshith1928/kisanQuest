import { Request, Response } from 'express';
import GameState from '../models/GameState';
import Player from '../models/Player';
import { AuthRequest } from '../middleware/auth';

export const syncGameState = async (req: AuthRequest, res: Response) => {
  try {
    const { state } = req.body;
    const playerId = req.playerId;

    if (!state) {
      return res.status(400).json({ error: 'No state provided for sync' });
    }

    // Upsert the game state
    const updatedState = await GameState.findOneAndUpdate(
      { playerId },
      { $set: state },
      { new: true, upsert: true }
    );

    // Update player lastSyncAt
    await Player.findByIdAndUpdate(playerId, { lastSyncAt: new Date() });

    res.status(200).json({ message: 'Sync successful', state: updatedState });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Server error during state sync' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { region } = req.query;
    
    // Base query
    const query = region ? { region } : {};
    
    // Get top 50 players by financial score
    const players = await Player.find(query)
      .sort({ financialScore: -1 })
      .limit(50)
      .select('name region financialScore badges');

    res.status(200).json({ leaderboard: players });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error retrieving leaderboard' });
  }
};

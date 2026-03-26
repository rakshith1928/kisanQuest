import { Request, Response } from 'express';
import Player from '../models/Player';
import GameState from '../models/GameState';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, language, region } = req.body;

    if (!name || !language || !region) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const player = new Player({ name, language, region });
    await player.save();

    // Initialize GameState
    const gameState = new GameState({ playerId: player._id });
    await gameState.save();

    const token = jwt.sign({ playerId: player._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ player, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // In a real app we might use passwords or OTP.
    // For MVP, we'll login via player ID or name mapping.
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Missing playerId' });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const token = jwt.sign({ playerId: player._id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ player, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

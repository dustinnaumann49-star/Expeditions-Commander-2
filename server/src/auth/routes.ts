import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername } from '../db.js';
import { defaultPlayerState } from '../game/state.js';
import { saveGameStateJson } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-bitte-in-produktion-aendern';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Nutzername (min. 3 Zeichen) und Passwort (min. 6 Zeichen) erforderlich.' });
  }
  if (getUserByUsername(username)) {
    return res.status(409).json({ error: 'Nutzername bereits vergeben.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser(username, passwordHash);
  saveGameStateJson(user.id, JSON.stringify(defaultPlayerState(user.id)));

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  const user = getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Nutzername oder Passwort falsch.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Nutzername oder Passwort falsch.' });

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

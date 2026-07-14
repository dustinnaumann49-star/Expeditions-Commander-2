import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './auth/routes.js';
import { gameRouter } from './game/routes.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);

app.listen(PORT, () => {
  console.log(`Expedition-Commander Server läuft auf Port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth';
import groupsRoutes from './routes/groups';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'offer-whatsapp-platform', safeMode: process.env.SAFE_MODE === 'true' });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] Offer Platform running on port ${PORT}`);
  console.log(`[server] SAFE_MODE: ${process.env.SAFE_MODE}`);
});

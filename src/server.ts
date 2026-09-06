import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth';
import groupsRoutes from './routes/groups';
import productsRoutes from './routes/products';
import offersRoutes from './routes/offers';
import publicationsRoutes from './routes/publications';
import settingsRoutes from './routes/settings';
import marketplacesRoutes from './routes/marketplaces';
import dashboardRoutes from './routes/dashboard';
import automationRoutes from './routes/automation';
import whatsappStatusRoutes from './routes/whatsappStatus';
import whatsappInstancesRoutes from './routes/whatsappInstances';
import { startPublicationWorker } from './workers/publicationWorker';
import { startScheduler } from './services/scheduler';
import { startConnectionMonitor } from './services/connectionMonitor';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'offer-whatsapp-platform', safeMode: process.env.SAFE_MODE === 'true' });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/marketplaces', marketplacesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/whatsapp', whatsappStatusRoutes);
app.use('/api/whatsapp-instances', whatsappInstancesRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[server] Erro nao tratado numa rota:', err && err.message || err);
  if (!res.headersSent) {
    res.status(500).json({ message: (err && err.message) || 'Erro interno do servidor' });
  }
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[server] Promise rejeitada sem tratamento:', (reason && reason.message) || reason);
});
process.on('uncaughtException', (err: any) => {
  console.error('[server] Excecao nao tratada:', (err && err.message) || err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] Offer Platform running on port ${PORT}`);
  console.log(`[server] SAFE_MODE: ${process.env.SAFE_MODE}`);
  startPublicationWorker();
  startScheduler();
  startConnectionMonitor();
});

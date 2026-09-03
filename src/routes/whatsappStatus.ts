import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

router.get('/status', async (req, res) => {
  const [state, lastCheck, lastDrop] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'WHATSAPP_CONNECTION_STATE' } }),
    prisma.setting.findUnique({ where: { key: 'WHATSAPP_LAST_CHECK' } }),
    prisma.setting.findUnique({ where: { key: 'WHATSAPP_LAST_DROP' } }),
  ]);

  res.json({
    connected: state?.value === 'open',
    lastCheck: lastCheck?.value || null,
    lastDrop: lastDrop?.value || null,
  });
});

export default router;

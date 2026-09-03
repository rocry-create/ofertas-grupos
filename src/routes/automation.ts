import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { isAutomationEnabled, setAutomationEnabled, runShopeeScan } from '../services/scheduler';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get('/status', async (req, res) => {
  const enabled = await isAutomationEnabled();
  const lastRunSetting = await prisma.setting.findUnique({ where: { key: 'AUTOMATION_LAST_RUN' } });
  const lastRunAt = lastRunSetting ? new Date(lastRunSetting.value) : null;
  const nextRunAt = lastRunAt ? new Date(lastRunAt.getTime() + 60 * 60 * 1000) : null;

  const today = startOfToday();
  const [productsFoundToday, offersCreatedToday, publicationsSentToday, recentFailures] = await Promise.all([
    prisma.product.count({ where: { createdAt: { gte: today }, isTest: false } }),
    prisma.offer.count({ where: { createdAt: { gte: today } } }),
    prisma.publication.count({ where: { status: 'SENT', sentAt: { gte: today } } }),
    prisma.publication.findMany({
      where: { status: 'FAILED', createdAt: { gte: today } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { offer: { include: { product: true } } },
    }),
  ]);

  res.json({
    enabled,
    lastRunAt,
    nextRunAt,
    productsFoundToday,
    offersCreatedToday,
    publicationsSentToday,
    recentFailures: recentFailures.map((f) => ({
      id: f.id,
      productName: f.offer?.product?.name || '-',
      errorMessage: f.errorMessage,
      createdAt: f.createdAt,
    })),
  });
});

router.post('/toggle', async (req, res) => {
  const { enabled } = req.body;
  await setAutomationEnabled(!!enabled);
  res.json({ enabled: !!enabled });
});

router.post('/run-now', async (req, res) => {
  runShopeeScan().catch((err) => console.error('[automation] Erro ao executar manualmente:', err.message));
  res.json({ message: 'Execucao iniciada' });
});

export default router;

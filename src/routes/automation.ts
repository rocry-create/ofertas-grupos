import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { isAutomationEnabled, setAutomationEnabled, runShopeeScan, getAutomationSettings, setAutomationSettings } from '../services/scheduler';
import { getPublicationLimits } from '../services/publicationLimiter';

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
  const automationSettings = await getAutomationSettings();
  const publicationLimits = await getPublicationLimits();
  const lastRunSetting = await prisma.setting.findUnique({ where: { key: 'AUTOMATION_LAST_RUN' } });
  const lastRunAt = lastRunSetting ? new Date(lastRunSetting.value) : null;
  const nextRunAt = lastRunAt ? new Date(lastRunAt.getTime() + automationSettings.intervalMinutes * 60 * 1000) : null;

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
    settings: {
      intervalMinutes: automationSettings.intervalMinutes,
      minDiscountPct: automationSettings.minDiscountPct,
      keywords: automationSettings.keywords,
      maxPerDay: publicationLimits.maxPerDay,
      hourStart: publicationLimits.hourStart,
      hourEnd: publicationLimits.hourEnd,
      intervalHoursBetweenPosts: publicationLimits.intervalHours,
    },
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
router.post('/settings', async (req, res) => {
  try {
    const { intervalMinutes, minDiscountPct, keywords, maxPerDay, hourStart, hourEnd, intervalHoursBetweenPosts } = req.body;
    await setAutomationSettings({
      intervalMinutes: intervalMinutes !== undefined ? Number(intervalMinutes) : undefined,
      minDiscountPct: minDiscountPct !== undefined ? Number(minDiscountPct) : undefined,
      keywords: Array.isArray(keywords) ? keywords : undefined,
    });
    const publicationOps = [];
    if (maxPerDay !== undefined) {
      publicationOps.push(prisma.setting.upsert({ where: { key: 'PUBLICATION_MAX_PER_DAY' }, update: { value: String(maxPerDay) }, create: { key: 'PUBLICATION_MAX_PER_DAY', value: String(maxPerDay) } }));
    }
    if (hourStart !== undefined) {
      publicationOps.push(prisma.setting.upsert({ where: { key: 'PUBLICATION_HOUR_START' }, update: { value: String(hourStart) }, create: { key: 'PUBLICATION_HOUR_START', value: String(hourStart) } }));
    }
    if (hourEnd !== undefined) {
      publicationOps.push(prisma.setting.upsert({ where: { key: 'PUBLICATION_HOUR_END' }, update: { value: String(hourEnd) }, create: { key: 'PUBLICATION_HOUR_END', value: String(hourEnd) } }));
    }
    if (intervalHoursBetweenPosts !== undefined) {
      publicationOps.push(prisma.setting.upsert({ where: { key: 'PUBLICATION_INTERVAL_HOURS' }, update: { value: String(intervalHoursBetweenPosts) }, create: { key: 'PUBLICATION_INTERVAL_HOURS', value: String(intervalHoursBetweenPosts) } }));
    }
    await Promise.all(publicationOps);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Erro ao salvar configuracoes' });
  }
});

export default router;

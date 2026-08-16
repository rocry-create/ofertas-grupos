import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

const MASKED_KEYS = ['SHOPEE_SECRET_KEY', 'AMAZON_SECRET_KEY', 'AI_API_KEY'];

function maskValue(key: string, value: string) {
  if (!MASKED_KEYS.includes(key)) return value;
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

router.get('/', async (req, res) => {
  const settings = await prisma.setting.findMany();
  const result = settings.map((s) => ({
    key: s.key,
    value: maskValue(s.key, s.value),
    configured: !!s.value,
  }));
  res.json(result);
});

router.put('/:key', async (req, res) => {
  const { value } = req.body;
  const setting = await prisma.setting.upsert({
    where: { key: req.params.key },
    update: { value },
    create: { key: req.params.key, value },
  });
  res.json({ key: setting.key, configured: !!setting.value });
});

export default router;

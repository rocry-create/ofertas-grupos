import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { evolutionService } from '../services/evolution';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const groups = await prisma.whatsappGroup.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(groups);
});

router.get('/available', async (req, res) => {
  try {
    const groups = await evolutionService.fetchGroups();
    res.json(groups);
  } catch (e: any) {
    res.status(500).json({ message: 'Erro ao buscar grupos na Evolution API', error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { name, groupJid, instanceName, niche, dailyLimit } = req.body;
  const group = await prisma.whatsappGroup.create({
    data: { name, groupJid, instanceName, niche, dailyLimit: dailyLimit || 5 },
  });
  res.status(201).json(group);
});

router.patch('/:id', async (req, res) => {
  const { active, dailyLimit, niche } = req.body;
  const group = await prisma.whatsappGroup.update({
    where: { id: req.params.id },
    data: { active, dailyLimit, niche },
  });
  res.json(group);
});

router.delete('/:id', async (req, res) => {
  await prisma.whatsappGroup.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

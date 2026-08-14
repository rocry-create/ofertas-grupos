import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { enqueuePublication } from '../services/queue';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { status } = req.query;
  const publications = await prisma.publication.findMany({
    where: { status: status ? String(status) : undefined },
    include: { offer: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(publications);
});

router.get('/:id', async (req, res) => {
  const publication = await prisma.publication.findUnique({
    where: { id: req.params.id },
    include: { offer: { include: { product: true } } },
  });
  if (!publication) return res.status(404).json({ message: 'Publicacao nao encontrada' });
  res.json(publication);
});

// Enfileira uma oferta aprovada para envio em todos os grupos ativos (ou filtrados por nicho)
router.post('/:offerId/enqueue', async (req, res) => {
  const { groupIds, intervalSeconds = 30 } = req.body;

  const offer = await prisma.offer.findUnique({
    where: { id: req.params.offerId },
    include: { product: true },
  });
  if (!offer) return res.status(404).json({ message: 'Oferta nao encontrada' });
  if (offer.status !== 'APPROVED') {
    return res.status(400).json({ message: 'Somente ofertas aprovadas podem ser publicadas' });
  }

  const groups = groupIds && groupIds.length > 0
    ? await prisma.whatsappGroup.findMany({ where: { id: { in: groupIds }, active: true } })
    : await prisma.whatsappGroup.findMany({ where: { active: true } });

  if (groups.length === 0) {
    return res.status(400).json({ message: 'Nenhum grupo ativo encontrado' });
  }

  const publications = [];
  for (let i = 0; i < groups.length; i++) {
    const publication = await prisma.publication.create({
      data: {
        offerId: offer.id,
        groupId: groups[i].id,
        status: 'QUEUED',
      },
    });
    await enqueuePublication(publication.id, i * intervalSeconds * 1000);
    publications.push(publication);
  }

  res.status(201).json({ enqueued: publications.length, publications });
});

export default router;

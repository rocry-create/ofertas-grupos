import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

router.get('/stats', async (req, res) => {
  const [totalProducts, totalOffers, totalPublicationsSent, activeGroups, offersByStatus, productsByMarketplace, recentOffers] = await Promise.all([
    prisma.product.count(),
    prisma.offer.count(),
    prisma.publication.count({ where: { status: 'SENT' } }),
    prisma.whatsappGroup.count({ where: { active: true } }),
    prisma.offer.groupBy({ by: ['status'], _count: true }),
    prisma.product.groupBy({ by: ['marketplace'], _count: true }),
    prisma.offer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const publicationsLast7Days = await prisma.publication.findMany({
    where: { status: 'SENT', sentAt: { gte: sevenDaysAgo } },
    select: { sentAt: true },
  });
  const byDay: Record<string, number> = {};
  for (const p of publicationsLast7Days) {
    if (!p.sentAt) continue;
    const day = p.sentAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }

  res.json({
    totalProducts,
    totalOffers,
    totalPublicationsSent,
    activeGroups,
    offersByStatus,
    productsByMarketplace,
    recentOffers,
    publicationsByDay: byDay,
  });
});

export default router;

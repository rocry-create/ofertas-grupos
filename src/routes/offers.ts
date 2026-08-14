import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

function buildMessage(product: { name: string; currentPrice: number; previousPrice: number | null; affiliateUrl: string | null; originalUrl: string }, discountPct: number) {
  const link = product.affiliateUrl || product.originalUrl;
  const priceStr = product.currentPrice.toFixed(2).replace('.', ',');
  const oldPriceStr = product.previousPrice ? product.previousPrice.toFixed(2).replace('.', ',') : '';
  return `🔥 OFERTA! ${product.name}\n\nDe R$ ${oldPriceStr} por R$ ${priceStr} (${discountPct}% OFF)\n\n${link}`;
}

router.get('/', async (req, res) => {
  const { status } = req.query;
  const offers = await prisma.offer.findMany({
    where: { status: status ? String(status) : undefined },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(offers);
});

router.get('/:id', async (req, res) => {
  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    include: { product: true, publications: true },
  });
  if (!offer) return res.status(404).json({ message: 'Oferta nao encontrada' });
  res.json(offer);
});

// Gera ofertas automaticamente para produtos cujo preco atual caiu em relacao ao anterior
router.post('/generate', async (req, res) => {
  const { minDiscountPct = 10 } = req.body;

  const products = await prisma.product.findMany({
    where: { previousPrice: { not: null } },
  });

  const created = [];
  for (const product of products) {
    if (!product.previousPrice || product.previousPrice <= product.currentPrice) continue;

    const discountPct = Math.round(((product.previousPrice - product.currentPrice) / product.previousPrice) * 100);
    if (discountPct < minDiscountPct) continue;

    const existingPending = await prisma.offer.findFirst({
      where: { productId: product.id, status: 'PENDING' },
    });
    if (existingPending) continue;

    const messageText = buildMessage(product, discountPct);

    const offer = await prisma.offer.create({
      data: {
        productId: product.id,
        discountPct,
        messageText,
        status: 'PENDING',
      },
    });
    created.push(offer);
  }

  res.status(201).json({ generated: created.length, offers: created });
});

router.patch('/:id/approve', async (req, res) => {
  const offer = await prisma.offer.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', approved: true },
  });
  res.json(offer);
});

router.patch('/:id/reject', async (req, res) => {
  const offer = await prisma.offer.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', approved: false },
  });
  res.json(offer);
});

router.delete('/:id', async (req, res) => {
  await prisma.publication.deleteMany({ where: { offerId: req.params.id } });
  await prisma.offer.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

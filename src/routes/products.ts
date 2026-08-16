import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { generateTestProducts } from '../providers/testProvider';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

function makeFingerprint(marketplace: string, externalId: string) {
  return crypto.createHash('sha256').update(`${marketplace}:${externalId}`).digest('hex');
}

router.get('/', async (req, res) => {
  const { category, marketplace } = req.query;
  const products = await prisma.product.findMany({
    where: {
      category: category ? String(category) : undefined,
      marketplace: marketplace ? String(marketplace) : undefined,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { priceHistory: { orderBy: { collectedAt: 'desc' } }, offers: true },
  });
  if (!product) return res.status(404).json({ message: 'Produto nao encontrado' });
  res.json(product);
});

router.post('/import-test', async (req, res) => {
  const testProducts = generateTestProducts();
  const results = [];
  for (const tp of testProducts) {
    const fingerprint = makeFingerprint(tp.marketplace, tp.externalId);
    const product = await prisma.product.upsert({
      where: { fingerprint },
      update: {
        previousPrice: tp.previousPrice,
        currentPrice: tp.currentPrice,
      },
      create: {
        externalId: tp.externalId,
        marketplace: tp.marketplace,
        name: tp.name,
        category: tp.category,
        currentPrice: tp.currentPrice,
        previousPrice: tp.previousPrice,
        imageUrl: tp.imageUrl,
        originalUrl: tp.originalUrl,
        isTest: true,
        fingerprint,
      },
    });
    await prisma.priceHistory.create({
      data: { productId: product.id, price: product.currentPrice },
    });
    results.push(product);
  }
  res.status(201).json({ imported: results.length, products: results });
});

router.patch('/:id', async (req, res) => {
  const { name, category, currentPrice, affiliateUrl } = req.body;
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Produto nao encontrado' });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name,
      category,
      affiliateUrl,
      previousPrice: currentPrice !== undefined ? existing.currentPrice : undefined,
      currentPrice,
    },
  });

  if (currentPrice !== undefined && currentPrice !== existing.currentPrice) {
    await prisma.priceHistory.create({
      data: { productId: product.id, price: currentPrice },
    });
  }

  res.json(product);
});

router.delete('/:id', async (req, res) => {
  await prisma.priceHistory.deleteMany({ where: { productId: req.params.id } });
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.post('/manual', async (req, res) => {
  const { name, marketplace, currentPrice, previousPrice, affiliateUrl, imageUrl } = req.body;
  if (!name || !marketplace || currentPrice === undefined || !affiliateUrl) {
    return res.status(400).json({ message: 'Preencha nome, marketplace, preco atual e link de afiliado' });
  }
  const externalId = crypto.randomUUID();
  const fingerprint = makeFingerprint(marketplace, externalId);
  const product = await prisma.product.create({
    data: {
      externalId,
      marketplace,
      name,
      currentPrice: Number(currentPrice),
      previousPrice: previousPrice !== undefined && previousPrice !== null ? Number(previousPrice) : null,
      imageUrl: imageUrl || null,
      originalUrl: affiliateUrl,
      affiliateUrl,
      isTest: false,
      fingerprint,
    },
  });
  await prisma.priceHistory.create({
    data: { productId: product.id, price: product.currentPrice },
  });
  res.status(201).json(product);
});

export default router;

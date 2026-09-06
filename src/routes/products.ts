import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { generateTestProducts } from '../providers/testProvider';

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];
  for (const p of patterns) {
    const match = html.match(p);
    if (match) return match[1];
  }
  return null;
}

async function fetchLinkPreview(url: string) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatalogoViralBot/1.0)' },
    });
    const html = await res.text();
    const title = extractMeta(html, 'og:title');
    const image = extractMeta(html, 'og:image');
    const priceRaw = extractMeta(html, 'product:price:amount') || extractMeta(html, 'og:price:amount');
    const price = priceRaw ? Number(priceRaw.replace(',', '.')) : null;
    return { title, image, price: price && !isNaN(price) ? price : null };
  } catch {
    return { title: null, image: null, price: null };
  }
}

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

function makeFingerprint(marketplace: string, externalId: string) {
  return crypto.createHash('sha256').update(`${marketplace}:${externalId}`).digest('hex');
}

router.get('/', async (req, res) => {
  const { category, marketplace, productType } = req.query;
  const products = await prisma.product.findMany({
    where: {
      category: category ? String(category) : undefined,
      marketplace: marketplace ? String(marketplace) : undefined,
      productType: productType ? String(productType) : undefined,
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
  const { name, category, currentPrice, affiliateUrl, imageUrl, description, stock, isActive } = req.body;
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Produto nao encontrado' });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name,
      category,
      affiliateUrl,
      imageUrl,
      description,
      stock: stock !== undefined && stock !== null ? Number(stock) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
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
  try {
    const offers = await prisma.offer.findMany({ where: { productId: req.params.id } });
    const offerIds = offers.map((o) => o.id);
    if (offerIds.length > 0) {
      await prisma.publication.deleteMany({ where: { offerId: { in: offerIds } } });
      await prisma.offer.deleteMany({ where: { productId: req.params.id } });
    }
    await prisma.priceHistory.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Erro ao excluir produto' });
  }
});

router.post('/from-link', async (req, res) => {
  const { marketplace, affiliateUrl } = req.body;
  if (!marketplace || !affiliateUrl) {
    return res.status(400).json({ message: 'Preencha marketplace e link de afiliado' });
  }
  const preview = await fetchLinkPreview(affiliateUrl);
  const externalId = crypto.randomUUID();
  const fingerprint = makeFingerprint(marketplace, externalId);
  const product = await prisma.product.create({
    data: {
      externalId,
      marketplace,
      name: preview.title || `Produto ${marketplace} (editar nome e preco)`,
      currentPrice: preview.price ?? 0,
      imageUrl: preview.image || null,
      originalUrl: affiliateUrl,
      affiliateUrl,
      isTest: false,
      fingerprint,
    },
  });
  await prisma.priceHistory.create({
    data: { productId: product.id, price: product.currentPrice },
  });
  res.status(201).json({ product, foundTitle: !!preview.title, foundImage: !!preview.image, foundPrice: !!preview.price });
});

router.post('/manual', async (req, res) => {
  const { name, marketplace, currentPrice, previousPrice, affiliateUrl, imageUrl, description, category, stock, isActive } = req.body;
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
      description: description || null,
      category: category || null,
      stock: stock !== undefined && stock !== null ? Number(stock) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      productType: 'store_product',
      isTest: false,
      fingerprint,
    },
  });
  await prisma.priceHistory.create({
    data: { productId: product.id, price: product.currentPrice },
  });
  res.status(201).json(product);
});

router.delete('/all/bulk', async (req, res) => {
  try {
    await prisma.publication.deleteMany({});
    await prisma.offer.deleteMany({});
    await prisma.priceHistory.deleteMany({});
    const result = await prisma.product.deleteMany({});
    res.json({ success: true, deleted: result.count });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Erro ao excluir todos os produtos' });
  }
});

export default router;

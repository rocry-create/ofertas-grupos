import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth';
import { searchShopeeOffers } from '../services/shopee';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

function makeFingerprint(marketplace: string, externalId: string) {
  return crypto.createHash('sha256').update(`${marketplace}:${externalId}`).digest('hex');
}

router.post('/shopee/import', async (req, res) => {
  const { keyword, limit } = req.body;
  if (!keyword) {
    return res.status(400).json({ message: 'Informe uma palavra-chave de busca' });
  }

  try {
    const offers = await searchShopeeOffers(keyword, limit || 20);
    const results = [];

    for (const offer of offers) {
      const fingerprint = makeFingerprint('SHOPEE', String(offer.itemId));
      const currentPrice = Number(offer.priceMin);
      const discountRate = offer.priceDiscountRate || 0;
      const previousPrice =
        discountRate > 0 ? currentPrice / (1 - discountRate / 100) : null;

      const product = await prisma.product.upsert({
        where: { fingerprint },
        update: {
          previousPrice: previousPrice,
          currentPrice: currentPrice,
        },
        create: {
          externalId: String(offer.itemId),
          marketplace: 'SHOPEE',
          name: offer.productName,
          currentPrice: currentPrice,
          previousPrice: previousPrice,
          imageUrl: offer.imageUrl,
          originalUrl: offer.productLink,
          affiliateUrl: offer.offerLink,
          isTest: false,
          fingerprint,
        },
      });

      await prisma.priceHistory.create({
        data: { productId: product.id, price: product.currentPrice },
      });

      results.push(product);
    }

    res.status(201).json({ imported: results.length, products: results });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Erro ao importar da Shopee' });
  }
});

export default router;

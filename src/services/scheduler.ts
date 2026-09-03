import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { searchShopeeOffers } from './shopee';
import { enqueuePublication } from './queue';
import { canPublishMoreToday, wasProductPublishedRecently, getNextAllowedSlot } from './publicationLimiter';

const prisma = new PrismaClient();

const KEYWORDS = [
  'fone de ouvido',
  'tenis esportivo',
  'panela',
  'maquiagem',
  'brinquedo',
  'mochila',
  'relogio',
  'perfume',
];

let keywordIndex = 0;
const MIN_DISCOUNT_PCT = 5;

function makeFingerprint(marketplace: string, externalId: string) {
  return crypto.createHash('sha256').update(`${marketplace}:${externalId}`).digest('hex');
}

function buildMessage(product: { name: string; currentPrice: number; previousPrice: number | null; affiliateUrl: string | null; originalUrl: string }, discountPct: number) {
  const link = product.affiliateUrl || product.originalUrl;
  const priceStr = product.currentPrice.toFixed(2).replace('.', ',');
  const oldPriceStr = product.previousPrice ? product.previousPrice.toFixed(2).replace('.', ',') : '';
  return `\uD83D\uDD25 OFERTA! ${product.name}\n\nDe R$ ${oldPriceStr} por R$ ${priceStr} (${discountPct}% OFF)\n\n${link}`;
}

export async function isAutomationEnabled(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: 'AUTOMATION_ENABLED' } });
  return setting ? setting.value === 'true' : true;
}

export async function setAutomationEnabled(enabled: boolean) {
  await prisma.setting.upsert({
    where: { key: 'AUTOMATION_ENABLED' },
    update: { value: String(enabled) },
    create: { key: 'AUTOMATION_ENABLED', value: String(enabled) },
  });
}

async function recordLastRun() {
  await prisma.setting.upsert({
    where: { key: 'AUTOMATION_LAST_RUN' },
    update: { value: new Date().toISOString() },
    create: { key: 'AUTOMATION_LAST_RUN', value: new Date().toISOString() },
  });
}

export async function runShopeeScan() {
  const enabled = await isAutomationEnabled();
  if (!enabled) {
    console.log('[scheduler] Automacao pausada, pulando execucao');
    return;
  }
  await recordLastRun();
  await runShopeeScanInternal();
}

async function runShopeeScanInternal() {
  const keyword = KEYWORDS[keywordIndex % KEYWORDS.length];
  keywordIndex++;
  console.log(`[scheduler] Buscando Shopee: ${keyword}`);

  try {
    const offers = await searchShopeeOffers(keyword, 10);
    const groups = await prisma.whatsappGroup.findMany({ where: { active: true } });

    for (const offer of offers) {
      const fingerprint = makeFingerprint('SHOPEE', String(offer.itemId));
      const currentPrice = Number(offer.priceMin);
      const discountRate = offer.priceDiscountRate || 0;
      const previousPrice = discountRate > 0 ? currentPrice / (1 - discountRate / 100) : null;

      if (discountRate < MIN_DISCOUNT_PCT) continue;

      const product = await prisma.product.upsert({
        where: { fingerprint },
        update: { previousPrice, currentPrice },
        create: {
          externalId: String(offer.itemId),
          marketplace: 'SHOPEE',
          name: offer.productName,
          currentPrice,
          previousPrice,
          imageUrl: offer.imageUrl,
          originalUrl: offer.productLink,
          affiliateUrl: offer.offerLink,
          isTest: false,
          fingerprint,
        },
      });

      const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingOffer = await prisma.offer.findFirst({
        where: {
          productId: product.id,
          status: { in: ['PENDING', 'APPROVED'] },
          createdAt: { gte: vinteQuatroHorasAtras },
        },
      });
      if (existingOffer) continue;

      const jaPublicadoHoje = await wasProductPublishedRecently(product.id);
      if (jaPublicadoHoje) {
        console.log(`[scheduler] Produto ja publicado nas ultimas 24h, pulando: ${product.name}`);
        continue;
      }

      const podePublicarHoje = await canPublishMoreToday();
      if (!podePublicarHoje) {
        console.log(`[scheduler] Limite diario de publicacoes atingido, oferta guardada como pendente: ${product.name}`);
        await prisma.offer.create({
          data: {
            productId: product.id,
            discountPct: Math.round(discountRate),
            messageText: buildMessage(product, Math.round(discountRate)),
            status: 'PENDING',
            approved: false,
          },
        });
        continue;
      }

      const discountPct = Math.round(discountRate);
      const messageText = buildMessage(product, discountPct);

      const newOffer = await prisma.offer.create({
        data: {
          productId: product.id,
          discountPct,
          messageText,
          status: 'APPROVED',
          approved: true,
        },
      });

      const proximoHorario = await getNextAllowedSlot();
      const delayMs = Math.max(0, proximoHorario.getTime() - Date.now());

      for (const group of groups) {
        const publication = await prisma.publication.create({
          data: { offerId: newOffer.id, groupId: group.id, status: 'QUEUED' },
        });
        await enqueuePublication(publication.id, delayMs);
      }

      console.log(`[scheduler] Nova oferta automatica: ${product.name} (${discountPct}% OFF) - agendada para ${proximoHorario.toLocaleString('pt-BR')}`);
    }
  } catch (err: any) {
    console.error(`[scheduler] Erro ao buscar Shopee: ${err.message}`);
  }
}

export function startScheduler() {
  const intervalMs = 60 * 60 * 1000;
  console.log(`[scheduler] Scanner automatico da Shopee iniciado (a cada 1 hora)`);
  setTimeout(runShopeeScan, 15000);
  setInterval(runShopeeScan, intervalMs);
}

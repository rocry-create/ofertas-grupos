import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { searchShopeeOffers } from './shopee';
import { enqueuePublication } from './queue';
import { canPublishMoreToday, wasProductPublishedRecently, getNextAllowedSlot } from './publicationLimiter';

const prisma = new PrismaClient();

const DEFAULT_KEYWORDS = [
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
let scanTimer: NodeJS.Timeout | null = null;

function makeFingerprint(marketplace: string, externalId: string) {
  return crypto.createHash('sha256').update(`${marketplace}:${externalId}`).digest('hex');
}

function buildMessage(product: { name: string; currentPrice: number; previousPrice: number | null; affiliateUrl: string | null; originalUrl: string }, discountPct: number) {
  const link = product.affiliateUrl || product.originalUrl;
  const priceStr = product.currentPrice.toFixed(2).replace('.', ',');
  const temDescontoReal = product.previousPrice && product.previousPrice > product.currentPrice && discountPct > 0;
  if (temDescontoReal) {
    const oldPriceStr = product.previousPrice!.toFixed(2).replace('.', ',');
    return `\uD83D\uDD25 OFERTA! ${product.name}\n\nDe R$ ${oldPriceStr} por R$ ${priceStr} (${discountPct}% OFF)\n\n${link}`;
  }
  return `\uD83D\uDD25 OFERTA! ${product.name}\n\nPor apenas R$ ${priceStr}\n\n${link}`;
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

export async function getAutomationSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ['AUTOMATION_INTERVAL_MINUTES', 'AUTOMATION_MIN_DISCOUNT_PCT', 'AUTOMATION_KEYWORDS'] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  const intervalMinutes = map.AUTOMATION_INTERVAL_MINUTES ? Number(map.AUTOMATION_INTERVAL_MINUTES) : 60;
  const minDiscountPct = map.AUTOMATION_MIN_DISCOUNT_PCT !== undefined ? Number(map.AUTOMATION_MIN_DISCOUNT_PCT) : 0;
  const keywords = map.AUTOMATION_KEYWORDS
    ? map.AUTOMATION_KEYWORDS.split(',').map((k) => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;
  return { intervalMinutes, minDiscountPct, keywords };
}

export async function setAutomationSettings(input: { intervalMinutes?: number; minDiscountPct?: number; keywords?: string[] }) {
  const ops = [];
  if (input.intervalMinutes !== undefined) {
    ops.push(prisma.setting.upsert({
      where: { key: 'AUTOMATION_INTERVAL_MINUTES' },
      update: { value: String(input.intervalMinutes) },
      create: { key: 'AUTOMATION_INTERVAL_MINUTES', value: String(input.intervalMinutes) },
    }));
  }
  if (input.minDiscountPct !== undefined) {
    ops.push(prisma.setting.upsert({
      where: { key: 'AUTOMATION_MIN_DISCOUNT_PCT' },
      update: { value: String(input.minDiscountPct) },
      create: { key: 'AUTOMATION_MIN_DISCOUNT_PCT', value: String(input.minDiscountPct) },
    }));
  }
  if (input.keywords !== undefined) {
    ops.push(prisma.setting.upsert({
      where: { key: 'AUTOMATION_KEYWORDS' },
      update: { value: input.keywords.join(',') },
      create: { key: 'AUTOMATION_KEYWORDS', value: input.keywords.join(',') },
    }));
  }
  await Promise.all(ops);
  scheduleNextScan();
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
  const settings = await getAutomationSettings();
  const keywords = settings.keywords.length > 0 ? settings.keywords : DEFAULT_KEYWORDS;
  const keyword = keywords[keywordIndex % keywords.length];
  keywordIndex++;
  console.log(`[scheduler] Buscando Shopee: ${keyword} (desconto minimo: ${settings.minDiscountPct}%)`);

  try {
    const offers = await searchShopeeOffers(keyword, 10);
    const groups = await prisma.whatsappGroup.findMany({ where: { active: true } });

    for (const offer of offers) {
      const fingerprint = makeFingerprint('SHOPEE', String(offer.itemId));
      const currentPrice = Number(offer.priceMin);
      const discountRate = offer.priceDiscountRate || 0;
      const previousPrice = discountRate > 0 ? currentPrice / (1 - discountRate / 100) : null;

      if (discountRate < settings.minDiscountPct) continue;

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

async function scheduleNextScan() {
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  const settings = await getAutomationSettings();
  const intervalMs = Math.max(1, settings.intervalMinutes) * 60 * 1000;
  scanTimer = setTimeout(async () => {
    await runShopeeScan();
    scheduleNextScan();
  }, intervalMs);
}

export function startScheduler() {
  console.log(`[scheduler] Scanner automatico da Shopee iniciado`);
  setTimeout(async () => {
    await runShopeeScan();
    scheduleNextScan();
  }, 15000);
}

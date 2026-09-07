import { PrismaClient } from '@prisma/client';
import { enqueuePublication } from './queue';
import { canPublishMoreToday, wasProductPublishedRecently, getNextAllowedSlot } from './publicationLimiter';

const prisma = new PrismaClient();

function buildMessage(product: { name: string; currentPrice: number; previousPrice: number | null; affiliateUrl: string | null; originalUrl: string }, discountPct: number) {
  const link = product.affiliateUrl || product.originalUrl;
  const priceStr = product.currentPrice.toFixed(2).replace('.', ',');
  const temDescontoReal = product.previousPrice && product.previousPrice > product.currentPrice && discountPct > 0;
  if (temDescontoReal) {
    const oldPriceStr = product.previousPrice!.toFixed(2).replace('.', ',');
    return `🔥 OFERTA! ${product.name}\n\nDe R$ ${oldPriceStr} por R$ ${priceStr} (${discountPct}% OFF)\n\n${link}`;
  }
  return `🔥 OFERTA! ${product.name}\n\nPor apenas R$ ${priceStr}\n\n${link}`;
}

export async function autoCreateAndQueueOffer(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existingOffer = await prisma.offer.findFirst({
    where: {
      productId: product.id,
      status: { in: ['PENDING', 'APPROVED'] },
      createdAt: { gte: vinteQuatroHorasAtras },
    },
  });
  if (existingOffer) {
    console.log(`[autoOffer] Produto ja tem oferta recente, pulando: ${product.name}`);
    return;
  }

  const jaPublicadoHoje = await wasProductPublishedRecently(product.id);
  if (jaPublicadoHoje) {
    console.log(`[autoOffer] Produto ja publicado nas ultimas 24h, pulando: ${product.name}`);
    return;
  }

  const discountPct = product.previousPrice && product.previousPrice > product.currentPrice
    ? Math.round(((product.previousPrice - product.currentPrice) / product.previousPrice) * 100)
    : 0;
  const messageText = buildMessage(product, discountPct);

  const podePublicarHoje = await canPublishMoreToday();
  if (!podePublicarHoje) {
    await prisma.offer.create({
      data: {
        productId: product.id,
        discountPct,
        messageText,
        status: 'PENDING',
        approved: false,
      },
    });
    console.log(`[autoOffer] Limite diario atingido, oferta guardada como pendente: ${product.name}`);
    return;
  }

  const newOffer = await prisma.offer.create({
    data: {
      productId: product.id,
      discountPct,
      messageText,
      status: 'APPROVED',
      approved: true,
    },
  });

  const groups = await prisma.whatsappGroup.findMany({ where: { active: true } });
  const proximoHorario = await getNextAllowedSlot();
  const delayMs = Math.max(0, proximoHorario.getTime() - Date.now());

  for (const group of groups) {
    const publication = await prisma.publication.create({
      data: { offerId: newOffer.id, groupId: group.id, status: 'QUEUED' },
    });
    await enqueuePublication(publication.id, delayMs);
  }

  console.log(`[autoOffer] Produto adicionado enviado para fila: ${product.name} - agendado para ${proximoHorario.toLocaleString('pt-BR')}`);
}

export async function promotePendingOffers() {
  const pendentes = await prisma.offer.findMany({
    where: { status: 'PENDING' },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  if (pendentes.length === 0) return;

  const groups = await prisma.whatsappGroup.findMany({ where: { active: true } });

  for (const offer of pendentes) {
    if (!offer.product) continue;

    const podePublicarHoje = await canPublishMoreToday();
    if (!podePublicarHoje) {
      console.log('[autoOffer] Cota diaria ainda cheia, ofertas pendentes aguardando');
      break;
    }

    const jaPublicadoHoje = await wasProductPublishedRecently(offer.productId);
    if (jaPublicadoHoje) {
      console.log(`[autoOffer] Produto pendente ja foi publicado recentemente, descartando: ${offer.product.name}`);
      await prisma.offer.update({ where: { id: offer.id }, data: { status: 'REJECTED' } });
      continue;
    }

    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: 'APPROVED', approved: true },
    });

    const proximoHorario = await getNextAllowedSlot();
    const delayMs = Math.max(0, proximoHorario.getTime() - Date.now());

    for (const group of groups) {
      const publication = await prisma.publication.create({
        data: { offerId: offer.id, groupId: group.id, status: 'QUEUED' },
      });
      await enqueuePublication(publication.id, delayMs);
    }

    console.log(`[autoOffer] Oferta pendente liberada: ${offer.product.name} - agendada para ${proximoHorario.toLocaleString('pt-BR')}`);
  }
}

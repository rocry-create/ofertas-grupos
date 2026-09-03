import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULTS = {
  PUBLICATION_MAX_PER_DAY: '5',
  PUBLICATION_INTERVAL_HOURS: '3',
  PUBLICATION_HOUR_START: '8',
  PUBLICATION_HOUR_END: '22',
};

async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value || DEFAULTS[key as keyof typeof DEFAULTS];
}

export async function getPublicationLimits() {
  const [maxPerDay, intervalHours, hourStart, hourEnd] = await Promise.all([
    getSetting('PUBLICATION_MAX_PER_DAY'),
    getSetting('PUBLICATION_INTERVAL_HOURS'),
    getSetting('PUBLICATION_HOUR_START'),
    getSetting('PUBLICATION_HOUR_END'),
  ]);
  return {
    maxPerDay: Number(maxPerDay),
    intervalHours: Number(intervalHours),
    hourStart: Number(hourStart),
    hourEnd: Number(hourEnd),
  };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Conta quantas "rodadas" de publicacao (ofertas distintas) ja foram
// enviadas ou enfileiradas hoje.
export async function countPublicationRoundsToday(): Promise<number> {
  const offers = await prisma.publication.findMany({
    where: {
      createdAt: { gte: startOfToday() },
      status: { in: ['QUEUED', 'SENT'] },
    },
    select: { offerId: true },
    distinct: ['offerId'],
  });
  return offers.length;
}

// Verifica se um produto (pelo fingerprint) ja foi publicado com sucesso
// nas ultimas 24 horas, para evitar repetir o mesmo produto.
export async function wasProductPublishedRecently(productId: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.publication.findFirst({
    where: {
      status: { in: ['QUEUED', 'SENT'] },
      createdAt: { gte: oneDayAgo },
      offer: { productId },
    },
  });
  return !!existing;
}

// Calcula o proximo horario permitido para publicar, respeitando o
// intervalo minimo entre publicacoes e a janela de horario permitido.
export async function getNextAllowedSlot(): Promise<Date> {
  const limits = await getPublicationLimits();

  const stored = await prisma.setting.findUnique({ where: { key: 'PUBLICATION_NEXT_SLOT' } });
  let candidate = stored ? new Date(stored.value) : new Date();
  const now = new Date();
  if (candidate < now) candidate = now;

  const hour = candidate.getHours();
  if (hour < limits.hourStart) {
    candidate.setHours(limits.hourStart, 0, 0, 0);
  } else if (hour >= limits.hourEnd) {
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(limits.hourStart, 0, 0, 0);
  }

  const nextSlot = new Date(candidate.getTime() + limits.intervalHours * 60 * 60 * 1000);
  await prisma.setting.upsert({
    where: { key: 'PUBLICATION_NEXT_SLOT' },
    update: { value: nextSlot.toISOString() },
    create: { key: 'PUBLICATION_NEXT_SLOT', value: nextSlot.toISOString() },
  });

  return candidate;
}

// Verifica se ainda cabe mais uma rodada de publicacao hoje, considerando
// o limite maximo diario configurado.
export async function canPublishMoreToday(): Promise<boolean> {
  const limits = await getPublicationLimits();
  const countToday = await countPublicationRoundsToday();
  return countToday < limits.maxPerDay;
}

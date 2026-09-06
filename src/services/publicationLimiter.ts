import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const DEFAULTS = {
  PUBLICATION_MAX_PER_DAY: '999',
  PUBLICATION_INTERVAL_HOURS: '2.17',
  PUBLICATION_HOUR_START: '9',
  PUBLICATION_HOUR_END: '22',
  PUBLICATION_BATCH_SIZE: '3',
};
async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value || DEFAULTS[key as keyof typeof DEFAULTS];
}
export async function getPublicationLimits() {
  const [maxPerDay, intervalHours, hourStart, hourEnd, batchSize] = await Promise.all([
    getSetting('PUBLICATION_MAX_PER_DAY'),
    getSetting('PUBLICATION_INTERVAL_HOURS'),
    getSetting('PUBLICATION_HOUR_START'),
    getSetting('PUBLICATION_HOUR_END'),
    getSetting('PUBLICATION_BATCH_SIZE'),
  ]);
  return {
    maxPerDay: Number(maxPerDay),
    intervalHours: Number(intervalHours),
    hourStart: Number(hourStart),
    hourEnd: Number(hourEnd),
    batchSize: Number(batchSize),
  };
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
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
// Calcula o horario do bloco atual. Enquanto o bloco nao tiver "batchSize"
// ofertas, reaproveita o mesmo horario. Ao completar, avanca para o proximo bloco.
export async function getNextAllowedSlot(): Promise<Date> {
  const limits = await getPublicationLimits();
  const now = new Date();

  const storedSlot = await prisma.setting.findUnique({ where: { key: 'PUBLICATION_CURRENT_SLOT' } });
  const storedCount = await prisma.setting.findUnique({ where: { key: 'PUBLICATION_BATCH_COUNT' } });
  let slot = storedSlot ? new Date(storedSlot.value) : new Date(0);
  let count = storedCount ? Number(storedCount.value) : 0;

  if (slot < now || count >= limits.batchSize) {
    let base = slot < now ? new Date(now) : slot;
    if (count >= limits.batchSize && slot >= now) {
      base = new Date(slot.getTime() + limits.intervalHours * 60 * 60 * 1000);
    }
    const hour = base.getHours();
    if (hour < limits.hourStart) {
      base.setHours(limits.hourStart, 0, 0, 0);
    } else if (hour >= limits.hourEnd) {
      base.setDate(base.getDate() + 1);
      base.setHours(limits.hourStart, 0, 0, 0);
    }
    slot = base;
    count = 0;
  }

  count++;
  await Promise.all([
    prisma.setting.upsert({
      where: { key: 'PUBLICATION_CURRENT_SLOT' },
      update: { value: slot.toISOString() },
      create: { key: 'PUBLICATION_CURRENT_SLOT', value: slot.toISOString() },
    }),
    prisma.setting.upsert({
      where: { key: 'PUBLICATION_BATCH_COUNT' },
      update: { value: String(count) },
      create: { key: 'PUBLICATION_BATCH_COUNT', value: String(count) },
    }),
  ]);

  return slot;
}
export async function canPublishMoreToday(): Promise<boolean> {
  const limits = await getPublicationLimits();
  const countToday = await countPublicationRoundsToday();
  return countToday < limits.maxPerDay;
}

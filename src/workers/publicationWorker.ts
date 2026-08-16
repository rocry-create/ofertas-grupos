import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { connection } from '../services/queue';
import { evolutionService } from '../services/evolution';

const prisma = new PrismaClient();

async function processPublication(job: Job) {
  const { publicationId } = job.data as { publicationId: string };

  const publication = await prisma.publication.findUnique({
    where: { id: publicationId },
    include: { offer: { include: { product: true } } },
  });

  if (!publication) throw new Error(`Publication ${publicationId} nao encontrada`);

  const group = await prisma.whatsappGroup.findUnique({
    where: { id: publication.groupId },
  });

  if (!group) throw new Error(`Grupo ${publication.groupId} nao encontrado`);
  if (!group.active) throw new Error(`Grupo ${group.name} esta inativo`);

  const safeMode = process.env.SAFE_MODE === 'true';
  const messageText = publication.offer.messageText || '';

  try {
    if (safeMode) {
      console.log(`[SAFE_MODE] Simulando envio para ${group.name} (${group.groupJid}): ${messageText.slice(0, 60)}...`);
    } else {
      const imageUrl = publication.offer.product.imageUrl;
      if (imageUrl) {
        await evolutionService.sendMedia(group.groupJid, imageUrl, messageText);
      } else {
        await evolutionService.sendText(group.groupJid, messageText);
      }
    }

    await prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  } catch (err: any) {
    await prisma.publication.update({
      where: { id: publicationId },
      data: {
        status: 'FAILED',
        errorMessage: err.message?.slice(0, 500) || 'Erro desconhecido',
        attempts: { increment: 1 },
      },
    });
    throw err;
  }
}

export function startPublicationWorker() {
  const worker = new Worker('publications', processPublication, {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 3000 },
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Publicacao ${job.data.publicationId} enviada com sucesso`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] Publicacao ${job?.data?.publicationId} falhou: ${err.message}`);
  });

  console.log('[worker] Publication worker iniciado');
  return worker;
}

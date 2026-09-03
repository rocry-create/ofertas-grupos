import { PrismaClient } from '@prisma/client';
import { evolutionService } from './evolution';

const prisma = new PrismaClient();

let lastKnownState: 'open' | 'close' | 'unknown' = 'unknown';

async function checkConnection() {
  try {
    const result = await evolutionService.connectionState();
    const state = result?.instance?.state === 'open' ? 'open' : 'close';

    if (state !== lastKnownState) {
      if (state === 'close' && lastKnownState !== 'unknown') {
        console.log('[monitor] WhatsApp desconectou!');
        await prisma.setting.upsert({
          where: { key: 'WHATSAPP_LAST_DROP' },
          update: { value: new Date().toISOString() },
          create: { key: 'WHATSAPP_LAST_DROP', value: new Date().toISOString() },
        });
      }
      if (state === 'open') {
        console.log('[monitor] WhatsApp conectado');
      }
      lastKnownState = state;
    }

    await prisma.setting.upsert({
      where: { key: 'WHATSAPP_CONNECTION_STATE' },
      update: { value: state },
      create: { key: 'WHATSAPP_CONNECTION_STATE', value: state },
    });
    await prisma.setting.upsert({
      where: { key: 'WHATSAPP_LAST_CHECK' },
      update: { value: new Date().toISOString() },
      create: { key: 'WHATSAPP_LAST_CHECK', value: new Date().toISOString() },
    });
  } catch (err: any) {
    console.error('[monitor] Erro ao verificar conexao:', err.message);
  }
}

export function startConnectionMonitor() {
  console.log('[monitor] Monitor de conexao do WhatsApp iniciado (a cada 5 minutos)');
  checkConnection();
  setInterval(checkConnection, 5 * 60 * 1000);
}

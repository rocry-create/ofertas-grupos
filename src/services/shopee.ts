import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SHOPEE_URL = 'https://open-api.affiliate.shopee.com.br/graphql';

async function getCredentials() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['SHOPEE_APP_ID', 'SHOPEE_SECRET_KEY'] } },
  });
  const appId = settings.find((s) => s.key === 'SHOPEE_APP_ID')?.value;
  const secret = settings.find((s) => s.key === 'SHOPEE_SECRET_KEY')?.value;
  if (!appId || !secret) {
    throw new Error('Chaves da Shopee nao configuradas. Configure em Configuracoes.');
  }
  return { appId, secret };
}

function sign(appId: string, timestamp: number, payload: string, secret: string) {
  const factor = `${appId}${timestamp}${payload}${secret}`;
  return crypto.createHash('sha256').update(factor).digest('hex');
}

export interface ShopeeOffer {
  itemId: string;
  productName: string;
  productLink: string;
  offerLink: string;
  imageUrl: string;
  priceMin: number;
  priceDiscountRate: number;
  sales: number;
  ratingStar: number;
  commissionRate: number;
  shopName: string;
}

export async function searchShopeeOffers(keyword: string, limit = 20): Promise<ShopeeOffer[]> {
  const { appId, secret } = await getCredentials();

  const query = `{ productOfferV2(keyword: "${keyword}", listType: 1, sortType: 5, page: 1, limit: ${limit}) { nodes { itemId productName productLink offerLink imageUrl priceMin priceDiscountRate sales ratingStar commissionRate shopName } pageInfo { page limit hasNextPage } } }`;

  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(appId, timestamp, payload, secret);

  const response = await fetch(SHOPEE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`,
    },
    body: payload,
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'Erro na API da Shopee');
  }

  return data.data?.productOfferV2?.nodes || [];
}

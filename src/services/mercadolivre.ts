import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface MercadoLivreOffer {
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

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const settings = await prisma.setting.findMany({
    where: { key: { in: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET'] } },
  });
  const clientId = settings.find((s) => s.key === 'ML_CLIENT_ID')?.value;
  const clientSecret = settings.find((s) => s.key === 'ML_CLIENT_SECRET')?.value;

  if (!clientId || !clientSecret) {
    throw new Error('Chaves do Mercado Livre nao configuradas. Configure em Marketplaces.');
  }

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.message || 'Erro ao obter token do Mercado Livre');
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export async function searchMercadoLivreOffers(keyword: string, limit = 20): Promise<MercadoLivreOffer[]> {
  const token = await getAccessToken();
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(keyword)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao buscar produtos no Mercado Livre');
  }

  if (!data.results) {
    return [];
  }

  return data.results.map((item: any) => {
    const currentPrice = Number(item.price);
    const originalPrice = item.original_price ? Number(item.original_price) : null;
    const discountRate = originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    return {
      itemId: item.id,
      productName: item.title,
      productLink: item.permalink,
      offerLink: item.permalink,
      imageUrl: item.thumbnail ? item.thumbnail.replace('http://', 'https://') : '',
      priceMin: currentPrice,
      priceDiscountRate: discountRate,
      sales: item.sold_quantity || 0,
      ratingStar: 0,
      commissionRate: 0,
      shopName: item.seller?.nickname || '',
    };
  });
}

export interface TestProduct {
  externalId: string;
  marketplace: string;
  name: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  imageUrl: string;
  originalUrl: string;
}

export function generateTestProducts(): TestProduct[] {
  return [
    {
      externalId: 'TEST-001',
      marketplace: 'TESTE',
      name: '[TESTE] Kit Halteres Ajustaveis 20kg',
      category: 'fitness',
      currentPrice: 129.90,
      previousPrice: 199.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=Halteres',
      originalUrl: 'https://exemplo.com/produto-teste-1',
    },
    {
      externalId: 'TEST-002',
      marketplace: 'TESTE',
      name: '[TESTE] Fone de Ouvido Bluetooth TWS',
      category: 'eletronicos',
      currentPrice: 59.90,
      previousPrice: 119.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=Fone',
      originalUrl: 'https://exemplo.com/produto-teste-2',
    },
    {
      externalId: 'TEST-003',
      marketplace: 'TESTE',
      name: '[TESTE] Air Fryer 5L Digital',
      category: 'casa',
      currentPrice: 189.90,
      previousPrice: 299.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=AirFryer',
      originalUrl: 'https://exemplo.com/produto-teste-3',
    },
    {
      externalId: 'TEST-004',
      marketplace: 'TESTE',
      name: '[TESTE] Kit Maquiagem Profissional',
      category: 'beleza',
      currentPrice: 79.90,
      previousPrice: 149.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=Maquiagem',
      originalUrl: 'https://exemplo.com/produto-teste-4',
    },
    {
      externalId: 'TEST-005',
      marketplace: 'TESTE',
      name: '[TESTE] Boneco Articulado Colecionavel',
      category: 'brinquedos',
      currentPrice: 39.90,
      previousPrice: 69.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=Boneco',
      originalUrl: 'https://exemplo.com/produto-teste-5',
    },
    {
      externalId: 'TEST-006',
      marketplace: 'TESTE',
      name: '[TESTE] Mochila Notebook Impermeavel',
      category: 'moda',
      currentPrice: 89.90,
      previousPrice: 159.90,
      imageUrl: 'https://via.placeholder.com/400x400?text=Mochila',
      originalUrl: 'https://exemplo.com/produto-teste-6',
    },
  ];
}

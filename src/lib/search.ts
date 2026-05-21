import axios from 'axios';

export function getMockProducts(query: string) {
  const q = query.toLowerCase();
  return [
    {
      id: 'AMZ-123',
      title: `Amazon - ${query.substring(0, 10)}... Premium`,
      price: 199.99,
      imageUrl: 'https://m.media-amazon.com/images/I/61y2VVWcGBL._AC_SL1500_.jpg',
      store: 'Amazon',
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || 'SEU_ID_DE_AFILIADO_AQUI'}`
    },
    {
      id: 'SHP-456',
      title: `Shopee - ${query} Importação Exclusiva`,
      price: 185.50,
      imageUrl: 'https://down-br.img.susercontent.com/file/af8881e1136bba7ec6ed359d91f24d40',
      store: 'Shopee',
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || 'SEU_ID'}`
    }
  ];
}

export async function searchMercadoLivre(query: string) {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`);
    const campId = process.env.ML_AFFILIATE_CAMP_ID || 'SEU_CAMP_ID';

    return response.data.results.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg') : '',
      store: 'Mercado Livre',
      affiliateUrl: `${item.permalink}?campId=${campId}`
    }));
  } catch (error) {
    console.error('Erro na API Mercado Livre:', error);
    return [];
  }
}

export async function searchAmazon(query: string) {
  if (!process.env.AMAZON_ACCESS_KEY) {
    return getMockProducts(query).filter((p: any) => p.store === 'Amazon');
  }
  return getMockProducts(query).filter((p: any) => p.store === 'Amazon');
}

export async function searchShopee(query: string) {
  if (!process.env.SHOPEE_APP_ID) {
    return getMockProducts(query).filter((p: any) => p.store === 'Shopee');
  }
  return getMockProducts(query).filter((p: any) => p.store === 'Shopee');
}

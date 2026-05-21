import express from 'express';
import path from 'path';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';

// ==========================================
// MOCK DATA PARA EXEMPLO QUANDO AS KEYS NÃO ESTIVEREM PRESENTES
// ==========================================
function getMockProducts(query: string) {
  const q = query.toLowerCase();
  return [
    {
      id: 'AMZ-123',
      title: `Amazon - ${query.substring(0, 10)}... Premium`,
      price: 199.99,
      imageUrl: 'https://m.media-amazon.com/images/I/61y2VVWcGBL._AC_SL1500_.jpg',
      store: 'Amazon',
      // Aqui encapsulamos o link mockado para explicar a ideia
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || 'SEU_ID_DE_AFILIADO_AQUI'}`
    },
    {
      id: 'SHP-456',
      title: `Shopee - ${query} Importação Exclusiva`,
      price: 185.50,
      imageUrl: 'https://down-br.img.susercontent.com/file/af8881e1136bba7ec6ed359d91f24d40',
      store: 'Shopee',
      // Universal Link Shopee
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || 'SEU_ID'}`
    }
  ];
}

// ===========================================
// SERVIÇOS DE BUSCA E LINKS DE AFILIADOS
// ===========================================

async function searchMercadoLivre(query: string) {
  try {
    // Mercado Livre tem a API pública de busta GET Sites/MLB, o que nos permite
    // fazer chamadas diretas gratuitamente.
    const response = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`);
    
    // O ID de campanha (Afiliado) do Mercado Livre
    const campId = process.env.ML_AFFILIATE_CAMP_ID || 'SEU_CAMP_ID';

    return response.data.results.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      // Usando imagens de melhor qualidade onde disponível (-O.jpg no lugar de -I.jpg)
      imageUrl: item.thumbnail ? item.thumbnail.replace('-I.jpg', '-O.jpg') : '',
      store: 'Mercado Livre',
      // Aqui adicionamos os UTMs do Afiliado.
      affiliateUrl: `${item.permalink}?campId=${campId}`
    }));
  } catch (error) {
    console.error('Erro na API Mercado Livre:', error);
    return [];
  }
}

async function searchAmazon(query: string) {
  // Amazon PAAPI v5 exige assinatura AWS V4 de requisições HMAC-SHA256
  // e acesso pré-aprovado. Como isso quebra sem as chaves exatas, 
  // simulamos essa busca e mostramos como seria o link de afiliado.
  
  if (!process.env.AMAZON_ACCESS_KEY) {
    console.log('Chaves da Amazon não configuradas, retornando mock.');
    return getMockProducts(query).filter(p => p.store === 'Amazon');
  }

  // A LÓGICA VERDADEIRA PARA A AMAZON SERIA A SEGUINTE:
  // (Normalmente usa-se a biblioteca amazon-paapi para assinar e fazer chamadas mais fácil)
  /*
  const paapi = require('amazon-paapi');
  const requestParameters = {
    Keywords: query,
    SearchIndex: 'All',
    ItemCount: 10,
    Resources: ['Images.Primary.Large', 'ItemInfo.Title', 'Offers.Listings.Price']
  };
  const response = await paapi.SearchItems(process.env.AMAZON_SECRET_KEY, process.env.AMAZON_ACCESS_KEY, process.env.AMAZON_PARTNER_TAG, requestParameters);
  
  return response.SearchResult.Items.map(item => ({
    id: item.ASIN,
    title: item.ItemInfo.Title.DisplayValue,
    price: item.Offers.Listings[0].Price.Amount,
    imageUrl: item.Images.Primary.Large.URL,
    store: 'Amazon',
    affiliateUrl: item.DetailPageURL // A API já devolve o link com o partner_tag embedado automaticamente!
  }));
  */
  return getMockProducts(query).filter(p => p.store === 'Amazon');
}

async function searchShopee(query: string) {
  // A Open API da Shopee requer autenticação OAUTH/Singing e ID específico do App
  if (!process.env.SHOPEE_APP_ID) {
    console.log('Chaves da Shopee não configuradas, retornando mock.');
    return getMockProducts(query).filter(p => p.store === 'Shopee');
  }

  // A LÓGICA VERDADEIRA PARA SHOPEE:
  /*
    1. Assinar a URL usando crypto (HMac)
    2. Usar o Shopee Affiliate Open API para gerar links curtos para cada item
  */
  return getMockProducts(query).filter(p => p.store === 'Shopee');
}

// Inicializa o servidor Express
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Habilitar JSON parser caso necessário para chamadas POST depois
  app.use(express.json());

  // Rota Backend Oculta e Segura
  // O Frontend bate apenas no nosso próprio backend, portanto 
  // o usuário e navegadores NUNCA VEEM nossas chaves API da Amazon e Shopee.
  app.get('/api/search', async (req, res) => {
    const q = req.query.q as string;
    
    if (!q) {
      res.status(400).json({ error: 'Termo de busca (q) é obrigatório' });
      return;
    }

    try {
      console.log(`[BACKEND] Buscando: ${q}...`);
      
      // Promise.all executa as requisições em paralelo. Mais Rapidez.
      const [mlResults, amazonResults, shopeeResults] = await Promise.all([
        searchMercadoLivre(q),
        searchAmazon(q),
        searchShopee(q)
      ]);

      const allResults = [...mlResults, ...amazonResults, ...shopeeResults];
      
      // Ordenação: Do Menor Preço para o Maior
      const sortedResults = allResults.sort((a, b) => a.price - b.price);

      res.json({ products: sortedResults });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar produtos nas lojas parceiras' });
    }
  });

  // Vite Middleware para servir o React em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Configuração para servir os estáticos no ambiente de nuvem
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BACKEND COMPRE C/ COMISSÃO] Rodando na porta ${PORT}`);
  });
}

startServer();

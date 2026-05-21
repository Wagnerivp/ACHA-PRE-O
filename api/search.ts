import { searchMercadoLivre, searchAmazon, searchShopee } from '../src/lib/search';

export default async function handler(req: any, res: any) {
  const q = req.query.q as string;
  
  if (!q) {
    res.status(400).json({ error: 'Termo de busca (q) é obrigatório' });
    return;
  }

  try {
    console.log(`[BACKEND VERCEL] Buscando: ${q}...`);
    
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
}

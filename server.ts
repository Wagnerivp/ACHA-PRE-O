import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { searchMercadoLivre, searchAmazon, searchShopee } from './src/lib/search';

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

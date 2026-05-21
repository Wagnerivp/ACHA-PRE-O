import axios from "axios";

let mlAccessToken = "";
let mlTokenExpiry = 0;

async function getMlAccessToken() {
  if (mlAccessToken && Date.now() < mlTokenExpiry) {
    return mlAccessToken;
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.mercadolibre.com/oauth/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    mlAccessToken = response.data.access_token;
    mlTokenExpiry = Date.now() + 5 * 60 * 60 * 1000;
    return mlAccessToken;
  } catch (error) {
    console.error("Erro ao obter token do Mercado Livre:", error);
    return null;
  }
}

function getMockProducts(query: string) {
  const q = query.toLowerCase();
  return [
    {
      id: "AMZ-123",
      title: `Amazon - ${query.substring(0, 10)}... Premium`,
      price: 199.99,
      imageUrl:
        "https://m.media-amazon.com/images/I/61y2VVWcGBL._AC_SL1500_.jpg",
      store: "Amazon",
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || "SEU_ID_DE_AFILIADO_AQUI"}`,
    },
    {
      id: "SHP-456",
      title: `Shopee - ${query} Importação Exclusiva`,
      price: 185.5,
      imageUrl:
        "https://down-br.img.susercontent.com/file/af8881e1136bba7ec6ed359d91f24d40",
      store: "Shopee",
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || "SEU_ID"}`,
    },
  ];
}

async function searchMercadoLivre(query: string) {
  try {
    const token = await getMlAccessToken();
    const config: any = {};
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await axios.get(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`,
      config,
    );
    const campId = process.env.ML_AFFILIATE_CAMP_ID || "SEU_CAMP_ID";

    return response.data.results.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.thumbnail
        ? item.thumbnail.replace("-I.jpg", "-O.jpg")
        : "",
      store: "Mercado Livre",
      affiliateUrl: `${item.permalink}?campId=${campId}`,
    }));
  } catch (error) {
    console.error("Erro na API Mercado Livre:", error);
    return [];
  }
}

async function searchAmazon(query: string) {
  if (!process.env.AMAZON_ACCESS_KEY) {
    return getMockProducts(query).filter((p: any) => p.store === "Amazon");
  }
  return getMockProducts(query).filter((p: any) => p.store === "Amazon");
}

async function searchShopee(query: string) {
  if (!process.env.SHOPEE_APP_ID) {
    return getMockProducts(query).filter((p: any) => p.store === "Shopee");
  }
  return getMockProducts(query).filter((p: any) => p.store === "Shopee");
}

export default async function handler(req: any, res: any) {
  const q = req.query.q as string;

  if (!q) {
    res.status(400).json({ error: "Termo de busca (q) é obrigatório" });
    return;
  }

  try {
    console.log(`[BACKEND VERCEL] Buscando: ${q}...`);

    // Promise.all executa as requisições em paralelo. Mais Rapidez.
    const [mlResults, amazonResults, shopeeResults] = await Promise.all([
      searchMercadoLivre(q),
      searchAmazon(q),
      searchShopee(q),
    ]);

    const allResults = [...mlResults, ...amazonResults, ...shopeeResults];

    // Ordenação: Do Menor Preço para o Maior
    const sortedResults = allResults.sort((a, b) => a.price - b.price);

    res.json({ products: sortedResults });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erro ao buscar produtos nas lojas parceiras" });
  }
}

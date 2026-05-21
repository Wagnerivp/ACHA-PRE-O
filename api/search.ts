function getMockProducts(query: string) {
  const q = query.toLowerCase();
  return [
    {
      id: "AMZ-123",
      title: `Amazon - ${query.substring(0, 10)}... Premium`,
      price: 199.99,
      imageUrl: "https://m.media-amazon.com/images/I/61y2VVWcGBL._AC_SL1500_.jpg",
      store: "Amazon",
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || "SEU_ID"}`,
    },
    {
      id: "SHP-456",
      title: `Shopee - ${query} Importação Exclusiva`,
      price: 185.5,
      imageUrl: "https://down-br.img.susercontent.com/file/af8881e1136bba7ec6ed359d91f24d40",
      store: "Shopee",
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || "SEU_ID"}`,
    },
  ];
}

async function searchMercadoLivre(query: string) {
  try {
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      }
    );

    if (!response.ok) {
        console.error("ML Error:", await response.text());
        return [];
    }

    const data = await response.json();
    const campId = process.env.ML_AFFILIATE_CAMP_ID || "SEU_CAMP_ID";

    return (data.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      imageUrl: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : "",
      store: "Mercado Livre",
      affiliateUrl: `${item.permalink}?campId=${campId}`,
    }));
  } catch (error: any) {
    console.error("Erro Busca ML:", error.message);
    return [];
  }
}

async function searchAmazon(query: string) {
  return getMockProducts(query).filter((p: any) => p.store === "Amazon");
}

async function searchShopee(query: string) {
  return getMockProducts(query).filter((p: any) => p.store === "Shopee");
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const q = req.query.q as string;

    if (!q) {
      return res.status(400).json({ error: "Termo de busca (q) é obrigatório" });
    }

    const [mlResults, amazonResults, shopeeResults] = await Promise.all([
      searchMercadoLivre(q),
      searchAmazon(q),
      searchShopee(q),
    ]);

    const allResults = [...mlResults, ...amazonResults, ...shopeeResults];
    const sortedResults = allResults.sort((a, b) => a.price - b.price);

    return res.status(200).json({ products: sortedResults });
  } catch (error: any) {
    console.error("Vercel Invocation Error:", error);
    return res.status(500).json({ 
      error: "Erro crítico no servidor", 
      details: error?.message || "Internal Error" 
    });
  }
}


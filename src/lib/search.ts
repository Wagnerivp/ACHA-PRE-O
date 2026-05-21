import axios from "axios";
import crypto from "crypto";

let mlAccessToken = "";
let mlTokenExpiry = 0;

async function getMlAccessToken() {
  // Retorna cache se válido
  if (mlAccessToken && Date.now() < mlTokenExpiry) {
    return mlAccessToken;
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null; // Pode tentar a busca sem auth (se a API permitir)
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
    // Expira em 6 horas, salvamos por 5 horas de margem
    mlTokenExpiry = Date.now() + 5 * 60 * 60 * 1000;
    return mlAccessToken;
  } catch (error) {
    console.error("Erro ao obter token do Mercado Livre:", error);
    return null;
  }
}

export function getMockProducts(query: string) {
  const q = query.toLowerCase();
  return [
    {
      id: "AMZ-" + q,
      title: `${q.toUpperCase()} - Excelente Qualidade (Amazon)`,
      price: Math.floor(Math.random() * 100) + 50 + 0.99,
      imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}`,
      store: "Amazon",
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || "SEU_ID_DE_AFILIADO_AQUI"}`,
    },
    {
      id: "AMZ-2-" + q,
      title: `${q.toUpperCase()} - Premium (Amazon)`,
      price: Math.floor(Math.random() * 200) + 100 + 0.99,
      imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=1`,
      store: "Amazon",
      affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=${process.env.AMAZON_PARTNER_TAG || "SEU_ID_DE_AFILIADO_AQUI"}`,
    },
    {
      id: "SHP-" + q,
      title: `${q.toUpperCase()} - Importação Direta (Shopee)`,
      price: Math.floor(Math.random() * 80) + 30 + 0.50,
      imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=2`,
      store: "Shopee",
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || "SEU_ID"}`,
    },
    {
      id: "SHP-2-" + q,
      title: `${q.toUpperCase()} - Custo Benefício (Shopee)`,
      price: Math.floor(Math.random() * 50) + 20 + 0.50,
      imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=3`,
      store: "Shopee",
      affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F124%2F456&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || "SEU_ID"}`,
    }
  ];
}

export async function searchMercadoLivre(query: string) {
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
    const q = query.toLowerCase();
    return [
      {
        id: "ML-" + q,
        title: `${q.toUpperCase()} - Mais Vendido (Mercado Livre)`,
        price: Math.floor(Math.random() * 90) + 40 + 0.99,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=4`,
        store: "Mercado Livre",
        affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`,
      },
      {
        id: "ML-2-" + q,
        title: `${q.toUpperCase()} - Entrega Full (Mercado Livre)`,
        price: Math.floor(Math.random() * 150) + 70 + 0.99,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=5`,
        store: "Mercado Livre",
        affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`,
      }
    ];
  }
}

export async function searchAmazon(query: string) {
  if (!process.env.AMAZON_ACCESS_KEY) {
    return getMockProducts(query).filter((p: any) => p.store === "Amazon");
  }
  return getMockProducts(query).filter((p: any) => p.store === "Amazon");
}

export async function searchShopee(query: string) {
  const shopeeAppId = process.env.SHOPEE_APP_ID;
  const shopeeSecret = process.env.SHOPEE_APP_SECRET;

  if (shopeeAppId && shopeeSecret) {
    try {
      const path = "/api/v2/affiliate/product/search";
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const baseString = shopeeAppId + path + timestamp;
      const sign = crypto.createHmac("sha256", shopeeSecret).update(baseString).digest("hex");

      const shopeeUrl = new URL(`https://partner.shopeemobile.com${path}`);
      shopeeUrl.searchParams.append("partner_id", shopeeAppId);
      shopeeUrl.searchParams.append("timestamp", timestamp);
      shopeeUrl.searchParams.append("sign", sign);

      const response = await axios.post(shopeeUrl.toString(), {
        keyword: query,
        limit: 10,
        sort_type: 1
      });

      const items = response.data?.data?.item_list || [];
      if (items.length > 0) {
        return items.map((item: any) => ({
          id: `SHP-${item.item_id}`,
          title: item.item_name,
          price: item.price / 100000,
          imageUrl: item.image_url,
          store: "Shopee",
          affiliateUrl: item.product_link || `https://shopee.com.br/product/${item.shop_id}/${item.item_id}?aff_tid=${process.env.SHOPEE_AFFILIATE_ID || ''}`
        }));
      }
    } catch (err) {
      console.error("Shopee API request failed:", err);
    }
  }

  // Fallback se não retornou nada ou não tem chaves
  return getMockProducts(query).filter((p: any) => p.store === "Shopee");
}

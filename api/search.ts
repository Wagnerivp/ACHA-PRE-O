export const config = {
  runtime: 'edge'
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Termo de busca (q) é obrigatório" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const mlResponse = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=10`);
    let mlResults: any[] = [];
    if (mlResponse.ok) {
      const mlData = await mlResponse.json();
      const campId = "SEU_CAMP_ID";
      mlResults = (mlData.results || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        imageUrl: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : "",
        store: "Mercado Livre",
        affiliateUrl: `${item.permalink}?campId=${campId}`
      }));
    } else {
      console.warn("Mercado Livre API failed with status:", mlResponse.status);
      mlResults = [
        {
          id: "ML-" + q,
          title: `${q.toUpperCase()} - Mais Vendido (Mercado Livre)`,
          price: Math.floor(Math.random() * 90) + 40 + 0.99,
          imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=4`,
          store: "Mercado Livre",
          affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`
        },
        {
          id: "ML-2-" + q,
          title: `${q.toUpperCase()} - Entrega Full (Mercado Livre)`,
          price: Math.floor(Math.random() * 150) + 70 + 0.99,
          imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=5`,
          store: "Mercado Livre",
          affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`
        }
      ];
    }

    const amazonResults = [
      {
        id: "AMZ-" + q,
        title: `${q.toUpperCase()} - Excelente Qualidade (Amazon)`,
        price: Math.floor(Math.random() * 100) + 50 + 0.99,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}`,
        store: "Amazon",
        affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=SEU_ID`
      },
      {
        id: "AMZ-2-" + q,
        title: `${q.toUpperCase()} - Premium (Amazon)`,
        price: Math.floor(Math.random() * 200) + 100 + 0.99,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=1`,
        store: "Amazon",
        affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=SEU_ID`
      }
    ];

    const shopeeResults = [
      {
        id: "SHP-" + q,
        title: `${q.toUpperCase()} - Importação Direta (Shopee)`,
        price: Math.floor(Math.random() * 80) + 30 + 0.50,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=2`,
        store: "Shopee",
        affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123&aff_tid=SEU_ID`
      },
      {
        id: "SHP-2-" + q,
        title: `${q.toUpperCase()} - Custo Benefício (Shopee)`,
        price: Math.floor(Math.random() * 50) + 20 + 0.50,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=3`,
        store: "Shopee",
        affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F456&aff_tid=SEU_ID`
      }
    ];

    const allResults = [...mlResults, ...amazonResults, ...shopeeResults];
    allResults.sort((a, b) => a.price - b.price);

    return new Response(JSON.stringify({ products: allResults }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Erro crítico no servidor", details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

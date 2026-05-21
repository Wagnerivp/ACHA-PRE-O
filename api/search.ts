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
    }

    const amazonResults = [
      {
        id: "AMZ-" + q,
        title: `Amazon - ${q.substring(0, 10)}... Premium`,
        price: 199.99,
        imageUrl: "https://m.media-amazon.com/images/I/61y2VVWcGBL._AC_SL1500_.jpg",
        store: "Amazon",
        affiliateUrl: `https://www.amazon.com.br/dp/B0C?tag=SEU_ID`
      }
    ];

    const shopeeResults = [
      {
        id: "SHP-" + q,
        title: `Shopee - ${q} Importação Exclusiva`,
        price: 185.5,
        imageUrl: "https://down-br.img.susercontent.com/file/af8881e1136bba7ec6ed359d91f24d40",
        store: "Shopee",
        affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fproduct%2F123&aff_tid=SEU_ID`
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

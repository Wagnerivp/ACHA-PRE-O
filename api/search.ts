export const config = {
  runtime: 'edge'
};

async function generateShopeeSignature(path: string, partnerId: string, partnerKey: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const baseString = partnerId + path + timestamp;
  const encoder = new TextEncoder();
  
  // Utiliza Web Crypto API disponível no Edge Runtime
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(partnerKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  return {
    timestamp,
    sign: Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

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
    let shopeeResults: any[] = [];
    const shopeeAppId = process.env.SHOPEE_APP_ID;
    const shopeeSecret = process.env.SHOPEE_APP_SECRET;

    if (shopeeAppId && shopeeSecret) {
      try {
        const path = "/api/v2/affiliate/product/search";
        const { timestamp, sign } = await generateShopeeSignature(path, shopeeAppId, shopeeSecret);
        
        const shopeeUrl = new URL(`https://partner.shopeemobile.com${path}`);
        shopeeUrl.searchParams.append("partner_id", shopeeAppId);
        shopeeUrl.searchParams.append("timestamp", timestamp);
        shopeeUrl.searchParams.append("sign", sign);
        
        // Payload Graphql
        const payload = {
          keyword: q,
          limit: 10,
          sort_type: 1 // Por relevância
        };

        const shoppeResponse = await fetch(shopeeUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (shoppeResponse.ok) {
          const sData = await shoppeResponse.json();
          const items = sData?.data?.item_list || [];
          shopeeResults = items.map((item: any) => ({
            id: `SHP-${item.item_id}`,
            title: item.item_name,
            price: item.price / 100000,
            imageUrl: item.image_url,
            store: "Shopee",
            affiliateUrl: item.product_link || `https://shopee.com.br/product/${item.shop_id}/${item.item_id}?aff_tid=${process.env.SHOPEE_AFFILIATE_ID || ''}`
          }));
        } else {
          console.error("Shopee API falhou:", shoppeResponse.status);
        }
      } catch (err) {
        console.error("Shopee Search Error", err);
      }
    }

    // Fallback Mocks caso a API da Shopee ainda não esteja com chaves configuradas
    if (shopeeResults.length === 0) {
      shopeeResults = [
        {
          id: "SHP-" + q,
          title: `${q.toUpperCase()} - Importação Direta (Shopee)`,
          price: Math.floor(Math.random() * 80) + 30 + 0.50,
          imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=2`,
          store: "Shopee",
          affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fsearch%3Fkeyword%3D${encodeURIComponent(q)}&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || 'SEU_ID'}`
        },
        {
          id: "SHP-2-" + q,
          title: `${q.toUpperCase()} - Custo Benefício (Shopee)`,
          price: Math.floor(Math.random() * 50) + 20 + 0.50,
          imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=3`,
          store: "Shopee",
          affiliateUrl: `https://shopee.com.br/universal-link?redir=https%3A%2F%2Fshopee.com.br%2Fsearch%3Fkeyword%3D${encodeURIComponent(q)}&aff_tid=${process.env.SHOPEE_AFFILIATE_ID || 'SEU_ID'}`
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
        affiliateUrl: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${process.env.AMAZON_PARTNER_TAG || 'SEU_ID'}`
      },
      {
        id: "AMZ-2-" + q,
        title: `${q.toUpperCase()} - Premium (Amazon)`,
        price: Math.floor(Math.random() * 200) + 100 + 0.99,
        imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=1`,
        store: "Amazon",
        affiliateUrl: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${process.env.AMAZON_PARTNER_TAG || 'SEU_ID'}`
      }
    ];

    const allResults = [...amazonResults, ...shopeeResults];
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

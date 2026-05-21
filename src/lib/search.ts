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
    }
  ];
}

export async function searchAmazon(query: string) {
  // Amazon relies on mock for demo purposes here or you can add Amazon scraping API.
  if (!process.env.AMAZON_ACCESS_KEY) {
    return getMockProducts(query).filter((p: any) => p.store === "Amazon");
  }
  return getMockProducts(query).filter((p: any) => p.store === "Amazon");
}

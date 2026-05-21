import axios from "axios";

export async function searchAmazon(query: string) {
  try {
    const res = await axios.get(`https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });
    
    if (res.status === 200) {
      const html = res.data;
      const blocks = html.split('data-component-type="s-search-result"').slice(1, 15);
      const results = [];
      const affiliateTag = process.env.AMAZON_PARTNER_TAG || "achapreco-20";
      
      for (const b of blocks) {
        const titleMatch = b.match(/<a class="a-link-normal[^>]*href="([^"]+)"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?<\/a>/);
        const title = titleMatch ? titleMatch[2].trim() : null;
        let link = titleMatch ? titleMatch[1] : null;

        const priceMatch = b.match(/<span class="a-offscreen">([^<]+)<\/span>/);
        let price = null;
        if (priceMatch) {
           const priceStr = priceMatch[1].replace(/[^\d,]/g, '').replace(',', '.');
           price = parseFloat(priceStr);
        }
        
        const imgMatch = b.match(/<img class="s-image" src="([^"]+)"/);
        const img = imgMatch ? imgMatch[1] : null;
        
        if (title && price && img && link) {
          if (!link.startsWith('http')) {
             link = `https://www.amazon.com.br${link}`;
          }
          const urlObj = new URL(link);
          if (affiliateTag) urlObj.searchParams.set("tag", affiliateTag);
          // clean up amazon url
          urlObj.searchParams.delete("ufe");
          urlObj.searchParams.delete("dib");
          urlObj.searchParams.delete("dib_tag");
          
          results.push({
            id: `AMZ-${Date.now()}-${Math.random()}`,
            title: title.length > 80 ? title.substring(0, 80) + '...' : title,
            price: price,
            imageUrl: img,
            store: "Amazon",
            affiliateUrl: urlObj.toString()
          });
        }
      }
      if (results.length > 0) return results;
    }
  } catch (error) {
    console.error("Erro na raspagem da Amazon:", error);
  }
  
  return [];
}

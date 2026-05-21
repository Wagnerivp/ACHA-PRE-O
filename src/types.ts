export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  store: "Amazon" | "Shopee" | "Mercado Livre";
  affiliateUrl: string;
}

export interface SearchResponse {
  products: Product[];
  error?: string;
}

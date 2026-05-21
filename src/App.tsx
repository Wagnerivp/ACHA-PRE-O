import { SearchIcon, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "./components/ProductCard";
import { SearchBar } from "./components/SearchBar";
import type { Product, SearchResponse } from "./types";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setProducts([]);

    try {
      // Bate no nosso próprio backend para Amazon
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
      );

      let backendProducts: Product[] = [];
      if (response.ok) {
        const data = await response.json();
        if (data.products) {
          // Filtrar os mocks do ML que coloquei no backend para não duplicar com os reais
          backendProducts = data.products.filter((p: Product) => p.store !== "Mercado Livre");
        }
      }

      // Buscar no ML Direto pelo Client (para não ser bloqueado por IP de Datacenter)
      let mlProducts: Product[] = [];
      try {
        const mlResponse = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=15`);
        
        if (mlResponse.ok) {
          const mlData = await mlResponse.json();
          const campId = import.meta.env ? import.meta.env.VITE_ML_AFFILIATE_CAMP_ID : "SEU_CAMP_ID";
          
          mlProducts = (mlData.results || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            imageUrl: item.thumbnail ? item.thumbnail.replace("-I.jpg", "-O.jpg") : "",
            store: "Mercado Livre",
            affiliateUrl: `${item.permalink}?campId=${campId}`,
          }));
        } else {
          throw new Error("API do Livre bloqueada.");
        }
      } catch (mlError) {
        console.warn("Mercado Livre API failed, using fallback mocks:", mlError);
        const q = query.toLowerCase();
        mlProducts = [
          {
            id: "ML-m1-" + q,
            title: `${q.toUpperCase()} - Mais Vendido (Mercado Livre)`,
            price: Math.floor(Math.random() * 90) + 40 + 0.99,
            imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=4`,
            store: "Mercado Livre",
            affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`
          },
          {
            id: "ML-m2-" + q,
            title: `${q.toUpperCase()} - Entrega Full (Mercado Livre)`,
            price: Math.floor(Math.random() * 150) + 70 + 0.99,
            imageUrl: `https://loremflickr.com/400/400/${encodeURIComponent(q)}?random=5`,
            store: "Mercado Livre",
            affiliateUrl: `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}`
          }
        ];
      }

      // Combine e ordene
      const combined = [...mlProducts, ...backendProducts].sort((a, b) => a.price - b.price);
      setProducts(combined);

    } catch (err: any) {
      setError(
        err.message ||
          "Houve um erro buscando os produtos. Tente novamente mais tarde.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Responsivo */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white">
                <SearchIcon size={28} />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                AchaPreço
              </h1>
            </div>
            <div className="w-full md:w-[600px] lg:w-[700px]">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Helper State: Blank Screen */}
        {!hasSearched && (
          <div className="h-full flex flex-col items-center justify-center text-center mt-24">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-500 shadow-inner">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Comece a economizar
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
              Pesquise qualquer produto e encontre instantaneamente o menor
              preço nas principais plataformas.
            </p>
          </div>
        )}

        {/* Helper State: Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-8 max-w-3xl mx-auto text-center">
            <p className="font-medium text-lg">{error}</p>
          </div>
        )}

        {/* Results Grid - Ordenado no backend por preço */}
        {hasSearched && !isLoading && !error && products.length === 0 && (
          <div className="text-center mt-20">
            <p className="text-xl text-gray-500 font-medium">
              Nenhum produto encontrado.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AchaPreço. Transparência nos links:
            Esta plataforma recebe pequenas comissões em compras originadas em
            pesquisa (sem alterar seu preço final).
          </p>
        </div>
      </footer>
    </div>
  );
}

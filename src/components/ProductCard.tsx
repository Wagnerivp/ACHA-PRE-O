import { ShoppingBag } from "lucide-react";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Cores de badge para as lojas
  const getStoreStyles = (store: string) => {
    switch (store) {
      case "Amazon":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Shopee":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Mercado Livre":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleBuyClick = () => {
    // Redireciona para o Link de Afiliado, abrindo em nova aba
    window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
  };

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.price);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      {/* Imagem do Produto */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <ShoppingBag className="text-gray-300" size={48} />
        )}

        {/* Badge da Loja Localizado sobre a imagem */}
        <div
          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md bg-opacity-90 ${getStoreStyles(product.store)}`}
        >
          {product.store}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-3">
          {product.title}
        </h3>

        <div className="mt-auto">
          <div className="text-xl font-bold text-gray-900 mb-4">
            {formattedPrice}
          </div>

          <button
            onClick={handleBuyClick}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Ir para a Loja
          </button>
        </div>
      </div>
    </div>
  );
}

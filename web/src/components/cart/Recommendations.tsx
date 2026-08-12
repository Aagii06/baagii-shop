import ProductList from "@/components/home/ProductList";
import productsData from "@/data/products.json";
import type { Product } from "@/types/product";

const products = productsData as Product[];

export default function Recommendations() {
  const suggestions = products.slice(0, 5);

  return (
    <div className="mt-16">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
        Танд санал болгох
      </h2>
      <ProductList products={suggestions} />
    </div>
  );
}

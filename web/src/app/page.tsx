import AllProducts from "@/components/home/AllProducts";
import CategoryScrollRow from "@/components/home/CategoryScrollRow";
import HeroBanner from "@/components/home/HeroBanner";
import { getProducts } from "@/lib/api/products";

export default async function Home() {
  const products = await getProducts().catch(() => []);

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-8">
          <CategoryScrollRow />
          <HeroBanner />
          <AllProducts products={products} />
        </div>
      </div>
    </div>
  );
}

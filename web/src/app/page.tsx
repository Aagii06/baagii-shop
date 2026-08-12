import CategoryScrollRow from "@/components/home/CategoryScrollRow";
import HeroBanner from "@/components/home/HeroBanner";
import QuickSale from "@/components/home/QuickSale";
import products from "@/data/products.json";

export default function Home() {
  const discounted = products.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  );

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-8">
          <CategoryScrollRow />
          <HeroBanner />
          <QuickSale products={discounted} />
        </div>
      </div>
    </div>
  );
}

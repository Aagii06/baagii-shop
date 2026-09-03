import AllProducts from "@/components/home/AllProducts";
import CategoryScrollRow from "@/components/home/CategoryScrollRow";
import CategorySidebar from "@/components/home/CategorySidebar";
import HeroBanner from "@/components/home/HeroBanner";

export default function Home() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CategoryScrollRow />
        <div className="mt-6 flex gap-6 lg:mt-8">
          <CategorySidebar />
          <div className="min-w-0 flex-1 space-y-8">
            <HeroBanner />
            <AllProducts />
          </div>
        </div>
      </div>
    </div>
  );
}

import AllProducts from "@/components/home/AllProducts";
import CategoryScrollRow from "@/components/home/CategoryScrollRow";
import HomeHero from "@/components/home/HomeHero";

export default function Home() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-5 sm:space-y-6">
          <CategoryScrollRow />
          <HomeHero />
          <AllProducts />
        </div>
      </div>
    </div>
  );
}

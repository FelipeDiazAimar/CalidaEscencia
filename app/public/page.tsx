
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import InformationSection from "@/components/home/InformationSection";
import AllProducts from "@/components/home/AllProducts";
import PaymentMethods from "@/components/home/PaymentMethods";
import DiscoverSection from "@/components/home/DiscoverSection";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import FullWidthCategoryCarousel from "@/components/home/FullWidthCategoryCarousel";

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <CategoryCarousel />
      <FullWidthCategoryCarousel />
      <FeaturedProducts />
      <AllProducts />
      <InformationSection />
      <PaymentMethods />
      <DiscoverSection />
    </main>
  );
}

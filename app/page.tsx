import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import InformationSection from "@/components/home/InformationSection";
import CategoryCarousel from "@/components/home/CategoryCarousel";
import AllProducts from "@/components/home/AllProducts";
import PaymentMethods from "@/components/home/PaymentMethods";
import VistaPrincipal from "@/components/home/VistaPrincipal";
import FullWidthCategoryCarousel from "@/components/home/FullWidthCategoryCarousel";

export default function Home() {
  return (
    <div className="flex flex-col overflow-x-hidden">
      <Hero />
      <FeaturedProducts />
      <CategoryCarousel />
      <AllProducts />
      <PaymentMethods />
  <VistaPrincipal />
      <FullWidthCategoryCarousel />
      <InformationSection />
    </div>
  );
}

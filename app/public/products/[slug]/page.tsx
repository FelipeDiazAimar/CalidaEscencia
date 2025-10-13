import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Separator } from '@/components/ui/separator';
import ProductContent from './product-content';
import { api } from '@/lib/api/products';
import type { Metadata } from 'next';

interface ProductDetailProps {
  params: Promise<{ slug: string }>; // Next.js 15 async params
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await api.products.getBySlug(slug);
  
  if (!response.data) {
    return {
      title: 'Producto no encontrado - Calida Escencia',
      description: 'El producto que buscas no fue encontrado.'
    };
  }

  const product = response.data;
  
  return {
    title: `${product.name} - $${product.price} | Calida Escencia`,
    description: product.description || `Compra ${product.name} en Calida Escencia. Productos de calidad con diseños únicos.`,
    openGraph: {
      title: `${product.name} - Calida Escencia`,
      description: product.description || `Descubre ${product.name} en Calida Escencia`,
      images: product.cover_image ? [{ url: product.cover_image }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = await params;
  
  // Get product from database
  const response = await api.products.getBySlug(slug);
  
  if (!response.data) {
    return notFound();
  }

  const product = response.data;

  // Generate slug from product name for consistency
  const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="min-h-screen bg-background">
      <ProductContent product={product} />
      <Suspense>
        <RelatedProducts currentSlug={productSlug} />
      </Suspense>
    </div>
  );
}

async function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  // Get related products from API
  const response = await api.products.getAll();
  const allProducts = response.data || [];
  
  // Filter out current product and get random 4 products
  const related = allProducts
    .filter(p => {
      const slug = p.name.toLowerCase().replace(/\s+/g, '-');
      return slug !== currentSlug && p.is_active;
    })
    .slice(0, 4);
  
  return (
    <div className="container pb-20 mb-16">
  <Separator className="mb-10" />
  <h2 className="font-headline text-2xl md:text-3xl font-semibold tracking-tight mb-8 mt-12">También te puede gustar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-4xl mx-auto">
        {related.map(r => {
          const slug = r.name.toLowerCase().replace(/\s+/g, '-');
          const image = r.cover_image || r.hover_image || '/placeholder-product.jpg';
          return (
            <a key={r.id} href={`/public/products/${slug}`} className="group block">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted ring-1 ring-border/40">
                <Image src={image} alt={r.name} fill className="object-cover transition-all duration-500 group-hover:scale-105" />
              </div>
              <div className="pt-3">
                <p className="text-sm font-medium leading-tight line-clamp-1">{r.name}</p>
                <p className="text-sm text-muted-foreground">${r.price.toFixed(2)}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

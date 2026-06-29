import { useParams } from "wouter";
import { useGetBrand } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";

export default function BrandPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: brand, isLoading } = useGetBrand(slug);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {isLoading ? (
          <div>
            <Skeleton className="h-48" />
            <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
            </div>
          </div>
        ) : !brand ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold">Brand not found</h2>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-primary to-purple-700 text-white py-12" data-testid="brand-hero">
              <div className="container mx-auto px-4 flex items-center gap-6">
                {(brand as any).logo && (
                  <img src={(brand as any).logo} alt={(brand as any).name} className="w-20 h-20 rounded-full object-cover bg-white p-2" />
                )}
                <div>
                  <h1 className="text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-brand-name">{(brand as any).name}</h1>
                  {(brand as any).description && <p className="text-white/80 mt-1">{(brand as any).description}</p>}
                  <p className="text-sm opacity-70 mt-1">{(brand as any).productCount ?? 0} products</p>
                </div>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="brand-products">
                {((brand as any).products ?? []).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

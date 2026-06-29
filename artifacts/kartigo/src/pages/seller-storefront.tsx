import { useParams } from "wouter";
import { useGetSellerStorefront } from "@workspace/api-client-react";
import { Star, ShieldCheck, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";

export default function SellerStorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: seller, isLoading } = useGetSellerStorefront(slug);

  const s = seller as any;

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
        ) : !seller ? (
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold">Seller not found</h2>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-secondary to-orange-600 text-white py-10" data-testid="seller-hero">
              <div className="container mx-auto px-4 flex items-center gap-6">
                {s.storeLogo ? (
                  <img src={s.storeLogo} alt={s.storeName} className="w-20 h-20 rounded-2xl object-cover bg-white" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">{s.storeName.charAt(0)}</div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-seller-name">{s.storeName}</h1>
                    {s.isVerified && <Badge className="bg-white/20 border-0 text-white"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>}
                  </div>
                  {s.description && <p className="text-white/80 mt-1 text-sm">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-white" />{s.rating?.toFixed(1)}</span>
                    <span className="flex items-center gap-1"><Package className="w-4 h-4" />{s.totalProducts} products</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Products by {s.storeName}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="seller-products">
                {(s.products ?? []).map((product: any) => (
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

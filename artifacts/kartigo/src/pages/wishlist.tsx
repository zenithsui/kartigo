import { useGetWishlist, useRemoveFromWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";

export default function WishlistPage() {
  const { isAuthenticated, login } = useAuth();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useGetWishlist({ query: { enabled: isAuthenticated, queryKey: getGetWishlistQueryKey() } });
  const remove = useRemoveFromWishlist();

  const wishlistIds = new Set((items as any[]).map((w) => w.productId));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Heart className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h2>
          <Button onClick={login} className="kartigo-gradient border-0" data-testid="button-login-wishlist">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-wishlist-title">
          My Wishlist <span className="text-muted-foreground font-normal text-lg">({(items as any[]).length})</span>
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        ) : (items as any[]).length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center" data-testid="state-empty-wishlist">
            <Heart className="w-20 h-20 text-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">Save items you love to buy later</p>
            <Link href="/products"><Button className="kartigo-gradient border-0" data-testid="button-explore">Explore Products</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="wishlist-grid">
            {(items as any[]).map((item: any) =>
              item.product ? (
                <ProductCard
                  key={item.id}
                  product={item.product}
                  isWishlisted={wishlistIds.has(item.productId)}
                />
              ) : null,
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

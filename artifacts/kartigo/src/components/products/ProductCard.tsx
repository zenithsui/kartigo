import { Heart, ShoppingCart, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAddToCart, useAddToWishlist, useRemoveFromWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import type { Product } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  compact?: boolean;
}

export default function ProductCard({ product, isWishlisted = false, compact = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Added to cart!", description: product.title });
        },
      },
    );
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist.mutate(
        { productId: product.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          },
        },
      );
    } else {
      addToWishlist.mutate(
        { data: { productId: product.id } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: "Added to wishlist!" });
          },
        },
      );
    }
  }

  const salePrice = product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.sellingPrice;
  const discount = product.discount;
  const isOutOfStock = product.stock === 0;

  return (
    <Link href={`/products/${product.slug}`} data-testid={`card-product-${product.id}`}>
      <div className={cn("product-card group cursor-pointer", compact && "text-sm")}>
        {/* Image */}
        <div className="relative overflow-hidden bg-muted">
          <img
            src={product.thumbnail || product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"}
            alt={product.title}
            className={cn("w-full object-cover transition-transform duration-500 group-hover:scale-105", compact ? "h-40" : "h-56")}
            loading="lazy"
            data-testid={`img-product-${product.id}`}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFlashSale && (
              <Badge className="bg-secondary text-secondary-foreground border-0 text-xs flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Flash
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="bg-primary text-primary-foreground border-0 text-xs" data-testid={`badge-discount-${product.id}`}>
                -{discount}%
              </Badge>
            )}
          </div>
          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow transition-all hover:scale-110"
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={cn("w-4 h-4 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600")} />
          </button>
          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {product.brandName && (
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{product.brandName}</p>
          )}
          <h3 className="font-medium text-foreground line-clamp-2 mb-2 leading-snug" data-testid={`text-product-title-${product.id}`}>
            {product.title}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-0.5 bg-green-600 text-white rounded px-1.5 py-0.5 text-xs font-semibold">
                <span>{product.averageRating.toFixed(1)}</span>
                <Star className="w-2.5 h-2.5 fill-white" />
              </div>
              <span className="text-xs text-muted-foreground">({product.totalReviews.toLocaleString()})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-bold text-foreground text-base" data-testid={`text-price-${product.id}`}>
              {formatCurrency(salePrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.basePrice)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          {!isOutOfStock && (
            <Button
              size="sm"
              className="w-full kartigo-gradient border-0 text-white"
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}

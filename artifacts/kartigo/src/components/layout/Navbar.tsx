import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Package, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All Products", href: "/products" },
  { name: "Electronics", href: "/electronics" },
  { name: "Fashion", href: "/fashion" },
  { name: "Jerseys", href: "/jerseys" },
  { name: "Beauty", href: "/beauty" },
  { name: "Sports", href: "/sports" },
  { name: "Books", href: "/books" },
];

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: getGetCartQueryKey() } });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const cartCount = cart?.itemCount ?? 0;
  const userName = (user as any)?.firstName || (user as any)?.name?.split(" ")[0] || "Me";
  const userRole = (user as any)?.role;

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-border bg-background transition-shadow", scrolled && "shadow-md")}>
      {/* Main navbar */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0" data-testid="link-logo">
            <img src="/logo.png" alt="Kartigo" className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
              <span style={{ color: "#E8890C" }}>Karti</span>
              <span style={{ color: "#2563EB" }}>go</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 hidden sm:flex max-w-2xl">
            <div className="relative w-full">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brands and more..."
                className="pr-12 h-10 border-primary/30 focus:border-primary"
                data-testid="input-search"
              />
              <button type="submit" className="absolute right-0 top-0 h-10 px-3 text-primary hover:text-primary/80" data-testid="button-search-submit">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Wishlist */}
            <Link href="/wishlist" data-testid="link-wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart" data-testid="link-cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs kartigo-gradient border-0 flex items-center justify-center" data-testid="badge-cart-count">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User menu */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2" data-testid="button-user-menu">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={(user as any)?.profileImageUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden md:block">{userName}</span>
                    <ChevronDown className="w-3 h-3 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{(user as any)?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" data-testid="link-profile">
                      <User className="w-4 h-4 mr-2" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" data-testid="link-orders">
                      <Package className="w-4 h-4 mr-2" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  {(userRole === "ADMIN" || userRole === "OWNER") && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-3 py-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Control Panels</p>
                      </div>
                      {(userRole === "ADMIN" || userRole === "OWNER") && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" data-testid="link-admin-panel">
                            <LayoutDashboard className="w-4 h-4 mr-2 text-indigo-600" />
                            <span className="font-medium">Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {userRole === "OWNER" && (
                        <DropdownMenuItem asChild>
                          <Link href="/owner" data-testid="link-owner-panel">
                            <Shield className="w-4 h-4 mr-2 text-amber-600" />
                            <span className="font-medium">Owner Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="button-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={login} size="sm" className="kartigo-gradient border-0" data-testid="button-login">
                <User className="w-4 h-4 mr-1" /> Sign In
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden sm:flex h-10 items-center gap-6 text-sm font-medium overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={cn(
                "whitespace-nowrap transition-colors hover:text-primary",
                location === cat.href ? "text-primary font-semibold" : "text-muted-foreground",
              )}
              data-testid={`link-category-${cat.href.replace("/", "")}`}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/flash-sale"
            className={cn("text-secondary font-semibold whitespace-nowrap hover:text-secondary/80", location === "/flash-sale" && "underline")}
            data-testid="link-flash-sale"
          >
            ⚡ Flash Sale
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border p-4 space-y-4 bg-background">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pr-10"
                data-testid="input-search-mobile"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-full transition-colors",
                  location === cat.href
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground",
                )}
                onClick={() => setMobileOpen(false)}
                data-testid={`link-mobile-category-${cat.href.replace("/", "")}`}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/flash-sale"
              className="text-sm px-3 py-1.5 rounded-full bg-secondary/10 text-secondary font-semibold hover:bg-secondary hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              ⚡ Flash Sale
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

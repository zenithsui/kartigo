import { useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const emojiMap: Record<string, string> = {
  electronics: "📱",
  fashion: "👗",
  "home-kitchen": "🏠",
  beauty: "💄",
  sports: "⚽",
  books: "📚",
  toys: "🧸",
  grocery: "🛒",
  jewellery: "💍",
  automotive: "🚗",
};

const colorMap = [
  "from-purple-400 to-primary",
  "from-orange-400 to-secondary",
  "from-blue-400 to-blue-600",
  "from-pink-400 to-rose-600",
  "from-green-400 to-emerald-600",
  "from-indigo-400 to-indigo-600",
  "from-yellow-400 to-amber-600",
  "from-teal-400 to-teal-600",
];

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useListCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }} data-testid="text-categories-title">All Categories</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="categories-grid">
            {(categories as any[]).map((cat: any, i: number) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} data-testid={`link-cat-${cat.slug}`}>
                <div className={`bg-gradient-to-br ${colorMap[i % colorMap.length]} rounded-2xl p-6 text-white hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer min-h-36 flex flex-col justify-between`}>
                  <span className="text-4xl">{cat.icon || emojiMap[cat.slug] || "🛍️"}</span>
                  <div>
                    <h3 className="font-bold text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>{cat.name}</h3>
                    <p className="text-sm opacity-80">{cat.productCount?.toLocaleString() ?? 0} products</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

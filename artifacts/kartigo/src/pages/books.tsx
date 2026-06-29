import ProductListing from "@/components/products/ProductListing";

export default function BooksPage() {
  return (
    <ProductListing
      category="books"
      title="Books"
      icon="📚"
      description="Fiction, non-fiction, textbooks, and more"
    />
  );
}

import ProductListing from "@/components/products/ProductListing";

export default function FlashSalePage() {
  return (
    <ProductListing
      flashSale={true}
      title="⚡ Flash Sale"
      description="Limited-time deals — grab them before they're gone!"
    />
  );
}

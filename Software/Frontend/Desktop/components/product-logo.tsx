import { productAsset, productBrands, type ProductId } from "@/lib/brand";

export function ProductMark({ product, className = "", decorative = false }: { product: ProductId; className?: string; decorative?: boolean }) {
  return <img src={productAsset(product)} alt={decorative ? "" : productBrands[product].name} width={56} height={56} className={`product-mark ${className}`} />;
}

export function ProductIdentity({ product, description = true }: { product: ProductId; description?: boolean }) {
  const brand = productBrands[product];
  return <div className="product-identity"><ProductMark product={product} decorative /><div><strong>{brand.name}</strong>{description && <span>{brand.purpose}</span>}</div></div>;
}

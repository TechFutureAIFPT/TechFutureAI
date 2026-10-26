"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductMark } from "@/components/product-logo";
import { serviceProducts } from "@/lib/brand";

export function WorkspaceSection() {
  return <div><div className="page-intro"><div><h2>Hệ sinh thái AI Match</h2><p>Sáu dịch vụ kết nối tuyển dụng và phát triển nghề nghiệp. Chọn dịch vụ phù hợp với công việc của bạn.</p></div></div>
    <div className="tool-directory product-directory">{serviceProducts.map((product) => <Link className="tool-directory-link" href={product.href} key={product.id}><ProductMark product={product.id} decorative /><h3>{product.name}</h3><strong className="directory-product-purpose">{product.purpose}</strong><p>{product.description}</p><span>Mở {product.name}<ArrowUpRight size={15} /></span></Link>)}</div>
  </div>;
}

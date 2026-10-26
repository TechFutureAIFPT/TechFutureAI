"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { ProductMark } from "@/components/product-logo";
import { getProductForSection } from "@/lib/brand";
import { canonicalSection, navigationGroups } from "@/lib/navigation";
import { useSalesOps } from "@/lib/sales-ops-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { activeSection, mobileMenuOpen, setMobileMenuOpen } = useSalesOps();
  const pathname = usePathname();
  const currentProduct = getProductForSection(activeSection);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
      if (event.key !== "Tab") return;
      const elements = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [mobileMenuOpen, setMobileMenuOpen]);
  return <>
    {mobileMenuOpen && <button className="app-backdrop" tabIndex={-1} aria-label="Đóng menu điều hướng" onClick={() => setMobileMenuOpen(false)} />}
    <aside ref={panelRef} id="application-navigation" role={mobileMenuOpen ? "dialog" : undefined} aria-modal={mobileMenuOpen ? true : undefined} aria-label="Điều hướng AI Match" className={cn("app-sidebar", mobileMenuOpen && "is-open")}>
      <div className="app-sidebar-brand"><Brand /><button ref={closeRef} className="icon-button mobile-only" aria-label="Đóng điều hướng" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button></div>
      <div className="workspace-label"><ProductMark product={currentProduct.id} className="workspace-avatar" decorative /><div><strong>Không gian AI Match</strong><small>{currentProduct.name}</small></div></div>
      <nav aria-label="Điều hướng chính" className="app-navigation">
        {navigationGroups.map((group) => <div key={group.label} className="app-nav-group"><p>{group.label}</p>
          {group.items.map((item) => {
            const active = pathname === "/dashboard" ? canonicalSection(activeSection) === item.id : pathname === item.href;
            return <Link key={item.id} href={item.href} title={item.description} aria-current={active ? "page" : undefined} className={cn("app-nav-link", active && "is-active")}
              onClick={() => { setMobileMenuOpen(false); }}><item.icon size={17} strokeWidth={1.7} /><span>{item.label}</span></Link>;
          })}
        </div>)}
      </nav>
      <Link href="/" className="app-sidebar-footer"><span>Khám phá nền tảng</span><ArrowUpRight size={15} /></Link>
    </aside>
  </>;
}

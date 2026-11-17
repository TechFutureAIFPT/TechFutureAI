"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Trên điện thoại (< 768px) gom các bộ lọc phụ vào một nút "Bộ lọc" để màn hình
 * chỉ còn ô tìm kiếm; từ tablet trở lên các bộ lọc hiển thị như cũ.
 * Dùng `display: contents` nên các phần tử con vẫn là ô của lưới cha.
 */
export function MobileFilters({ children, activeCount = 0 }: { children: ReactNode; activeCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "md:hidden inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors",
          open || activeCount > 0 ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-700",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Lọc</span>
        {activeCount > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sky-600 px-1 text-[10px] font-bold text-white">{activeCount}</span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <div className={cn("contents", !open && "max-md:hidden")}>{children}</div>
    </>
  );
}

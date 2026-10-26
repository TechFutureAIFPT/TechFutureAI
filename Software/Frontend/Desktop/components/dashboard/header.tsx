"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronDown, LogOut, Search, Settings2, UserRound } from "lucide-react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { canonicalSection, isSection, navigationGroups, navigationItems, sectionHref } from "@/lib/navigation";
import { getProductForSection } from "@/lib/brand";
import { ProductMark } from "@/components/product-logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuthModal } from "./modals/auth-modal";

export function Header() {
  const { activeSection, setIsSearchOpen, notifications, markNotificationAsRead, markAllNotificationsAsRead, authUser, isAuthModalOpen, setIsAuthModalOpen, logoutUser } = useSalesOps();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const user = mounted ? authUser : null;
  const current = navigationItems.find((item) => item.id === canonicalSection(activeSection));
  const visibleNotifications = user ? notifications : [];
  const currentProduct = getProductForSection(current?.id);
  const unread = visibleNotifications.filter((item) => !item.read).length;
  return <>
    <header className="app-header">
      <div className="app-header-context"><ProductMark product={currentProduct.id} className="active-product-mark" decorative /><div><p>{currentProduct.id === "platform" ? "Không gian làm việc" : currentProduct.purpose}</p><h1 className="sr-only">{current?.label || "Tổng quan"}</h1><label className="sr-only" htmlFor="workspace-switcher">Chuyển chức năng AI Match</label><select id="workspace-switcher" className="workspace-switcher" value={current?.id || "overview"} aria-controls="workspace-content" onChange={(event) => {
        if (!isSection(event.target.value)) return;
        const section = canonicalSection(event.target.value);
        router.push(sectionHref(section), { scroll: false });
      }}>{navigationGroups.map((group) => <optgroup label={group.label} key={group.label}>{group.items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}</select></div></div>
      <div className="app-header-actions">
        <button className="app-search" onClick={() => setIsSearchOpen(true)} aria-label="Tìm kiếm hồ sơ và vị trí tuyển dụng"><Search size={17} /><span>Tìm kiếm</span><kbd>Ctrl K</kbd></button>
        <Popover><PopoverTrigger asChild><button className="icon-button notification-button" aria-label={`Thông báo, ${unread} chưa đọc`}><Bell size={19} />{unread > 0 && <span>{unread}</span>}</button></PopoverTrigger>
          <PopoverContent align="end" className="w-[min(360px,calc(100vw-24px))] p-0"><div className="flex items-center justify-between border-b p-4"><strong className="text-sm">Thông báo</strong><button className="text-xs text-primary flex gap-1 items-center" onClick={markAllNotificationsAsRead}><CheckCheck size={14} />Đánh dấu đã đọc</button></div>
            <div className="max-h-80 overflow-auto">{visibleNotifications.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{user ? "Chưa có thông báo mới." : "Đăng nhập để theo dõi thông báo của bạn."}</p> : visibleNotifications.map((item) => <button key={item.id} onClick={() => markNotificationAsRead(item.id)} className={`w-full border-b p-4 text-left hover:bg-muted ${item.read ? "" : "bg-secondary/60"}`}><strong className="block text-sm">{item.title}</strong><span className="block text-xs text-muted-foreground mt-1">{item.message}</span><small className="block text-muted-foreground mt-2">{item.time}</small></button>)}</div>
          </PopoverContent></Popover>
        {user ? <DropdownMenu><DropdownMenuTrigger asChild><button className="account-button" aria-label="Mở menu tài khoản"><span className="account-avatar">{(user.displayName || user.email || "U")[0].toUpperCase()}</span><span className="account-name">{user.displayName || user.email}</span><ChevronDown size={14} /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/dashboard?section=settings"><Settings2 size={16} />Hồ sơ & cài đặt</Link></DropdownMenuItem><DropdownMenuItem onClick={() => setIsAuthModalOpen(true)}><UserRound size={16} />Quản lý tài khoản</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={logoutUser}><LogOut size={16} />Đăng xuất</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : <button aria-label="Đăng nhập" className="platform-button platform-button-small" onClick={() => setIsAuthModalOpen(true)}><UserRound size={16} /><span>Đăng nhập</span></button>}
      </div>
    </header>
    <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
  </>;
}

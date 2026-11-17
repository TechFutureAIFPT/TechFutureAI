import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

export const COPYRIGHT_OWNER = "Trương Minh Hoàng Phúc";
export const COPYRIGHT_GITHUB_URL = "https://github.com/phucwebdev";
const COPYRIGHT_GITHUB_LABEL = "github.com/phucwebdev";

/**
 * Dòng bản quyền dùng chung cho footer trang chủ, trang bộ nhận diện và workspace.
 * `compact` rút gọn cho cột điều hướng hẹp (chỉ tên + biểu tượng GitHub).
 */
export function CopyrightNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <p className={cn("copyright-notice", compact && "is-compact", className)}>
      <span>
        © {year} Bản quyền thuộc về <strong>{COPYRIGHT_OWNER}</strong>
      </span>
      <a
        href={COPYRIGHT_GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="copyright-notice__link"
        aria-label={`GitHub của ${COPYRIGHT_OWNER} (mở trong tab mới)`}
      >
        <Github aria-hidden="true" size={compact ? 13 : 14} strokeWidth={1.8} />
        <span>{compact ? "GitHub" : COPYRIGHT_GITHUB_LABEL}</span>
      </a>
    </p>
  );
}

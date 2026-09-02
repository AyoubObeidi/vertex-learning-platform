import { Bell, ChevronRight, User } from "lucide-react";
import { Logo } from "./Logo";

export function TopNav() {
  return (
    <header className="w-full border-b border-line bg-canvas">
      <nav className="mx-auto flex h-20 w-full max-w-[890px] items-center px-5 sm:h-24 sm:px-0">
        <Logo />
        <div className="hidden items-center gap-11 text-base font-medium text-neutral-900 sm:flex sm:ml-[63px]">
          <a href="#" className="transition-colors hover:text-accent">
            Courses
          </a>
          <a href="#" className="transition-colors hover:text-accent">
            My Learning
          </a>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <button
            type="button"
            aria-label="Notifications"
            className="text-neutral-900 transition-colors hover:text-accent"
          >
            <Bell size={22} strokeWidth={1.75} />
          </button>
          <span
            aria-label="Your account"
            role="img"
            className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full border border-line bg-neutral-100 text-neutral-500"
          >
            <User size={24} strokeWidth={1.75} />
          </span>
        </div>
      </nav>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-2">
          {i > 0 && <ChevronRight size={14} />}
          <span className={i === items.length - 1 ? "text-neutral-900" : ""}>{item}</span>
        </span>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  total,
}: {
  page: number;
  total: number;
}) {
  const pages = Array.from({ length: Math.min(total, 3) }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        disabled={page === 1}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
      >
        <ChevronRight size={16} className="rotate-180" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`flex h-8 w-8 items-center justify-center rounded-md ${
            p === page
              ? "border border-primary-500 text-primary-500 font-medium"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {p}
        </button>
      ))}
      <span className="px-1 text-neutral-400">...</span>
      <button className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100">
        {total}
      </button>
      <button
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

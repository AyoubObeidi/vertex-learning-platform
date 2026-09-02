import { ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

export function TopNav() {
  return (
    <nav className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <Logo />
      <div className="flex items-center gap-6 text-sm font-medium text-neutral-700">
        <a href="#" className="text-neutral-900">
          Courses
        </a>
        <a href="#" className="hover:text-neutral-900">
          My Learning
        </a>
      </div>
    </nav>
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

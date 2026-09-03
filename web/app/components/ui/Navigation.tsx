import { Bell, ChevronRight } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
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
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-base font-medium text-neutral-900 transition-colors hover:text-accent"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-white transition-colors hover:brightness-95"
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-[50px] w-[50px] border border-line",
                },
              }}
            />
          </Show>
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

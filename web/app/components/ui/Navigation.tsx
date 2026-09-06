import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "../theme/ThemeToggle";
import { Logo } from "./Logo";
import { MobileNavMenu } from "./MobileNavMenu";

export function TopNav({ width = "column" }: { width?: "column" | "full" }) {
  // The catalog and course pages centre the nav over their 890px reading
  // column. The lesson page is a full-bleed app shell, so its nav runs the whole
  // width with the same page padding as the content beneath it.
  const inner =
    width === "full"
      ? "w-full px-5 sm:h-25 sm:px-8"
      : "mx-auto w-full max-w-[890px] px-5 sm:h-24 sm:px-0";

  return (
    // `relative` anchors the phone menu's panel, which hangs below the bar.
    <header className="relative w-full border-b border-line bg-canvas">
      <nav className={`flex h-20 items-center ${inner}`}>
        <Link
          href="/"
          aria-label="Vertex home"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
        >
          <Logo size="responsive" />
        </Link>
        <div className="hidden items-center gap-11 text-base font-medium text-neutral-900 sm:flex sm:ml-[63px]">
          <Link href="/courses" className="transition-colors hover:text-accent">
            Courses
          </Link>
          <Link href="/my-learning" className="transition-colors hover:text-accent">
            My Learning
          </Link>
        </div>
        {/* Below `sm` this cluster is what has to fit: the gaps tighten, the
            bell moves into the phone menu, and the buttons shrink a step. */}
        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Notifications"
            className="hidden text-neutral-900 transition-colors hover:text-accent sm:block"
          >
            <Bell size={22} strokeWidth={1.75} />
          </button>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="whitespace-nowrap text-sm font-medium text-neutral-900 transition-colors hover:text-accent sm:text-base"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-accent px-3 text-sm font-medium text-white transition-colors hover:brightness-95 sm:h-11 sm:px-4"
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10 border border-line sm:h-[50px] sm:w-[50px]",
                },
              }}
            />
          </Show>
          <MobileNavMenu />
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

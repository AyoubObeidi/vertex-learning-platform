"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";

/**
 * The nav's phone menu: the links that do not fit beside the auth buttons.
 *
 * At `sm` and up this renders nothing — the same links sit in the bar itself,
 * and the desktop layout is untouched. Below it the bar has room for the logo,
 * the theme toggle and both auth buttons and nothing else, so `Courses`,
 * `My Learning` and the notifications bell live behind this button instead.
 *
 * The panel is absolutely positioned rather than part of the header's flow, so
 * opening it never reflows the page under it. That is also why the header is
 * `relative`.
 */
export function MobileNavMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A tapped link navigates without unmounting this component, so each one
  // closes the panel on the way out. The outside-tap handler below cannot do it:
  // it deliberately ignores taps that land inside the panel.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape should leave focus somewhere sensible, not on a hidden panel.
      buttonRef.current?.focus();
    };

    // A tap anywhere else closes, the way a menu is expected to behave.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex items-center rounded-sm text-neutral-900 outline-none transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
      >
        {open ? (
          <X size={22} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
        )}
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-50 border-b border-line bg-canvas shadow-lg"
      >
        <nav aria-label="Site" className="flex flex-col px-5 py-2">
          <Link
            href="/courses"
            onClick={close}
            className="flex h-12 items-center text-base font-medium text-neutral-900 transition-colors hover:text-accent"
          >
            Courses
          </Link>
          <Link
            href="/my-learning"
            onClick={close}
            className="flex h-12 items-center text-base font-medium text-neutral-900 transition-colors hover:text-accent"
          >
            My Learning
          </Link>
          <button
            type="button"
            className="flex h-12 items-center gap-3 text-base font-medium text-neutral-900 transition-colors hover:text-accent"
          >
            <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
            Notifications
          </button>
        </nav>
      </div>
    </div>
  );
}

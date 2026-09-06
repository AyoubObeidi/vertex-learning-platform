"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { TextInput } from "../ui/Input";

/**
 * The query field on the results page.
 *
 * Submit-driven, not keystroke-driven: every search is an LLM call behind a
 * rate limit (`web/app/api/search/route.ts`), so a learner typing a sentence
 * must cost one request, not thirty.
 *
 * The field keeps its own draft state, seeded from the query that produced the
 * results on screen. `/search` keys this whole subtree on `?q=`, so a new
 * search — including a Back to a previous one — remounts the field with the
 * right value rather than needing an effect to resync it.
 */
export function SearchField({
  query,
  onSubmit,
}: {
  query: string;
  onSubmit: (query: string) => void;
}) {
  const [draft, setDraft] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // The ⌘K the design draws on the field. A shortcut that does nothing is worse
  // than no shortcut, so it is wired here rather than left as decoration.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    inputRef.current?.blur();
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="mx-auto w-full max-w-[730px]">
      <label htmlFor="search-query" className="sr-only">
        Search your learning
      </label>
      <TextInput
        id="search-query"
        ref={inputRef}
        inputSize="search"
        shortcut="⌘ K"
        // 200 is the server's cap in `SearchRequestSchema`; enforcing it here
        // too means a long paste is trimmed in the field instead of 400ing.
        maxLength={200}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") inputRef.current?.blur();
        }}
        placeholder="Ask anything about your learning..."
        autoComplete="off"
        enterKeyHint="search"
      />
    </form>
  );
}

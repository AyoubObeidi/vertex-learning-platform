/**
 * The waiting state.
 *
 * A search is an LLM call with a tool loop behind it, so it takes seconds, not
 * milliseconds. Cards in the shape of the answer keep the page from jumping
 * when the results land, and say what is coming.
 */
export function SearchSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Searching…</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-4 rounded-[14px] border border-line bg-surface p-[18px] sm:flex-row sm:gap-5"
        >
          <div className="aspect-video w-full shrink-0 rounded-xl bg-neutral-100 sm:aspect-auto sm:h-[141px] sm:w-[272px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="h-[26px] w-1/3 rounded-md bg-neutral-100" />
            <div className="h-[22px] w-2/3 rounded-md bg-neutral-100" />
            <div className="h-[16px] w-full rounded-md bg-neutral-100" />
            <div className="h-[16px] w-4/5 rounded-md bg-neutral-100" />
            <div className="mt-auto h-[16px] w-1/2 rounded-md bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

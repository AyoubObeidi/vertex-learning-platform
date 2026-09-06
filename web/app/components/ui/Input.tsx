import { ComponentPropsWithRef, ReactNode, SelectHTMLAttributes } from "react";
import { Search, ChevronDown } from "lucide-react";

// `ComponentPropsWithRef` rather than `InputHTMLAttributes`: React 19 passes a
// `ref` through as an ordinary prop, and the search field needs one to focus
// itself on ⌘K.
interface TextInputProps extends ComponentPropsWithRef<"input"> {
  icon?: ReactNode;
  shortcut?: string;
  inputSize?: "md" | "lg" | "search";
}

const sizeClasses = {
  md: {
    field: "h-11 gap-2 rounded-md border-neutral-200 bg-white px-4 text-sm",
    kbd: "rounded border-neutral-200 px-1.5 py-0.5 text-xs",
  },
  lg: {
    field: "h-16 gap-4 rounded-[14px] border-line bg-surface px-6 text-[17px] sm:h-[84px]",
    kbd: "rounded-sm border-line px-3 py-2 text-sm",
  },
  /** The field on the search results page: shorter than `lg`, on white. */
  search: {
    field: "h-[50px] gap-3 rounded-xl border-line bg-white px-4 text-[15px] sm:px-5",
    kbd: "rounded-md border-line px-2 py-1 text-xs",
  },
} as const;

export function TextInput({
  icon,
  shortcut,
  inputSize = "md",
  className = "",
  ...props
}: TextInputProps) {
  const s = sizeClasses[inputSize];
  const iconSize = { md: 18, lg: 24, search: 20 }[inputSize];
  const defaultIcon = (
    <Search
      size={iconSize}
      strokeWidth={inputSize === "md" ? 1.75 : 2}
      className="shrink-0 text-neutral-500"
    />
  );
  return (
    <div
      className={`flex items-center border text-neutral-900 transition-colors focus-within:border-accent ${s.field} ${className}`}
    >
      {icon ?? defaultIcon}
      <input
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-500"
        {...props}
      />
      {shortcut && (
        <kbd
          className={`shrink-0 border font-sans font-medium text-neutral-700 ${s.kbd}`}
        >
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

const selectSizeClasses = {
  md: "h-11 rounded-md border-neutral-200 px-4 pr-9 text-sm",
  /** The sort control on the search results page. */
  search: "h-[42px] rounded-[10px] border-line px-4 pr-9 text-[14px]",
} as const;

export function Select({
  className = "",
  selectSize = "md",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { selectSize?: "md" | "search" }) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none border bg-white text-neutral-900 outline-none focus:border-accent disabled:opacity-60 ${selectSizeClasses[selectSize]} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
      />
    </div>
  );
}

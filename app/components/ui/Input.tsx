import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Search, ChevronDown } from "lucide-react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  shortcut?: string;
  inputSize?: "md" | "lg";
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
} as const;

/**
 * A styled text input component with optional icon and keyboard shortcut display.
 * Commonly used for search inputs.
 *
 * @param icon - Optional icon to display on the left side
 * @param shortcut - Optional keyboard shortcut to display on the right (e.g., "⌘ K")
 * @param inputSize - Input size variant (md or lg)
 * @param className - Additional CSS classes to apply
 * @param props - Additional HTML input attributes
 */
export function TextInput({
  icon,
  shortcut,
  inputSize = "md",
  className = "",
  ...props
}: TextInputProps) {
  const s = sizeClasses[inputSize];
  const defaultIcon = (
    <Search
      size={inputSize === "lg" ? 24 : 18}
      strokeWidth={inputSize === "lg" ? 2 : 1.75}
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

/**
 * A styled select dropdown component with a custom chevron icon.
 *
 * @param className - Additional CSS classes to apply
 * @param children - Option elements to display in the dropdown
 * @param props - Additional HTML select attributes
 */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`h-11 w-full appearance-none rounded-md border border-neutral-200 bg-white px-4 pr-9 text-sm text-neutral-900 outline-none focus:border-primary-400 ${className}`}
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

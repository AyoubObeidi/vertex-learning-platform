import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Search, ChevronDown } from "lucide-react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  shortcut?: string;
}

export function TextInput({
  icon = <Search size={18} className="text-neutral-500" />,
  shortcut,
  className = "",
  ...props
}: TextInputProps) {
  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 text-sm text-neutral-900 focus-within:border-primary-400 ${className}`}
    >
      {icon}
      <input
        className="flex-1 bg-transparent outline-none placeholder:text-neutral-500"
        {...props}
      />
      {shortcut && (
        <kbd className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}

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

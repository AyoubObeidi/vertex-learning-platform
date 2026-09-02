import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-400 disabled:bg-primary-200 disabled:text-white/70",
  secondary:
    "bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-100 disabled:border-neutral-200 disabled:text-neutral-300",
  tertiary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300",
  text: "bg-transparent text-neutral-900 hover:text-primary-500 px-0 h-auto disabled:text-neutral-300",
};

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isText = variant === "text";
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-medium text-sm transition-colors disabled:cursor-not-allowed ${
        isText ? "" : "h-11 rounded-xl px-4"
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
}

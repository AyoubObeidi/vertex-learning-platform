import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "secondary" | "tertiary" | "text";
type ButtonSize = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  accent:
    "bg-accent text-white hover:brightness-95 disabled:bg-primary-200 disabled:text-white/70",
  primary:
    "bg-primary-500 text-white hover:bg-primary-400 disabled:bg-primary-200 disabled:text-white/70",
  secondary:
    "bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-100 disabled:border-neutral-200 disabled:text-neutral-300",
  tertiary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300",
  text: "bg-transparent text-neutral-900 hover:text-primary-500 px-0 h-auto disabled:text-neutral-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "h-11 gap-1.5 rounded-xl px-4 text-sm",
  lg: "h-[62px] gap-3 rounded-[10px] px-8 text-[17px]",
};

/**
 * A versatile button component with multiple visual variants and sizes.
 * Supports optional icon placement and follows the Vertex design system.
 *
 * @param variant - Visual style of the button (primary, accent, secondary, tertiary, text)
 * @param size - Button size (md or lg)
 * @param icon - Optional icon to display after the button text
 * @param children - Button content
 * @param className - Additional CSS classes to apply
 * @param disabled - Whether the button is disabled
 * @param props - Additional HTML button attributes
 */
export function Button({
  variant = "primary",
  size = "md",
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
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed ${
        isText ? "gap-1.5 text-sm" : sizeClasses[size]
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
}

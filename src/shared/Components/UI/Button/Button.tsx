import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2";

const variantStyles: Record<Variant, string> = {
  primary: "bg-stone-900 text-white hover:bg-stone-800",
  secondary:
    "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700",
  ghost: "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100",
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{ borderRadius: 8 }}
      {...rest}
    >
      {children}
    </button>
  );
}

type BadgeTone = "default" | "danger" | "warn" | "ok" | "info";

const badgeStyles: Record<BadgeTone, string> = {
  default: "bg-stone-100 text-stone-700 ring-stone-300",
  danger: "bg-red-50 text-red-800 ring-red-300",
  warn: "bg-amber-50 text-amber-800 ring-amber-300",
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  info: "bg-blue-50 text-blue-800 ring-blue-300",
};

export function Badge({
  tone = "default",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badgeStyles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`border border-stone-200 bg-white ${padded ? "p-5" : ""} ${className}`}
      style={{ borderRadius: 10 }}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-sm font-semibold text-stone-900 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400 ${className}`}>{children}</p>;
}

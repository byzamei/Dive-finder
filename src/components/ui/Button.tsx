import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const base =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none select-none";

const variants = {
  primary: "bg-ocean-600 text-white hover:bg-ocean-700 active:bg-ocean-800",
  secondary: "bg-abyss-900 text-white hover:bg-abyss-800",
  outline: "border border-abyss-200 text-abyss-800 hover:bg-abyss-50 bg-white",
  ghost: "text-abyss-700 hover:bg-abyss-100",
  coral: "bg-coral-500 text-white hover:bg-coral-600",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

interface ButtonOwnProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

type ButtonProps = ButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";

type ButtonLinkProps = ButtonOwnProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function ButtonLink({ variant = "primary", size = "md", className, href, ...props }: ButtonLinkProps) {
  return <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

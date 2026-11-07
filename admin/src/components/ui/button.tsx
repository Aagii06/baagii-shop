import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // The shop's call-to-action look: purple → blue gradient.
        default: "brand-gradient text-primary-foreground hover:opacity-90",
        dark: "bg-dark text-dark-foreground hover:bg-dark/90",
        soft: "bg-primary-soft text-primary-ink hover:bg-primary/15",
        outline: "border border-border bg-white text-foreground hover:bg-muted",
        danger: "border border-destructive/25 bg-white text-destructive hover:bg-destructive/5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary-ink underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * The button's request is in flight: disabled, with a spinner in place of
   * its icon (icon-only buttons show just the spinner).
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    const iconOnly = typeof size === "string" && size.startsWith("icon");
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          // While loading, the spinner stands in for the button's own icon.
          loading && "[&_svg:not(.btn-spinner)]:hidden"
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="btn-spinner animate-spin" aria-hidden />}
        {loading && iconOnly ? null : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

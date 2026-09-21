import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        pink: "bg-primary-soft text-primary-ink",
        lavender: "bg-secondary text-secondary-foreground",
        mint: "bg-success-soft text-success",
        peach: "bg-warning-soft text-warning",
        dark: "bg-dark text-dark-foreground",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "pink",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

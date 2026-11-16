import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap border border-transparent font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-[230ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-px active:translate-y-0 active:scale-[0.988] disabled:pointer-events-none disabled:opacity-50 motion-reduce:hover:translate-y-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-ink-3",
        accent: "bg-accent text-ink hover:bg-accent-hover",
        secondary: "border-line bg-white text-ink hover:border-[#b9b9b9] hover:bg-subtle",
        ghost: "bg-transparent text-muted hover:bg-subtle hover:text-ink",
        danger: "border-danger/30 bg-danger/5 text-danger hover:bg-danger/10",
      },
      size: {
        sm: "h-9 rounded-[6px] px-[13px] text-[13px]",
        md: "h-[46px] rounded-[8px] px-5 text-[14.5px]",
        lg: "h-[52px] rounded-[8px] px-[26px] text-[15.5px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

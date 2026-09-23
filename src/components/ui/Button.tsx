import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-[38px] px-4 py-2",
          {
            "bg-[#c4121a] text-white hover:bg-brand-800 shadow-sm": variant === "primary",
            "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm": variant === "secondary",
            "border border-slate-200 hover:bg-slate-100 text-slate-700": variant === "outline",
            "hover:bg-slate-100 text-slate-700": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

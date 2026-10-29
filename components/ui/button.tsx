"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "orange" | "ghost" | "outline" | "teal";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      default: "bg-black hover:bg-[#222222] text-white",
      orange: "bg-black hover:bg-[#222222] text-white",
      ghost: "hover:bg-[#f3f3f3] text-[#666666] hover:text-[#111111]",
      outline: "border border-[#d4d4d4] hover:border-[#999999] text-[#111111] hover:bg-[#f8f8f8] bg-white",
      teal: "bg-[#0d9488]/10 hover:bg-[#0d9488]/20 text-[#0d9488] border border-[#0d9488]/30",
    };

    const sizes = {
      sm: "h-7 px-3 text-xs",
      md: "h-8 px-4 text-sm",
      lg: "h-10 px-5 text-sm",
      icon: "h-8 w-8 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

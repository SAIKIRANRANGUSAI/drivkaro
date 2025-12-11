import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
}

export const Button = ({ className, variant = "default", ...props }: ButtonProps) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition";

  const styles = {
    default: "bg-black text-white hover:bg-gray-900",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return <button className={cn(base, styles[variant], className)} {...props} />;
};

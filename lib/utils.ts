import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Wire color by signal type or explicit color name matching Circuit Design Agent spec */
export function wireColor(signalTypeOrColor: string): string {
  const val = (signalTypeOrColor || "").toLowerCase();

  // Explicit color names
  if (val === "red") return "#ef4444";
  if (val === "gray" || val === "black") return "#6b7280";
  if (val === "blue") return "#3b82f6";
  if (val === "green" || val === "i2c-sda" || val === "sda") return "#10b981";
  if (val === "magenta" || val === "purple" || val === "i2c-scl" || val === "scl") return "#d946ef";
  if (val === "yellow" || val === "spi" || val === "uart") return "#eab308";
  if (val === "orange" || val === "pwm") return "#f97316";

  // Signal type fallbacks
  switch (val) {
    case "power":
      return "#ef4444"; // red
    case "ground":
      return "#6b7280"; // gray
    case "data":
      return "#3b82f6"; // blue
    case "clock":
      return "#d946ef"; // magenta/purple
    case "gpio":
      return "#10b981"; // green
    default:
      return "#3b82f6"; // default blue signal
  }
}

/** Pin dot color by pin type */
export function pinDotColor(pinType: string): string {
  switch (pinType) {
    case "power":
      return "#ef4444";
    case "ground":
      return "#6b7280";
    case "signal":
    case "gpio":
      return "#14b8a6"; // teal
    case "data":
      return "#3b82f6";
    case "clock":
      return "#a855f7";
    default:
      return "#14b8a6";
  }
}

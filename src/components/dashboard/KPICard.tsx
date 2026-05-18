import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "red" | "orange" | "purple" | "yellow" | "gray";
  className?: string;
  trend?: number;
}

const colorClasses = {
  blue:   { icon: "bg-blue-100 text-blue-600",   border: "border-l-blue-500" },
  green:  { icon: "bg-green-100 text-green-600", border: "border-l-green-500" },
  red:    { icon: "bg-red-100 text-red-600",     border: "border-l-red-500" },
  orange: { icon: "bg-orange-100 text-orange-600", border: "border-l-orange-500" },
  purple: { icon: "bg-purple-100 text-purple-600", border: "border-l-purple-500" },
  yellow: { icon: "bg-yellow-100 text-yellow-600", border: "border-l-yellow-500" },
  gray:   { icon: "bg-gray-100 text-gray-500",   border: "border-l-gray-400" },
};

export default function KPICard({ title, value, subtitle, icon: Icon, color = "blue", className, trend }: KPICardProps) {
  const colors = colorClasses[color] ?? colorClasses.blue;
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-5 border-l-4 shadow-sm", colors.border, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            {trend !== undefined && trend !== 0 && (
              <span className={`text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-500"}`}>
                {trend > 0 ? "↑" : "↓"}{Math.abs(trend).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

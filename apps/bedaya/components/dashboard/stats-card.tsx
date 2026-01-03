import { Card, CardContent } from "@rawa7el/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "purple" | "green" | "orange";
}

const colorStyles = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = "blue" }: StatsCardProps) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

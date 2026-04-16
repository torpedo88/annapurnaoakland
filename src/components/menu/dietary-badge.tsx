import { cn } from "@/lib/utils";

interface DietaryBadgeProps {
  isVegetarian?: boolean | null;
  isVeganOption?: boolean | null;
  isGlutenFree?: boolean | null;
  className?: string;
}

export function DietaryBadge({
  isVegetarian,
  isVeganOption,
  isGlutenFree,
  className,
}: DietaryBadgeProps) {
  const badges: { label: string; style: string }[] = [];

  if (isVegetarian) {
    badges.push({
      label: "Vegetarian",
      style: "bg-accent/15 text-accent border border-accent/30",
    });
  }
  if (isVeganOption) {
    badges.push({
      label: "Vegan Option",
      style: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    });
  }
  if (isGlutenFree) {
    badges.push({
      label: "Gluten-Free",
      style: "bg-blue-100 text-blue-800 border border-blue-300",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            badge.style
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

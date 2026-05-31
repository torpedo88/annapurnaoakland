import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dishes = [
  {
    name: "Chicken Tikka Masala",
    price: "18.99",
    badge: "Most Popular",
    badgeColor: "bg-primary text-primary-foreground",
    description:
      "Tender chicken marinated in spiced yogurt, slow-cooked in a rich, creamy tomato-based masala. Served with basmati rice.",
    gradient: "from-orange-900 to-red-900",
  },
  {
    name: "Chicken Momo",
    price: "14.99",
    badge: "Nepali Classic",
    badgeColor: "bg-accent text-accent-foreground",
    description:
      "Steamed Himalayan dumplings filled with seasoned ground chicken and fresh herbs. Served with tangy tomato achar.",
    gradient: "from-amber-900 to-yellow-900",
  },
  {
    name: "Mixed Tandoor",
    price: "25.99",
    badge: "Chef's Pick",
    badgeColor: "bg-gold text-foreground",
    description:
      "A generous platter of chicken tikka, seekh kebab, and tandoori shrimp — all fired in our traditional clay oven.",
    gradient: "from-red-900 to-rose-900",
  },
];

export function FeaturedDishes() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-3xl font-bold text-foreground text-center mb-12">
          Signature Dishes
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.name} className="overflow-hidden">
              {/* Gradient image placeholder */}
              <div
                className={`h-48 w-full bg-gradient-to-br ${dish.gradient} flex items-center justify-center`}
              >
                <span className="font-serif text-xl font-bold text-white/80">
                  {dish.name.split(" ")[0]}
                </span>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-serif text-lg font-bold text-foreground">
                    {dish.name}
                  </CardTitle>
                  <span className="font-mono text-base font-semibold text-primary whitespace-nowrap">
                    ${dish.price}
                  </span>
                </div>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dish.badgeColor}`}
                >
                  {dish.badge}
                </span>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dish.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

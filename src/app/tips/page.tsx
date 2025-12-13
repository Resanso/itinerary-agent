'use client';

import { Container, Card } from '@/components/ui';
import { 
  Recycle, 
  Droplet, 
  Bike, 
  TreePine, 
  ShoppingBag, 
  UtensilsCrossed,
  Leaf,
  Footprints,
  Sun,
  Wind
} from 'lucide-react';

const tips = [
  {
    icon: Droplet,
    title: 'Bring Reusable Bottle',
    description: 'Carry a refillable water bottle to reduce single-use plastic waste. Many destinations have water refill stations.',
    color: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Recycle,
    title: 'Reduce Single-Use Plastic',
    description: 'Say no to plastic bags, straws, and cutlery. Bring your own reusable alternatives when possible.',
    color: 'from-green-50 to-emerald-50',
    iconColor: 'text-green-600',
  },
  {
    icon: Bike,
    title: 'Use Public Transport',
    description: 'Opt for buses, trains, or bikes instead of private cars. It reduces carbon footprint and lets you experience local life.',
    color: 'from-purple-50 to-pink-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: TreePine,
    title: 'Respect Local Wildlife',
    description: 'Keep a safe distance from animals, never feed them, and avoid touching or disturbing their natural habitat.',
    color: 'from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: ShoppingBag,
    title: 'Support Local Businesses',
    description: 'Buy from local markets and artisans. This supports the community and reduces transportation emissions.',
    color: 'from-orange-50 to-amber-50',
    iconColor: 'text-orange-600',
  },
  {
    icon: UtensilsCrossed,
    title: 'Choose Local Cuisine',
    description: 'Eat locally-sourced food. It\'s fresher, supports local farmers, and reduces the carbon cost of imported goods.',
    color: 'from-red-50 to-rose-50',
    iconColor: 'text-red-600',
  },
  {
    icon: Leaf,
    title: 'Pack Light',
    description: 'Traveling with less luggage reduces fuel consumption. Pack only what you need and choose versatile clothing.',
    color: 'from-green-50 to-lime-50',
    iconColor: 'text-green-600',
  },
  {
    icon: Footprints,
    title: 'Walk or Cycle',
    description: 'Explore destinations on foot or by bike. It\'s healthier, more immersive, and completely carbon-free.',
    color: 'from-indigo-50 to-blue-50',
    iconColor: 'text-indigo-600',
  },
  {
    icon: Sun,
    title: 'Conserve Energy',
    description: 'Turn off lights, AC, and electronics when leaving your accommodation. Every bit of energy saved helps.',
    color: 'from-yellow-50 to-amber-50',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Wind,
    title: 'Offset Your Carbon',
    description: 'Consider carbon offset programs for flights. Support reforestation or renewable energy projects.',
    color: 'from-teal-50 to-cyan-50',
    iconColor: 'text-teal-600',
  },
];

export default function TipsPage() {
  return (
    <main className="min-h-screen py-12 pt-28" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="lg" padding="md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
            Clean Travel Tips
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Simple practices to make your travels more sustainable and eco-friendly
          </p>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <Card
                key={index}
                variant="glass"
                padding="lg"
                className="hover-lift transition-all duration-300 group"
              >
                <div className={`bg-gradient-to-br ${tip.color} rounded-2xl p-4 mb-4 w-fit group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${tip.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  {tip.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {tip.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </main>
  );
}



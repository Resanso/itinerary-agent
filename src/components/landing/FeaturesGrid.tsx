import { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { Container } from '@/components/ui';

interface FeatureItem {
  icon: ReactNode;
  title: string;
  description: string;
}

// Placeholder icons (can be replaced with Lucide React later)
const SparklesIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const LeafIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const features: FeatureItem[] = [
  {
    icon: <SparklesIcon />,
    title: 'AI-Powered Itineraries',
    description: 'Get personalized travel plans that match your interests while minimizing your environmental impact.',
  },
  {
    icon: <LeafIcon />,
    title: 'Eco-Certified Options',
    description: 'Choose from a curated list of hotels, tours, and transport that meet high sustainability standards',
  },
  {
    icon: <MapIcon />,
    title: 'Carbon Footprint Tracking',
    description: 'Monitor the carbon footprint of your trip and get tips on how to offset it effectively',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-16 sm:py-20 lg:py-24" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="xl" padding="md">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-heading" style={{ color: 'var(--color-text-primary)' }}>
            Smart Planning for a Greener Planet
          </h2>
          <p className="text-base sm:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Our platform provides you with the best tools to plan your travel in a way that's both enjoyable and environmentally friendly. Discover sustainable destinations, eco-certified accommodations, and responsible travel practices that help preserve our planet for future generations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              variant="default"
              padding="lg"
              className="text-center hover-lift"
            >
              <div className="flex justify-center mb-4" style={{ color: 'var(--color-primary)' }}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}


import HeroSection from '@/components/landing/HeroSection';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import SustainabilityBadge from '@/components/landing/SustainabilityBadge';

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <div className="my-20" />
      <FeaturesGrid />
      <SustainabilityBadge />
    </main>
  );
}

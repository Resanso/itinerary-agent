'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HeroSection() {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070)',
        }}
      />
      
      {/* Overlay Gradient - Above background, below text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 font-heading">
          Plan Your Trip, Sustainably.
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
          Create smart, eco-conscious travel itineraries effortlessly and discover a new way to explore our planet. Plan your journey with sustainability in mind, reduce your carbon footprint, and make a positive impact on the destinations you visit.
        </p>
        <Link href="/create" className="inline-block">
          <Button 
            variant="primary" 
            size="lg"
            className="rounded-full text-lg px-8 py-4 transition-all duration-300 hover:scale-105"
            style={{
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
            }}
          >
            Create Itinerary
          </Button>
        </Link>
      </div>
    </section>
  );
}


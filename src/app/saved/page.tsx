'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, Button } from '@/components/ui';
import { MapPin, Calendar, Clock, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  timeSlot: string;
  duration: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Day {
  dayNumber: number;
  date?: string;
  places: Place[];
}

interface SavedItinerary {
  city: string;
  totalDays: number;
  pace: string;
  interests: string[];
  ecoFocus: boolean;
  mapCenter: {
    lat: number;
    lng: number;
  };
  days: Day[];
  savedAt: string;
}

export default function SavedPage() {
  const router = useRouter();
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  useEffect(() => {
    // Load saved itineraries from localStorage
    const saved = localStorage.getItem('savedItineraries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedItinerary[];
        setSavedItineraries(parsed);
      } catch (error) {
        console.error('Error parsing saved itineraries:', error);
      }
    }
  }, []);

  const handleLoadItinerary = (itinerary: SavedItinerary) => {
    // Save to sessionStorage and redirect to result page
    sessionStorage.setItem('itineraryData', JSON.stringify(itinerary));
    router.push('/result');
  };

  const handleDeleteItinerary = (index: number) => {
    const updated = savedItineraries.filter((_, i) => i !== index);
    setSavedItineraries(updated);
    localStorage.setItem('savedItineraries', JSON.stringify(updated));
  };

  if (savedItineraries.length === 0) {
    return (
      <main className="min-h-screen py-12 pt-28" style={{ backgroundColor: 'var(--color-background-main)' }}>
        <Container maxWidth="lg" padding="md">
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary)' }}>
              <MapPin className="w-12 h-12" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h1 className="text-3xl font-bold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
              No Saved Itineraries Yet
            </h1>
            <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Your saved travel plans will appear here. Start creating your first itinerary!
            </p>
            <Button variant="primary" onClick={() => router.push('/create')}>
              Create Itinerary
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 pt-28" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="lg" padding="md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-heading" style={{ color: 'var(--color-text-primary)' }}>
            Saved Itineraries
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            {savedItineraries.length} {savedItineraries.length === 1 ? 'itinerary' : 'itineraries'} saved
          </p>
        </div>

        {/* Itineraries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedItineraries.map((itinerary, index) => {
            const totalPlaces = itinerary.days.reduce((sum, day) => sum + day.places.length, 0);
            const savedDate = new Date(itinerary.savedAt);
            
            return (
              <Card
                key={index}
                variant="glass"
                padding="lg"
                className="hover-lift transition-all duration-300 flex flex-col"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                        {itinerary.totalDays}-Day {itinerary.city}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {itinerary.pace} pace
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItinerary(index)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--color-status-red-text)' }}
                      aria-label="Delete itinerary"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <Calendar className="w-4 h-4" />
                      <span>{itinerary.totalDays} {itinerary.totalDays === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <MapPin className="w-4 h-4" />
                      <span>{totalPlaces} {totalPlaces === 1 ? 'place' : 'places'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <Clock className="w-4 h-4" />
                      <span>Saved {savedDate.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {itinerary.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {itinerary.interests.slice(0, 3).map((interest, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: 'var(--color-secondary)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                      {itinerary.interests.length > 3 && (
                        <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                          +{itinerary.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleLoadItinerary(itinerary)}
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </main>
  );
}



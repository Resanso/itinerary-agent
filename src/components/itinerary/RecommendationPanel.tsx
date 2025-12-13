'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { X, MapPin, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { trpc } from '@/utils/trpc';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface RecommendationPanelProps {
  city: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToDay: (dayNumber: number, place: Place) => void;
  totalDays: number;
}


const categories = ['Nature', 'Culinary', 'Culture', 'History', 'Hidden Gem'];

export default function RecommendationPanel({
  city,
  isOpen,
  onClose,
  onAddToDay,
  totalDays,
}: RecommendationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Fetch recommendations from Gemini API
  const { data: recommendations = [], isLoading, refetch } = trpc.itinerary.getRecommendations.useQuery(
    {
      city,
      category: selectedCategory,
    },
    {
      enabled: isOpen && !!city, // Only fetch when panel is open and city is available
      refetchOnWindowFocus: false,
    }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full md:w-[600px] lg:w-[700px] h-[80vh] md:h-[600px] bg-background-card rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
          <div>
            <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--color-text-primary)' }}>
              Recommended Places
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="p-4 border-b overflow-x-auto" style={{ borderColor: 'var(--color-secondary)' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-text-primary hover:bg-secondary/80'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-text-primary hover:bg-secondary/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--color-primary)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Loading recommendations...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No recommendations found for this category. Try selecting a different category.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 rounded-full bg-primary text-white hover:opacity-90 transition-opacity text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            recommendations.map((place) => (
              <Card
                key={place.id}
                variant="default"
                padding="md"
                className="hover-lift transition-all rounded-xl shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    <MapPin className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                      {place.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {place.description}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                      {place.category}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                      className="text-xs px-2 py-1 rounded-lg border" 
                      style={{ 
                        borderColor: 'var(--color-secondary)',
                        backgroundColor: 'var(--color-background-card)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {Array.from({ length: totalDays }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Day {i + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        onAddToDay(selectedDay, place);
                      }}
                      className="p-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">Add</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}



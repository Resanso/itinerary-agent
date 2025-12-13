'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import { Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

interface ItineraryListProps {
  city: string;
  totalDays: number;
  pace: string;
  days: Day[];
  selectedPlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
}

export default function ItineraryList({
  city,
  totalDays,
  pace,
  days,
  selectedPlaceId,
  onPlaceClick,
}: ItineraryListProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // Default expand day 1

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Nature: '🌿',
      Culinary: '🍽️',
      Culture: '🏛️',
      History: '📜',
      'Hidden Gem': '💎',
    };
    return icons[category] || '📍';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Trip Summary */}
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-heading" style={{ color: 'var(--color-text-primary)' }}>
          {totalDays}-Day {city} Eco-Adventure
        </h1>
      </div>

      {/* Days Accordion */}
      <div className="flex-1 overflow-y-auto">
        {days.map((day) => {
          const isExpanded = expandedDays.has(day.dayNumber);
          return (
            <div key={day.dayNumber} className="border-b" style={{ borderColor: 'var(--color-secondary)' }}>
              {/* Day Header */}
              <button
                onClick={() => toggleDay(day.dayNumber)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
              >
                <div>
                  <h2 className="text-lg font-semibold font-heading" style={{ color: 'var(--color-text-primary)' }}>
                    Day {day.dayNumber}: {day.places[0]?.name ? `${day.places[0].name.split(' ')[0]} Arrival` : `Day ${day.dayNumber}`}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {day.places.length} {day.places.length === 1 ? 'activity' : 'activities'} planned
                  </p>
                </div>
                <span className="text-xl">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Day Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 relative">
                  {/* Timeline Vertical Line - Connects all places */}
                  <div 
                    className="absolute left-[30px] top-0 bottom-0 w-0.5"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  />
                  
                  {day.places.map((place, placeIndex) => {
                    const isSelected = selectedPlaceId === place.id;
                    const isLast = placeIndex === day.places.length - 1;
                    return (
                      <div key={place.id} className="space-y-3 relative">
                        {/* Timeline Dot */}
                        <div 
                          className="absolute left-[30px] top-6 w-3 h-3 rounded-full border-2 z-10"
                          style={{ 
                            backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-background-card)',
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-secondary)',
                            transform: 'translateX(-50%)',
                          }}
                        />
                        
                        <Card
                          variant={isSelected ? 'active' : 'default'}
                          padding="md"
                          className={cn(
                            'cursor-pointer hover-lift transition-all rounded-xl shadow-sm ml-8',
                            isSelected && 'ring-2 ring-primary'
                          )}
                          onClick={() => {
                            if (onPlaceClick) {
                              onPlaceClick(place.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Category Icon */}
                            <div className="text-2xl flex-shrink-0">
                              {getCategoryIcon(place.category)}
                            </div>

                            {/* Place Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold font-heading" style={{ color: 'var(--color-text-primary)' }}>
                                  {place.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    ▼
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    ⋮
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                {place.category}, {place.duration / 60} {place.duration >= 60 ? 'hours' : 'minute'}{place.duration >= 120 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </Card>

                        {/* Etiquette Cards (Show for first place as example) */}
                        {placeIndex === 0 && isExpanded && (
                          <div className="space-y-3 ml-8 relative">
                            <div className="p-4 rounded-xl shadow-sm" style={{ backgroundColor: '#F0FDF4' }}>
                              <div className="flex items-start gap-3 mb-3">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#166534' }} />
                                <h4 className="font-bold text-sm font-heading" style={{ color: '#166534' }}>Do</h4>
                              </div>
                              <ul className="space-y-1.5 text-sm ml-8" style={{ color: '#15803D' }}>
                                <li>• Keep your voice down.</li>
                                <li>• Stay on designated paths.</li>
                                <li>• Take all your trash with you.</li>
                              </ul>
                            </div>
                            <div className="p-4 rounded-xl shadow-sm relative" style={{ backgroundColor: '#FEF2F2' }}>
                              <div className="flex items-start gap-3 mb-3">
                                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#991B1B' }} />
                                <h4 className="font-bold text-sm font-heading" style={{ color: '#991B1B' }}>Don't</h4>
                              </div>
                              <ul className="space-y-1.5 text-sm ml-8" style={{ color: '#DC2626' }}>
                                <li>• Do not bring alcohol.</li>
                                <li>• Do not use sports equipment.</li>
                                <li>• Do not feed the wildlife.</li>
                              </ul>
                            </div>
                            <div className="p-4 rounded-xl shadow-sm relative" style={{ backgroundColor: 'var(--color-accent-warning)' }}>
                              <div className="flex items-start gap-3 mb-3">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                                <h4 className="font-bold text-sm font-heading" style={{ color: '#F59E0B' }}>Warning</h4>
                              </div>
                              <p className="text-sm ml-8 leading-relaxed" style={{ color: '#D97706' }}>
                                Last admission is 30 minutes before closing. Greenhouses close 30 mins before garden.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Destination Button */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
        <Button variant="primary" fullWidth className="flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Add Destination
        </Button>
      </div>
    </div>
  );
}


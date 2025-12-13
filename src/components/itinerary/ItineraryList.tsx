'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import { Plus, CheckCircle, XCircle, AlertTriangle, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onReorder?: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  onRemove?: (dayNumber: number, placeId: string) => void;
  onAddDestination?: () => void;
}

import SortablePlace from './SortablePlace';

export default function ItineraryList({
  city,
  totalDays,
  pace,
  days,
  selectedPlaceId,
  onPlaceClick,
  onReorder,
  onRemove,
  onAddDestination,
}: ItineraryListProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // Default expand day 1
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(new Set()); // Track expanded places

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const togglePlace = (placeId: string) => {
    setExpandedPlaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const handleDragEnd = (event: DragEndEvent, dayNumber: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const day = days.find(d => d.dayNumber === dayNumber);
      if (!day) return;

      const oldIndex = day.places.findIndex(p => p.id === active.id);
      const newIndex = day.places.findIndex(p => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(dayNumber, oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Trip Summary */}
      <div className="p-6 border-b bg-gradient-to-r from-secondary/30 to-transparent" style={{ borderColor: 'var(--color-secondary)' }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-heading tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          {totalDays}-Day {city} Eco-Adventure
        </h1>
        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></span>
            {pace} pace
          </span>
          <span>•</span>
          <span>{days.reduce((sum, day) => sum + day.places.length, 0)} destinations</span>
        </div>
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
                className="w-full p-5 flex items-center justify-between hover:bg-secondary/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {day.dayNumber}
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold font-heading group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                      Day {day.dayNumber}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {day.places.length} {day.places.length === 1 ? 'activity' : 'activities'} planned
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  <span className="text-xl transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    ▶
                  </span>
                </div>
              </button>

              {/* Day Content with Drag & Drop */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 relative">
                  {/* Timeline Vertical Line - Connects all places */}
                  <div 
                    className="absolute left-[30px] top-0 bottom-0 w-0.5"
                    style={{ backgroundColor: 'var(--color-secondary)' }}
                  />
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, day.dayNumber)}
                  >
                    <SortableContext
                      items={day.places.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {day.places.map((place) => {
                        const isSelected = selectedPlaceId === place.id;
                        const isExpandedPlace = expandedPlaces.has(place.id);
                        return (
                          <SortablePlace
                            key={place.id}
                            place={place}
                            isSelected={isSelected}
                            isExpanded={isExpandedPlace}
                            dayNumber={day.dayNumber}
                            city={city}
                            onToggle={() => togglePlace(place.id)}
                            onRemove={() => {
                              if (onRemove && confirm(`Remove ${place.name} from Day ${day.dayNumber}?`)) {
                                onRemove(day.dayNumber, place.id);
                              }
                            }}
                            onPlaceClick={() => {
                              if (onPlaceClick && typeof window !== 'undefined' && window.innerWidth >= 768) {
                                onPlaceClick(place.id);
                              }
                            }}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Destination Button */}
      <div className="p-6 border-t bg-gradient-to-t from-secondary/20 to-transparent" style={{ borderColor: 'var(--color-secondary)' }}>
        <Button 
          variant="primary" 
          fullWidth 
          className="flex items-center justify-center gap-2 rounded-full h-12 font-semibold text-base shadow-soft-primary hover:shadow-glow"
          onClick={onAddDestination}
        >
          <Plus className="w-5 h-5" />
          Add Destination
        </Button>
      </div>
    </div>
  );
}


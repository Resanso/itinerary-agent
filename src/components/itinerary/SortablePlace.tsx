'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';

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

interface SortablePlaceProps {
  place: Place;
  isSelected: boolean;
  isExpanded: boolean;
  dayNumber: number;
  city: string;
  onToggle: () => void;
  onRemove: () => void;
  onPlaceClick?: () => void;
}

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

export default function SortablePlace({
  place,
  isSelected,
  isExpanded,
  dayNumber,
  city,
  onToggle,
  onRemove,
  onPlaceClick,
}: SortablePlaceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  // Fetch place details when expanded
  const { data: placeDetails, isLoading: isLoadingDetails } = trpc.itinerary.getPlaceDetails.useQuery(
    {
      placeName: place.name,
      city: city,
    },
    {
      enabled: isExpanded, // Only fetch when expanded
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
    }
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-3 relative">
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
          'transition-all rounded-xl shadow-sm ml-8 hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
          isDragging && 'opacity-50 shadow-2xl scale-105 rotate-2'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-secondary/50 rounded-lg transition-all flex-shrink-0 hover:scale-110"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Category Icon */}
          <div className="text-2xl flex-shrink-0">
            {getCategoryIcon(place.category)}
          </div>

          {/* Place Info - Clickable */}
          <div 
            className="flex-1 min-w-0 cursor-pointer group"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
              // Only call onPlaceClick on desktop for map highlighting
              if (onPlaceClick && typeof window !== 'undefined' && window.innerWidth >= 768) {
                onPlaceClick();
              }
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold font-heading text-base group-hover:text-primary transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                {place.name}
              </h3>
              <span className="text-xs px-3 py-1 rounded-full flex-shrink-0 font-medium" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                {place.timeSlot}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                {place.category}
              </span>
              <span>•</span>
              <span>
                {Math.floor(place.duration / 60)}h {place.duration % 60 > 0 ? `${place.duration % 60}m` : ''}
              </span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 rounded-lg hover:bg-red-50 transition-all flex-shrink-0 hover:scale-110"
            style={{ color: 'var(--color-status-red-text)' }}
            aria-label="Remove destination"
            title="Remove destination"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Etiquette Cards - Show when place is expanded */}
      <div 
        className={cn(
          'ml-8 relative transition-all duration-300 ease-in-out',
          isExpanded 
            ? 'max-h-[1000px] opacity-100 mt-3 pointer-events-auto' 
            : 'max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none'
        )}
        style={{
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out'
        }}
      >
        <div className="space-y-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Loading details...
              </span>
            </div>
          ) : placeDetails ? (
            <>
              {/* Description */}
              {placeDetails.description && (
                <div className="p-4 rounded-xl shadow-sm" style={{ backgroundColor: 'var(--color-secondary)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    {placeDetails.description}
                  </p>
                </div>
              )}

              {/* Do Card */}
              {placeDetails.dos && placeDetails.dos.length > 0 && (
                <div className="p-4 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: '#F0FDF4', borderLeftColor: '#166534' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#166534' }} />
                    <h4 className="font-bold text-base font-heading" style={{ color: '#166534' }}>Do's</h4>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: '#15803D' }}>
                    {placeDetails.dos.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Don't Card */}
              {placeDetails.donts && placeDetails.donts.length > 0 && (
                <div className="p-4 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: '#FEF2F2', borderLeftColor: '#991B1B' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#991B1B' }} />
                    <h4 className="font-bold text-base font-heading" style={{ color: '#991B1B' }}>Don'ts</h4>
                  </div>
                  <ul className="space-y-2 text-sm" style={{ color: '#DC2626' }}>
                    {placeDetails.donts.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Warning Card */}
              {placeDetails.warnings && placeDetails.warnings.length > 0 && (
                <div className="p-4 rounded-xl shadow-sm border-l-4" style={{ backgroundColor: 'var(--color-accent-warning)', borderLeftColor: '#F59E0B' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                    <h4 className="font-bold text-base font-heading" style={{ color: '#F59E0B' }}>Important Info</h4>
                  </div>
                  <div className="space-y-1.5">
                    {placeDetails.warnings.map((item: string, idx: number) => (
                      <p key={idx} className="text-sm leading-relaxed" style={{ color: '#D97706' }}>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}


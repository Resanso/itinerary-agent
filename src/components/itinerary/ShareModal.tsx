'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { X, Copy, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  timeSlot: string;
  duration: number;
}

interface Day {
  dayNumber: number;
  date?: string;
  places: Place[];
}

interface ShareModalProps {
  city: string;
  totalDays: number;
  pace: string;
  days: Day[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  city,
  totalDays,
  pace,
  days,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const generateSummary = (): string => {
    let summary = `🌱 ${totalDays}-Day ${city} Eco-Adventure Itinerary\n`;
    summary += `Travel Pace: ${pace}\n\n`;
    
    days.forEach((day) => {
      summary += `📅 Day ${day.dayNumber}:\n`;
      day.places.forEach((place, index) => {
        summary += `  ${index + 1}. ${place.name} (${place.timeSlot})\n`;
        summary += `     ${place.category} • ${place.duration / 60} ${place.duration >= 60 ? 'hours' : 'minute'}\n`;
        if (place.description) {
          summary += `     ${place.description}\n`;
        }
        summary += '\n';
      });
      summary += '\n';
    });
    
    summary += `\n✨ Created with Itinerary Agent - Sustainable Travel Planning`;
    
    return summary;
  };

  const summaryText = generateSummary();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full md:w-[600px] lg:w-[700px] max-h-[80vh] bg-background-card rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
          <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--color-text-primary)' }}>
            Share Itinerary
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            value={summaryText}
            readOnly
            className="w-full h-full min-h-[300px] p-4 rounded-xl border resize-none font-mono text-sm"
            style={{
              borderColor: 'var(--color-secondary)',
              backgroundColor: 'var(--color-background-main)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--color-secondary)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {copied ? 'Copied to clipboard!' : 'Click the button to copy the summary'}
          </p>
          <Button
            variant="primary"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Summary
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}



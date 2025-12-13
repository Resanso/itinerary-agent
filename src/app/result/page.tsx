'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ItineraryList from '@/components/itinerary/ItineraryList';
import { Share2, Bookmark } from 'lucide-react';

// Dynamic import untuk MapPlanner dengan SSR disabled
const ItineraryMap = dynamic(
  () => import('@/components/itinerary/ItineraryMap'),
  { ssr: false }
);

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

interface ItineraryData {
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
}

export default function ResultPage() {
  const router = useRouter();
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);

  useEffect(() => {
    // Ambil data dari sessionStorage
    const storedData = sessionStorage.getItem('itineraryData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ItineraryData;
        setItineraryData(data);
        
        // Flatten semua places dari semua days
        const places: Place[] = [];
        data.days.forEach((day) => {
          places.push(...day.places);
        });
        setAllPlaces(places);
      } catch (error) {
        console.error('Error parsing itinerary data:', error);
        // Redirect ke create jika data tidak valid
        router.push('/create');
      }
    } else {
      // Redirect ke create jika tidak ada data
      router.push('/create');
    }
  }, [router]);

  const handlePlaceClick = (placeId: string) => {
    setSelectedPlaceId(placeId);
  };

  if (!itineraryData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background-main)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Itinerary List (40%) */}
        <div className="w-full md:w-[40%] flex-shrink-0 bg-background-card border-r overflow-hidden" style={{ borderColor: 'var(--color-secondary)' }}>
          <ItineraryList
            city={itineraryData.city}
            totalDays={itineraryData.totalDays}
            pace={itineraryData.pace}
            days={itineraryData.days}
            selectedPlaceId={selectedPlaceId}
            onPlaceClick={handlePlaceClick}
          />
        </div>

        {/* Right Side - Map (60%) - Sticky */}
        <div className="hidden md:flex flex-1 relative">
          <div className="sticky top-24 w-full h-[calc(100vh-120px)]">
            <ItineraryMap
              mapCenter={itineraryData.mapCenter}
              places={allPlaces}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={handlePlaceClick}
            />
          </div>
        </div>
      </div>

      {/* Mobile Map View (Full screen when map button clicked) */}
      <div className="md:hidden fixed inset-0 z-50 bg-background-card" style={{ display: selectedPlaceId ? 'block' : 'none' }}>
        <div className="h-full">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-secondary)' }}>
            <h2 className="font-semibold font-heading" style={{ color: 'var(--color-text-primary)' }}>
              Map View
            </h2>
            <button
              onClick={() => setSelectedPlaceId(null)}
              className="px-4 py-2 rounded-[var(--radius-button)] bg-primary text-white"
            >
              Close
            </button>
          </div>
          <div className="h-[calc(100%-73px)]">
            <ItineraryMap
              mapCenter={itineraryData.mapCenter}
              places={allPlaces}
              selectedPlaceId={selectedPlaceId}
              onPlaceClick={handlePlaceClick}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Share and Save */}
      <div className="h-16 border-t flex items-center justify-between px-6 bg-background-card" style={{ borderColor: 'var(--color-secondary)' }}>
        <button 
          className="flex items-center gap-2 font-medium transition-colors hover:text-primary active:scale-95" 
          style={{ color: 'var(--color-text-primary)' }}
          onClick={() => {
            // Share functionality
            if (navigator.share) {
              navigator.share({
                title: `${itineraryData.totalDays}-Day ${itineraryData.city} Eco-Adventure`,
                text: `Check out my ${itineraryData.totalDays}-day sustainable travel itinerary for ${itineraryData.city}!`,
              });
            } else {
              // Fallback: copy to clipboard
              navigator.clipboard.writeText(`${itineraryData.totalDays}-Day ${itineraryData.city} Eco-Adventure`);
            }
          }}
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
        <button 
          className="flex items-center gap-2 font-medium transition-colors hover:text-primary active:scale-95" 
          style={{ color: 'var(--color-text-primary)' }}
          onClick={() => {
            // Save functionality - save to localStorage
            const saved = localStorage.getItem('savedItineraries');
            const savedArray = saved ? JSON.parse(saved) : [];
            savedArray.push({
              ...itineraryData,
              savedAt: new Date().toISOString(),
            });
            localStorage.setItem('savedItineraries', JSON.stringify(savedArray));
            alert('Itinerary saved!');
          }}
        >
          <Bookmark className="w-5 h-5" />
          <span>Save</span>
        </button>
      </div>
    </main>
  );
}


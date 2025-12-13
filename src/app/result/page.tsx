'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ItineraryList from '@/components/itinerary/ItineraryList';
import RecommendationPanel from '@/components/itinerary/RecommendationPanel';
import ShareModal from '@/components/itinerary/ShareModal';
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
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  const handleReorder = (dayNumber: number, fromIndex: number, toIndex: number) => {
    if (!itineraryData) return;
    
    const updatedDays = [...itineraryData.days];
    const dayIndex = updatedDays.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const day = { ...updatedDays[dayIndex] };
    const places = [...day.places];
    const [moved] = places.splice(fromIndex, 1);
    places.splice(toIndex, 0, moved);
    
    day.places = places;
    updatedDays[dayIndex] = day;
    
    const updatedData = { ...itineraryData, days: updatedDays };
    setItineraryData(updatedData);
    sessionStorage.setItem('itineraryData', JSON.stringify(updatedData));
    
    // Update allPlaces
    const newAllPlaces: Place[] = [];
    updatedDays.forEach((d) => {
      newAllPlaces.push(...d.places);
    });
    setAllPlaces(newAllPlaces);
  };

  const handleRemove = (dayNumber: number, placeId: string) => {
    if (!itineraryData) return;
    
    const updatedDays = [...itineraryData.days];
    const dayIndex = updatedDays.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const day = { ...updatedDays[dayIndex] };
    day.places = day.places.filter(p => p.id !== placeId);
    
    updatedDays[dayIndex] = day;
    
    const updatedData = { ...itineraryData, days: updatedDays };
    setItineraryData(updatedData);
    sessionStorage.setItem('itineraryData', JSON.stringify(updatedData));
    
    // Update allPlaces
    const newAllPlaces: Place[] = [];
    updatedDays.forEach((d) => {
      newAllPlaces.push(...d.places);
    });
    setAllPlaces(newAllPlaces);
    
    // Clear selection if removed place was selected
    if (selectedPlaceId === placeId) {
      setSelectedPlaceId(null);
    }
  };

  const handleAddToDay = (dayNumber: number, place: Place) => {
    if (!itineraryData) return;
    
    const updatedDays = [...itineraryData.days];
    const dayIndex = updatedDays.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex === -1) return;
    
    const day = { ...updatedDays[dayIndex] };
    // Add place with default time slot and duration
    const newPlace: Place = {
      ...place,
      timeSlot: day.places.length > 0 
        ? day.places[day.places.length - 1].timeSlot 
        : '09:00',
      duration: 120, // Default 2 hours
    };
    day.places = [...day.places, newPlace];
    
    updatedDays[dayIndex] = day;
    
    const updatedData = { ...itineraryData, days: updatedDays };
    setItineraryData(updatedData);
    sessionStorage.setItem('itineraryData', JSON.stringify(updatedData));
    
    // Update allPlaces
    const newAllPlaces: Place[] = [];
    updatedDays.forEach((d) => {
      newAllPlaces.push(...d.places);
    });
    setAllPlaces(newAllPlaces);
    
    setIsRecommendationOpen(false);
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
      <div className="flex-1 flex overflow-hidden pt-20">
        {/* Left Sidebar - Itinerary List (40%) */}
        <div className="w-full md:w-[40%] flex-shrink-0 bg-background-card border-r overflow-hidden shadow-lg" style={{ borderColor: 'var(--color-secondary)' }}>
          <ItineraryList
            city={itineraryData.city}
            totalDays={itineraryData.totalDays}
            pace={itineraryData.pace}
            days={itineraryData.days}
            selectedPlaceId={selectedPlaceId}
            onPlaceClick={handlePlaceClick}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onAddDestination={() => setIsRecommendationOpen(true)}
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

      {/* Mobile Map View - Removed as we don't want full screen map on click */}

      {/* Bottom Bar - Share and Save */}
      <div className="h-16 border-t flex items-center justify-center gap-4 px-6 bg-background-card shadow-lg" style={{ borderColor: 'var(--color-secondary)' }}>
        <button 
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all hover:bg-secondary active:scale-95 hover:shadow-md" 
          style={{ color: 'var(--color-text-primary)' }}
          onClick={() => setIsShareModalOpen(true)}
        >
          <Share2 className="w-5 h-5" />
          <span>Share Itinerary</span>
        </button>
        <button 
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all hover:bg-primary hover:text-white active:scale-95 hover:shadow-md" 
          style={{ 
            color: 'var(--color-primary)',
            border: '2px solid var(--color-primary)',
          }}
          onClick={() => {
            // Save functionality - save to localStorage
            const saved = localStorage.getItem('savedItineraries');
            const savedArray = saved ? JSON.parse(saved) : [];
            savedArray.push({
              ...itineraryData,
              savedAt: new Date().toISOString(),
            });
            localStorage.setItem('savedItineraries', JSON.stringify(savedArray));
            alert('Itinerary saved successfully! ✨');
          }}
        >
          <Bookmark className="w-5 h-5" />
          <span>Save Itinerary</span>
        </button>
      </div>

      {/* Recommendation Panel */}
      {itineraryData && (
        <RecommendationPanel
          city={itineraryData.city}
          isOpen={isRecommendationOpen}
          onClose={() => setIsRecommendationOpen(false)}
          onAddToDay={handleAddToDay}
          totalDays={itineraryData.totalDays}
        />
      )}

      {/* Share Modal */}
      {itineraryData && (
        <ShareModal
          city={itineraryData.city}
          totalDays={itineraryData.totalDays}
          pace={itineraryData.pace}
          days={itineraryData.days}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </main>
  );
}


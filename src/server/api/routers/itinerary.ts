import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { GoogleGenAI } from '@google/genai';

// Zod schemas untuk validasi
const paceEnum = z.enum(['Relaxed', 'Moderate', 'Fast-Paced']);
const interestEnum = z.enum(['Nature', 'Culinary', 'Culture', 'History', 'Hidden Gem']);

const generatePlanInput = z.object({
  city: z.string().min(1, 'City is required'),
  days: z.number().int().min(1, 'Days must be at least 1').max(10, 'Days cannot exceed 10'),
  pace: paceEnum,
  interests: z.array(interestEnum).min(1, 'At least one interest is required'),
  ecoFocus: z.boolean().optional().default(false),
});

// Type untuk response
type Place = {
  id: string;
  name: string;
  description: string;
  category: string;
  timeSlot: string; // Format: "09:00" atau "09:00-10:30"
  duration: number; // dalam menit
  coordinates: {
    lat: number;
    lng: number;
  };
  thumbnail?: string;
};

type Day = {
  dayNumber: number;
  date?: string;
  places: Place[];
};

type ItineraryResponse = {
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
};

// Helper function untuk generate mockup data
function generateMockItinerary(
  city: string,
  days: number,
  pace: string,
  interests: string[]
): ItineraryResponse {
  // Map center berdasarkan city (mockup)
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    Bali: { lat: -8.3405, lng: 115.092 },
    Bandung: { lat: -6.9175, lng: 107.6191 },
    Yogyakarta: { lat: -7.7956, lng: 110.3695 },
  };

  const mapCenter = cityCoordinates[city] || { lat: -6.2088, lng: 106.8456 }; // Default Jakarta

  // Mockup places berdasarkan interests
  const mockPlaces: Record<string, Place[]> = {
    Nature: [
      {
        id: 'nature-1',
        name: 'Taman Nasional',
        description: 'Beautiful natural park with diverse flora and fauna',
        category: 'Nature',
        timeSlot: '09:00',
        duration: 120,
        coordinates: { lat: mapCenter.lat + 0.01, lng: mapCenter.lng + 0.01 },
      },
      {
        id: 'nature-2',
        name: 'Air Terjun',
        description: 'Scenic waterfall perfect for nature lovers',
        category: 'Nature',
        timeSlot: '14:00',
        duration: 90,
        coordinates: { lat: mapCenter.lat + 0.02, lng: mapCenter.lng - 0.01 },
      },
    ],
    Culinary: [
      {
        id: 'culinary-1',
        name: 'Restoran Tradisional',
        description: 'Authentic local cuisine experience',
        category: 'Culinary',
        timeSlot: '12:00',
        duration: 60,
        coordinates: { lat: mapCenter.lat - 0.01, lng: mapCenter.lng + 0.01 },
      },
      {
        id: 'culinary-2',
        name: 'Warung Makan',
        description: 'Local street food experience',
        category: 'Culinary',
        timeSlot: '19:00',
        duration: 90,
        coordinates: { lat: mapCenter.lat - 0.02, lng: mapCenter.lng - 0.01 },
      },
    ],
    Culture: [
      {
        id: 'culture-1',
        name: 'Museum Sejarah',
        description: 'Historical museum showcasing local heritage',
        category: 'Culture',
        timeSlot: '10:00',
        duration: 90,
        coordinates: { lat: mapCenter.lat + 0.015, lng: mapCenter.lng + 0.015 },
      },
      {
        id: 'culture-2',
        name: 'Candi Kuno',
        description: 'Ancient temple with rich cultural significance',
        category: 'Culture',
        timeSlot: '15:00',
        duration: 120,
        coordinates: { lat: mapCenter.lat - 0.015, lng: mapCenter.lng + 0.02 },
      },
    ],
    History: [
      {
        id: 'history-1',
        name: 'Situs Bersejarah',
        description: 'Historical site with important cultural value',
        category: 'History',
        timeSlot: '11:00',
        duration: 90,
        coordinates: { lat: mapCenter.lat + 0.02, lng: mapCenter.lng - 0.015 },
      },
    ],
    'Hidden Gem': [
      {
        id: 'hidden-1',
        name: 'Tempat Tersembunyi',
        description: 'Off the beaten path destination',
        category: 'Hidden Gem',
        timeSlot: '16:00',
        duration: 120,
        coordinates: { lat: mapCenter.lat - 0.02, lng: mapCenter.lng + 0.02 },
      },
    ],
  };

  // Generate days berdasarkan jumlah hari dan pace
  const daysData: Day[] = [];
  let currentTime = 9; // Start at 9:00 AM

  for (let day = 1; day <= days; day++) {
    const dayPlaces: Place[] = [];
    
    // Tentukan jumlah aktivitas berdasarkan pace
    let activitiesPerDay = 3; // Default Moderate
    if (pace === 'Relaxed') {
      activitiesPerDay = 2;
    } else if (pace === 'Fast-Paced') {
      activitiesPerDay = 5;
    }

    // Pilih places berdasarkan interests
    const selectedPlaces: Place[] = [];
    interests.forEach((interest) => {
      if (mockPlaces[interest]) {
        selectedPlaces.push(...mockPlaces[interest]);
      }
    });

    // Generate places untuk hari ini
    for (let i = 0; i < activitiesPerDay && i < selectedPlaces.length; i++) {
      const place = { ...selectedPlaces[i % selectedPlaces.length] };
      place.id = `${place.id}-day${day}-${i}`;
      
      // Set time slot
      const hours = Math.floor(currentTime);
      const minutes = (currentTime % 1) * 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      place.timeSlot = timeStr;
      
      // Adjust coordinates untuk variasi
      place.coordinates = {
        lat: mapCenter.lat + (Math.random() * 0.05 - 0.025),
        lng: mapCenter.lng + (Math.random() * 0.05 - 0.025),
      };

      dayPlaces.push(place);

      // Update current time (add duration + travel time)
      currentTime += place.duration / 60 + 0.5; // Add 30 min travel time
      
      // Lunch break at 12:00
      if (currentTime >= 12 && currentTime < 13) {
        currentTime = 13;
      }
    }

    daysData.push({
      dayNumber: day,
      places: dayPlaces,
    });

    // Reset time untuk hari berikutnya
    currentTime = 9;
  }

  return {
    city,
    totalDays: days,
    pace,
    interests,
    ecoFocus: false,
    mapCenter,
    days: daysData,
  };
}

// Helper function untuk mendapatkan API key
function getGeminiApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

// Helper function untuk parse JSON dari Gemini response
function parseGeminiResponse(text: string): ItineraryResponse {
  try {
    // Coba extract JSON dari response (bisa ada markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks jika ada
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(jsonText);
    return parsed as ItineraryResponse;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Response text:', text);
    throw new Error('Failed to parse Gemini AI response. Please try again.');
  }
}

export const itineraryRouter = router({
  generatePlan: publicProcedure
    .input(generatePlanInput)
    .mutation(async ({ input }) => {
      try {
        // Initialize Gemini AI
        const apiKey = getGeminiApiKey();
        const genAI = new GoogleGenAI({
          vertexai: false,
          apiKey: apiKey,
        });

        // Build prompt dengan semua input user
        const prompt = `You are an expert travel planner specializing in sustainable and eco-friendly tourism. Create a detailed ${input.days}-day itinerary for ${input.city}, Indonesia.

Requirements:
- Travel pace: ${input.pace}
- Interests: ${input.interests.join(', ')}
- ${input.ecoFocus ? 'Prioritize eco-friendly and sustainable options.' : ''}
- Start each day at 09:00
- Include lunch break (12:00-13:00)
- Each place must have realistic coordinates (latitude and longitude) for ${input.city}
- Duration should be realistic (in minutes)
- Time slots should be sequential and logical

For each day, create places that match the interests. Consider:
- Proximity between places (group nearby attractions)
- Realistic travel time between locations
- Opening hours and accessibility
- Sustainable travel options when ecoFocus is true

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations, just JSON):
{
  "city": "${input.city}",
  "totalDays": ${input.days},
  "pace": "${input.pace}",
  "interests": ${JSON.stringify(input.interests)},
  "ecoFocus": ${input.ecoFocus},
  "mapCenter": {
    "lat": <realistic latitude for ${input.city}>,
    "lng": <realistic longitude for ${input.city}>
  },
  "days": [
    {
      "dayNumber": 1,
      "places": [
        {
          "id": "unique-id-1",
          "name": "Place Name",
          "description": "Brief description of the place",
          "category": "${input.interests[0]}",
          "timeSlot": "09:00",
          "duration": 120,
          "coordinates": {
            "lat": <realistic latitude>,
            "lng": <realistic longitude>
          }
        }
      ]
    }
  ]
}

Important:
- Use REAL place names and descriptions for ${input.city}
- Ensure coordinates are accurate for ${input.city}
- All time slots must be in "HH:MM" format
- Duration is in minutes
- Generate ${input.days} days with appropriate number of places per day based on pace:
  * Relaxed: 2-3 places per day
  * Moderate: 3-4 places per day
  * Fast-Paced: 4-6 places per day
- Make sure places are real and exist in ${input.city}
- Return ONLY the JSON, no other text`;

        // Generate content dengan Gemini (non-streaming)
        const result = await genAI.models.generateContent({
          model: 'gemini-1.5-flash', // atau 'gemini-1.5-pro' untuk lebih akurat
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        });

        // Extract text response
        const responseText = result.response.text();
        
        // Parse JSON response
        const itinerary = parseGeminiResponse(responseText);

        // Validate structure
        if (!itinerary.days || !Array.isArray(itinerary.days)) {
          throw new Error('Invalid response structure: missing days array');
        }

        if (!itinerary.mapCenter || !itinerary.mapCenter.lat || !itinerary.mapCenter.lng) {
          throw new Error('Invalid response structure: missing mapCenter coordinates');
        }

        // Ensure all places have IDs
        itinerary.days.forEach((day, dayIndex) => {
          day.places.forEach((place, placeIndex) => {
            if (!place.id) {
              place.id = `${day.dayNumber}-place-${placeIndex + 1}`;
            }
          });
        });

        return itinerary;
      } catch (error: any) {
        console.error('Error generating itinerary with Gemini:', error);
        
        // Fallback ke mockup data jika Gemini error
        console.warn('Falling back to mockup data');
        return generateMockItinerary(
          input.city,
          input.days,
          input.pace,
          input.interests
        );
      }
    }),
});


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

const getRecommendationsInput = z.object({
  city: z.string().min(1, 'City is required'),
  category: z.string().optional(),
});

const getPlaceDetailsInput = z.object({
  placeName: z.string().min(1, 'Place name is required'),
  city: z.string().min(1, 'City is required'),
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

// Type untuk recommendations (tanpa timeSlot dan duration)
type RecommendationPlace = {
  id: string;
  name: string;
  description: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
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
  // Use the provided API key or fallback to environment variable
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyBynlIxSXWb9uqfx71_q4md9dJZDasOYlc';
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
        let responseText = '';
        try {
          // Try to access response text - different API versions may have different structures
          if ((result as any).response?.text) {
            responseText = (result as any).response.text();
          } else if ((result as any).text) {
            responseText = (result as any).text();
          } else if (typeof (result as any).toString === 'function') {
            responseText = (result as any).toString();
          } else {
            // Last resort: try to get text from candidates
            const candidates = (result as any).candidates;
            if (candidates && candidates[0]?.content?.parts) {
              responseText = candidates[0].content.parts.map((p: any) => p.text).join('');
            }
          }
        } catch (e) {
          console.error('Error extracting text from response:', e);
          throw new Error('Failed to extract response from Gemini API');
        }
        
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

  getRecommendations: publicProcedure
    .input(getRecommendationsInput)
    .query(async ({ input }) => {
      try {
        const { city, category } = input;
        
        // Get city coordinates for validation
        const cityCoordinates: Record<string, { lat: number; lng: number; province?: string }> = {
          'Semarang': { lat: -7.0051, lng: 110.4381, province: 'Central Java' },
          'Rembang': { lat: -6.7183, lng: 111.3486, province: 'Central Java' },
          'Jakarta': { lat: -6.2088, lng: 106.8456, province: 'Jakarta' },
          'Bandung': { lat: -6.9175, lng: 107.6191, province: 'West Java' },
          'Yogyakarta': { lat: -7.7956, lng: 110.3695, province: 'Yogyakarta' },
          'Surabaya': { lat: -7.2575, lng: 112.7521, province: 'East Java' },
          'Bali': { lat: -8.3405, lng: 115.092, province: 'Bali' },
          'Malang': { lat: -7.9797, lng: 112.6304, province: 'East Java' },
          'Solo': { lat: -7.5755, lng: 110.8243, province: 'Central Java' },
          'Medan': { lat: 3.5952, lng: 98.6722, province: 'North Sumatra' },
          'Makassar': { lat: -5.1477, lng: 119.4327, province: 'South Sulawesi' },
        };

        // Get city info, if not found, try to get approximate coordinates from prompt
        let cityInfo = cityCoordinates[city];
        if (!cityInfo) {
          // For unknown cities, use a default but make prompt more explicit
          console.warn(`[getRecommendations] City "${city}" not in coordinates list, using default`);
          cityInfo = { lat: -6.2088, lng: 106.8456, province: 'Indonesia' };
        }
        const latRange = { min: cityInfo.lat - 0.5, max: cityInfo.lat + 0.5 };
        const lngRange = { min: cityInfo.lng - 0.5, max: cityInfo.lng + 0.5 };
        
        // Initialize Gemini AI
        const apiKey = getGeminiApiKey();
        const genAI = new GoogleGenAI({
          vertexai: false,
          apiKey: apiKey,
        });

        // Build prompt untuk mendapatkan rekomendasi tempat
        const categoryFilter = category ? ` in the ${category} category` : '';
        const provinceInfo = cityInfo.province ? `, ${cityInfo.province}` : '';
        const isKnownCity = cityCoordinates[city] !== undefined;
        
        const prompt = `You are an expert travel guide specializing in ${city}${provinceInfo}, Indonesia. 

CRITICAL REQUIREMENT: You MUST provide recommendations ONLY for places located in ${city}${provinceInfo}, Indonesia. 
- DO NOT include places from Jakarta, Bandung, Yogyakarta, Semarang, or any other cities
- ALL places must be specifically located in ${city}${provinceInfo}
- ${isKnownCity ? '' : `IMPORTANT: ${city} is a real city in Indonesia. Provide real places that exist in ${city}.`}
- If you don't know enough places in ${city}, you can include nearby places within ${city} city limits or regency only

Provide a list of 8-12 real, actual tourist destinations and places in ${city}${provinceInfo}${categoryFilter}.

Requirements:
- ALL places MUST be located in ${city}${provinceInfo}, Indonesia
- Return ONLY real, existing places that are actually in ${city}
- DO NOT include places from other cities
- Include popular and well-known destinations in ${city}
- If category is specified (${category || 'any'}), prioritize places matching that category
- Each place must have accurate coordinates (latitude and longitude) specifically for ${city}
- Coordinates for ${city} should be around latitude ${cityInfo.lat.toFixed(4)} (range: ${latRange.min.toFixed(2)} to ${latRange.max.toFixed(2)}) and longitude ${cityInfo.lng.toFixed(4)} (range: ${lngRange.min.toFixed(2)} to ${lngRange.max.toFixed(2)})
- Provide realistic descriptions (2-3 sentences)

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations, just JSON):
[
  {
    "id": "unique-id-1",
    "name": "Real Place Name in ${city}",
    "description": "Brief description of the place in ${city} (2-3 sentences)",
    "category": "${category || 'Nature'}",
    "coordinates": {
      "lat": <realistic latitude for ${city}, around ${cityInfo.lat.toFixed(4)}>,
      "lng": <realistic longitude for ${city}, around ${cityInfo.lng.toFixed(4)}>
    }
  }
]

Generate 8-12 recommendations. CRITICAL: Ensure ALL place names are REAL and exist specifically in ${city}${provinceInfo}, Indonesia. Do NOT include places from Jakarta or any other city.`;

        // Generate content dengan Gemini
        const result = await genAI.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        });

        // Extract text response - use same method as generatePlan
        let responseText = '';
        try {
          // Try to access response text - different API versions may have different structures
          if ((result as any).response?.text) {
            responseText = (result as any).response.text();
          } else if ((result as any).text) {
            responseText = (result as any).text();
          } else if (typeof (result as any).toString === 'function') {
            responseText = (result as any).toString();
          } else {
            // Last resort: try to get text from candidates
            const candidates = (result as any).candidates;
            if (candidates && candidates[0]?.content?.parts) {
              responseText = candidates[0].content.parts.map((p: any) => p.text).join('');
            }
          }
          
          console.log('[getRecommendations] Raw response text length:', responseText.length);
          console.log('[getRecommendations] Raw response preview:', responseText.substring(0, 200));
        } catch (e) {
          console.error('[getRecommendations] Error extracting text from response:', e);
          console.error('[getRecommendations] Result structure:', JSON.stringify(result, null, 2).substring(0, 500));
          throw new Error('Failed to extract response from Gemini API');
        }
        
        if (!responseText || responseText.trim().length === 0) {
          console.error('[getRecommendations] Empty response text');
          throw new Error('Empty response from Gemini API');
        }
        
        // Parse JSON response
        let recommendations: RecommendationPlace[] = [];
        try {
          let jsonText = responseText.trim();
          
          // Remove markdown code blocks jika ada
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const parsed = JSON.parse(jsonText);
          const rawRecommendations = Array.isArray(parsed) ? parsed : [parsed];
          
          console.log('[getRecommendations] Parsed recommendations count:', rawRecommendations.length);
          
          // Ensure all places have IDs and proper structure
          // Make coordinate validation more lenient (0.5 degree range instead of 0.2)
          const cityInfo = cityCoordinates[city] || { lat: -6.2088, lng: 106.8456 };
          const latRange = { min: cityInfo.lat - 0.5, max: cityInfo.lat + 0.5 };
          const lngRange = { min: cityInfo.lng - 0.5, max: cityInfo.lng + 0.5 };
          
          recommendations = rawRecommendations
            .map((place: any, index: number): RecommendationPlace => {
              const lat = place.coordinates?.lat || cityInfo.lat;
              const lng = place.coordinates?.lng || cityInfo.lng;
              
              return {
                id: place.id || `rec-${Date.now()}-${index}`,
                name: place.name || 'Unknown Place',
                description: place.description || 'No description available',
                category: place.category || category || 'Nature',
                coordinates: {
                  lat: lat,
                  lng: lng,
                },
              };
            })
            // Filter out places with coordinates that are too far from the city (more lenient)
            .filter((place: RecommendationPlace) => {
              const lat = place.coordinates.lat;
              const lng = place.coordinates.lng;
              // More lenient validation - allow 0.5 degree range (about 55km)
              const isValid = lat >= latRange.min && lat <= latRange.max && 
                             lng >= lngRange.min && lng <= lngRange.max;
              
              if (!isValid) {
                console.warn(`[getRecommendations] Filtered out place "${place.name}" - coordinates (${lat}, ${lng}) outside range for ${city}`);
              }
              
              return isValid;
            });
          
          console.log('[getRecommendations] Final recommendations count after filtering:', recommendations.length);
          
          // If all recommendations were filtered out, use the raw ones anyway (with city center coordinates)
          if (recommendations.length === 0 && rawRecommendations.length > 0) {
            console.warn('[getRecommendations] All recommendations filtered out, using raw data with city center coordinates');
            recommendations = rawRecommendations.map((place: any, index: number): RecommendationPlace => ({
              id: place.id || `rec-${Date.now()}-${index}`,
              name: place.name || 'Unknown Place',
              description: place.description || 'No description available',
              category: place.category || category || 'Nature',
              coordinates: {
                lat: place.coordinates?.lat || cityInfo.lat,
                lng: place.coordinates?.lng || cityInfo.lng,
              },
            }));
          }
        } catch (parseError: any) {
          console.error('[getRecommendations] Error parsing recommendations:', parseError);
          console.error('[getRecommendations] Response text:', responseText);
          throw new Error(`Failed to parse AI-generated recommendations: ${parseError.message}`);
        }

        if (recommendations.length === 0) {
          console.warn(`[getRecommendations] No recommendations found for ${city}${category ? ` (${category})` : ''}`);
        }

        return recommendations;
      } catch (error: any) {
        console.error('[getRecommendations] Gemini API error:', error);
        console.error('[getRecommendations] Error stack:', error.stack);
        // Return empty array on error instead of throwing
        return [];
      }
    }),

  getPlaceDetails: publicProcedure
    .input(getPlaceDetailsInput)
    .query(async ({ input }) => {
      try {
        const { placeName, city } = input;
        
        // Initialize Gemini AI
        const apiKey = getGeminiApiKey();
        const genAI = new GoogleGenAI({
          vertexai: false,
          apiKey: apiKey,
        });

        const prompt = `You are a local travel expert for ${city}, Indonesia. Provide detailed etiquette and visitor information for "${placeName}" in ${city}.

Requirements:
- Provide specific do's and don'ts for visiting this place
- Include warnings or important information visitors should know
- Be specific to this location, not generic travel advice
- Include cultural, religious, or environmental considerations
- Keep each point concise (1 sentence)

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
  "placeName": "${placeName}",
  "city": "${city}",
  "description": "Brief 2-3 sentence description of the place",
  "dos": [
    "Specific thing visitors should do at this place",
    "Another specific do",
    "One more specific do"
  ],
  "donts": [
    "Specific thing visitors should NOT do at this place",
    "Another specific don't",
    "One more specific don't"
  ],
  "warnings": [
    "Important warning or information about visiting hours, admission, etc."
  ]
}

Provide accurate, helpful information specific to ${placeName} in ${city}.`;

        const result = await genAI.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        });

        // Extract text response
        let responseText = '';
        try {
          if ((result as any).response?.text) {
            responseText = (result as any).response.text();
          } else if ((result as any).text) {
            responseText = (result as any).text();
          } else {
            const candidates = (result as any).candidates;
            if (candidates && candidates[0]?.content?.parts) {
              responseText = candidates[0].content.parts.map((p: any) => p.text).join('');
            }
          }
        } catch (e) {
          console.error('[getPlaceDetails] Error extracting text:', e);
          throw new Error('Failed to extract response from Gemini API');
        }

        // Parse JSON response
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const details = JSON.parse(jsonText);
        return {
          placeName: details.placeName || placeName,
          city: details.city || city,
          description: details.description || '',
          dos: details.dos || [],
          donts: details.donts || [],
          warnings: details.warnings || [],
        };
      } catch (error: any) {
        console.error('[getPlaceDetails] Error:', error);
        // Return default structure on error
        return {
          placeName: input.placeName,
          city: input.city,
          description: 'A wonderful destination to explore.',
          dos: [
            'Respect local customs and traditions',
            'Stay on designated paths',
            'Take all your trash with you',
          ],
          donts: [
            'Do not disturb other visitors',
            'Do not damage property or nature',
            'Do not litter',
          ],
          warnings: [
            'Check opening hours before visiting. Some facilities may close earlier than expected.',
          ],
        };
      }
    }),
});


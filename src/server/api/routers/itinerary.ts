import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { geminiManager } from '@/utils/gemini';

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

// Helper function untuk consume stream content
async function generateContent(prompt: string, config: any = {}): Promise<string> {
  const result = await geminiManager.generateContentStreamWithRetry(
    'gemini-2.0-flash', 
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        ...config
      },
    }
  );

  let fullText = '';
  for await (const chunk of result) {
    const chunkText = chunk.text;
    if (chunkText) {
      fullText += chunkText;
    }
  }
  return fullText;
}

// Helper function untuk parse JSON dari Gemini response
function parseGeminiResponse(text: string): any {
  try {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(jsonText);
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
        // Build prompt dengan semua input user
        const paceDescription = {
            'Relaxed': 'Fewer activities, more downtime',
            'Moderate': 'A balanced mix of sights',
            'Fast-Paced': 'See as much as possible'
        }[input.pace];

        const prompt = `You are an expert travel planner specializing in sustainable and eco-friendly tourism. Create a detailed ${input.days}-day itinerary for ${input.city}.
        
Requirements:
- Travel pace: ${input.pace} (${paceDescription})
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
- Generate ${input.days} days with appropriate number of places based on pace:
  * Relaxed: 2-3 places per day
  * Moderate: 3-4 places per day
  * Fast-Paced: 4-6 places per day
- Make sure places are real and exist in ${input.city}
- Return ONLY the JSON, no other text`;

        // Generate content dengan Gemini Manager
        const responseText = await generateContent(prompt);
        
        // Parse JSON response
        const itinerary = parseGeminiResponse(responseText) as ItineraryResponse;

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
        throw error; // Rethrow to ensure we don't return mock data
      }
    }),

  getRecommendations: publicProcedure
    .input(getRecommendationsInput)
    .query(async ({ input }) => {
      try {
        const { city, category } = input;
        const categoryFilter = category ? ` in the ${category} category` : '';
        
        const prompt = `You are an expert travel guide. Provide a list of 8-12 real, actual tourist destinations and places in ${city}${categoryFilter}.

Requirements:
- ALL places MUST be located in ${city}
- Return ONLY real, existing places that are actually in ${city}
- Include popular and well-known destinations
- If category is specified (${category || 'any'}), prioritize places matching that category
- Each place must have accurate coordinates (latitude and longitude) specifically for ${city}
- Provide realistic descriptions (2-3 sentences)

Return ONLY a valid JSON array with this exact structure (no markdown, no explanations, just JSON):
[
  {
    "id": "unique-id-1",
    "name": "Real Place Name in ${city}",
    "description": "Brief description of the place in ${city} (2-3 sentences)",
    "category": "${category || 'Nature'}",
    "coordinates": {
      "lat": <realistic latitude for ${city}>,
      "lng": <realistic longitude for ${city}>
    }
  }
]`;

        const responseText = await generateContent(prompt, { maxOutputTokens: 2048 });
        
        // Parse JSON response
        let rawRecommendations = parseGeminiResponse(responseText);
        if (!Array.isArray(rawRecommendations)) {
            rawRecommendations = [rawRecommendations]; 
        }

        const recommendations: RecommendationPlace[] = rawRecommendations.map((place: any, index: number) => ({
            id: place.id || `rec-${Date.now()}-${index}`,
            name: place.name || 'Unknown Place',
            description: place.description || 'No description available',
            category: place.category || category || 'Nature',
            coordinates: {
                lat: place.coordinates?.lat || 0,
                lng: place.coordinates?.lng || 0,
            },
        }));

        return recommendations;
      } catch (error: any) {
        console.error('[getRecommendations] Gemini API error:', error);
        return [];
      }
    }),

  getPlaceDetails: publicProcedure
    .input(getPlaceDetailsInput)
    .query(async ({ input }) => {
      try {
        const { placeName, city } = input;
        
        const prompt = `You are a local travel expert for ${city}. Provide detailed etiquette and visitor information for "${placeName}" in ${city}.

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
  "dos": [ "Specific thing visitors should do" ],
  "donts": [ "Specific thing visitors should NOT do" ],
  "warnings": [ "Important warning" ]
}`;

        const responseText = await generateContent(prompt, { maxOutputTokens: 1024 });
        
        const details = parseGeminiResponse(responseText);
        
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
        throw error;
      }
    }),
});


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
      // Mock data untuk recommendations
      const MOCK_RECOMMENDATIONS: Record<string, RecommendationPlace[]> = {
        'Bali': [
          {
            id: 'rec-bali-1',
            name: 'Tegalalang Rice Terrace',
            description: 'Famous rice paddies offering scenic views and traditional irrigation system tours.',
            category: 'Nature',
            coordinates: { lat: -8.4320, lng: 115.2790 }
          },
          {
            id: 'rec-bali-2',
            name: 'Uluwatu Temple',
            description: 'Sea temple renowned for its magnificent location, perched on top of a steep cliff.',
            category: 'Culture',
            coordinates: { lat: -8.8291, lng: 115.0849 }
          },
          {
            id: 'rec-bali-3',
            name: 'Seminyak Square',
            description: 'Modern shopping complex with upscale boutiques, restaurants, and cafes.',
            category: 'Culinary',
            coordinates: { lat: -8.6880, lng: 115.1588 }
          },
           {
            id: 'rec-bali-4',
            name: 'Tirta Gangga',
            description: 'Former royal palace famous for its water palace, featuring tiered fountains and stone sculptures.',
            category: 'History',
            coordinates: { lat: -8.4123, lng: 115.5874 }
          }
        ],
        'Bandung': [
           {
            id: 'rec-bdg-1',
            name: 'Kawah Putih',
            description: 'A striking crater lake with pale turquoise waters, surrounded by skeletal trees.',
            category: 'Nature',
            coordinates: { lat: -7.1661, lng: 107.4021 }
          },
          {
            id: 'rec-bdg-2',
            name: 'Jalan Braga',
            description: 'Historic street famous for its colonial architecture, cafes, and art galleries.',
            category: 'History',
            coordinates: { lat: -6.9175, lng: 107.6094 }
          },
          {
            id: 'rec-bdg-3',
            name: 'Saung Angklung Udjo',
            description: 'Cultural center dedicated to the preservation of the Angklung, a traditional bamboo instrument.',
            category: 'Culture',
            coordinates: { lat: -6.8986, lng: 107.6548 }
          }
        ],
        'Yogyakarta': [
           {
            id: 'rec-yog-1',
            name: 'Taman Sari',
            description: 'A former royal garden of the Sultanate of Yogyakarta, known as the Water Castle.',
            category: 'History',
            coordinates: { lat: -7.8100, lng: 110.3594 }
          },
          {
            id: 'rec-yog-2',
            name: 'Malioboro Street',
            description: 'The city\'s most famous shopping street, packed with shops, stalls, and street food.',
            category: 'Culinary',
            coordinates: { lat: -7.7926, lng: 110.3658 }
          },
          {
            id: 'rec-yog-3',
            name: 'Mount Merapi',
            description: 'Active volcano offering jeep tours and stunning sunrise views.',
            category: 'Nature',
            coordinates: { lat: -7.5407, lng: 110.4457 }
          }
        ]
      };

      try {
        const { city, category } = input;
        
        // Use mock data if available, otherwise generate generic mock data
        let recommendations = MOCK_RECOMMENDATIONS[city];
        
        if (!recommendations) {
            // Generic fallback for unknown cities
            recommendations = [
                {
                    id: `rec-${city}-1`,
                    name: `Main Park of ${city}`,
                    description: `A beautiful central park in the heart of ${city}, perfect for relaxing and people watching.`,
                    category: 'Nature',
                    coordinates: { lat: -7.9666, lng: 112.6326 } // Default to Malang coords roughly, or just random
                },
                {
                    id: `rec-${city}-2`,
                    name: `${city} City Museum`,
                    description: `Learn about the rich history and culture of ${city} in this comprehensive museum.`,
                    category: 'History',
                    coordinates: { lat: -7.9700, lng: 112.6300 }
                },
                {
                    id: `rec-${city}-3`,
                    name: `${city} Night Market`,
                    description: `Experience the vibrant local culinary scene with varied street food options.`,
                    category: 'Culinary',
                    coordinates: { lat: -7.9750, lng: 112.6350 }
                },
                 {
                    id: `rec-${city}-4`,
                    name: `${city} Cultural Center`,
                    description: `A place to witness traditional performances and art exhibitions.`,
                    category: 'Culture',
                    coordinates: { lat: -7.9800, lng: 112.6400 }
                }
            ];
        }
        
        // Filter by category if specified
        if (category) {
          recommendations = recommendations.filter(place => place.category === category);
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return recommendations;

         /* 
         // Commented out real API call for testing
         const categoryFilter = category ? ` in the ${category} category` : '';
         const prompt = `...`;
         const responseText = await generateContent(prompt, { maxOutputTokens: 2048 });
         ...
         */
      } catch (error: any) {
        console.error('[getRecommendations] Error:', error);
        return [];
      }
    }),

  getPlaceDetails: publicProcedure
    .input(getPlaceDetailsInput)
    .query(async ({ input }) => {
       // Mock data untuk place details
       const MOCK_DETAILS: Record<string, any> = {
         'default': {
            description: 'A wonderful destination worth visiting for its unique cultural and historical significance.',
            dos: [
              'Dress modestly and respectfully',
              'Ask for permission before taking photos of locals',
              'Keep the area clean and dispose of trash properly'
            ],
            donts: [
              'Do not touch sacred objects',
              'Avoid loud noises in religious areas',
              'Do not bring prohibited items'
            ],
            warnings: [
              'Traffic can be heavy during peak hours',
              'Watch your belongings in crowded areas'
            ]
         },
         'Uluwatu Temple': {
           description: 'A majestic sea temple perched on a cliff edge, famous for its sunset Kecak fire dance performances.',
           dos: ['Wear a sarong and sash (usually provided)', 'Watch out for monkeys', 'Arrive early for sunset'],
           donts: ['Do not step on offerings', 'Do not feed the monkeys', 'Do not enter the inner sanctum unless praying'],
           warnings: ['Monkeys can be aggressive and steal glasses/phones', 'Cliffs are steep, stay behind fences']
         },
         'Tegalalang Rice Terrace': {
            description: 'Stunning terraced rice fields that use the traditional subak irrigation system.',
            dos: ['Walk along the designated paths', 'Bring water and sunscreen', 'Support local farmers by buying a coconut'],
            donts: ['Do not trample on the rice plants', 'Do not fly drones without permission'],
            warnings: ['Paths can be slippery when wet', 'Some photo spots may charge a fee']
         },
         'Kawah Putih': {
             description: 'A surreal crater lake with high sulfur content, creating a whitish-green color.',
             dos: ['Wear a mask provided at entrance', 'Bring a jacket as it can be chilly'],
             donts: ['Do not stay too long near the crater (sulfur fumes)', 'Do not swim in the lake'],
             warnings: ['Sulfur smell can be strong', 'Not recommended for those with respiratory issues']
         },
          'Taman Sari': {
             description: 'Historical water castle with unique architecture and underground tunnels.',
             dos: ['Hire a local guide for history context', 'Explore the underground mosque'],
             donts: ['Do not climb on the ancient walls', 'Do not graffiti'],
             warnings: ['Can be crowded on weekends', 'Some areas are under renovation']
         }
       };

      try {
        const { placeName, city } = input;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let details = MOCK_DETAILS[placeName] || MOCK_DETAILS['default'];
        
        return {
          placeName: placeName,
          city: city,
          description: details.description,
          dos: details.dos,
          donts: details.donts,
          warnings: details.warnings,
        };

        /*
        // Commented out real API call
        const prompt = `...`;
        const responseText = await generateContent(prompt, { maxOutputTokens: 1024 });
        const details = parseGeminiResponse(responseText);
        return ...
        */
      } catch (error: any) {
        console.error('[getPlaceDetails] Error:', error);
        throw error;
      }
    }),
});


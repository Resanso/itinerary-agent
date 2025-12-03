'use client';

import React, { useEffect, useState } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './maps-planner.css';
import { geminiManager } from '../utils/gemini';

// Fix icon marker default Leaflet di Next.js/React
const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Komponen untuk mengupdate tampilan peta saat AI generate lokasi baru
function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 2 });
    }
  }, [coords, map]);
  return null;
}

// Interfaces (Disederhanakan karena tidak butuh Raw OSM Node lagi)
interface GeneratedNode {
  lat: number;
  lon: number;
  tags: { [key: string]: string };
}

interface GeneratedWay {
  path: [number, number][]; // Array of [lat, lon]
  tags: { [key: string]: string };
}

export default function MapsPlanner() {
  const [isPlannerMode, setIsPlannerMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timelineVisible, setTimelineVisible] = useState(false);
  
  // State for AI generated content
  const [generatedNodes, setGeneratedNodes] = useState<GeneratedNode[]>([]);
  const [generatedWays, setGeneratedWays] = useState<GeneratedWay[]>([]);
  const [dayPlanItinerary, setDayPlanItinerary] = useState<any[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Center Map Awal (Default Jakarta/Bandung, sesuaikan)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]); 

  // --- Function Declarations untuk Gemini (Sama seperti kode lama) ---
  const locationFunctionDeclaration: FunctionDeclaration = {
    name: 'location',
    parameters: {
      type: Type.OBJECT,
      description: 'Geographic coordinates of a location.',
      properties: {
        name: { type: Type.STRING, description: 'Name of the location.' },
        description: { type: Type.STRING, description: 'Description of the location.' },
        lat: { type: Type.STRING, description: 'Latitude.' },
        lng: { type: Type.STRING, description: 'Longitude.' },
        time: { type: Type.STRING, description: 'Time of day.' },
        duration: { type: Type.STRING, description: 'Duration of stay.' },
        sequence: { type: Type.NUMBER, description: 'Order in itinerary.' },
      },
      required: ['name', 'description', 'lat', 'lng'],
    },
  };

  const lineFunctionDeclaration: FunctionDeclaration = {
    name: 'line',
    parameters: {
      type: Type.OBJECT,
      description: 'Connection route between locations.',
      properties: {
        name: { type: Type.STRING },
        start: { type: Type.OBJECT, properties: { lat: { type: Type.STRING }, lng: { type: Type.STRING } } },
        end: { type: Type.OBJECT, properties: { lat: { type: Type.STRING }, lng: { type: Type.STRING } } },
        transport: { type: Type.STRING },
        travelTime: { type: Type.STRING },
      },
      required: ['name', 'start', 'end'],
    },
  };

  const fullSystemInstructions = `## System Instructions for Map Planner
  You are an AI travel assistant. Your goal is to create detailed, multi-stop travel itineraries.
  
  WHEN GENERATING A TRIP (e.g., "1 day in Bandung", "Trip to Tokyo"):
  1. Generate MULTIPLE locations (at least 3-5) that form a logical route.
  2. Use the 'location' tool for EACH stop.
  3. Use the 'line' tool to connect consecutive locations (e.g., Location 1 -> Location 2, Location 2 -> Location 3).
  4. Assign a 'sequence' number to each location (1, 2, 3...).
  5. Provide realistic 'time' (e.g., "09:00 AM") and 'duration' (e.g., "2 hours") for each stop.
  
  IMPORTANT:
  - Coordinates must be precise.
  - You must ALWAYS use the provided tools. DO NOT reply with conversational text.
  - If the user asks for a specific place, suggest nearby attractions to make it a complete trip.
  
  DAY_PLANNER_MODE: ${isPlannerMode}`;

  const restart = () => {
    setGeneratedNodes([]);
    setGeneratedWays([]);
    setDayPlanItinerary([]);
    setActiveCardIndex(0);
    setTimelineVisible(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    restart();

    try {
      const finalPrompt = isPlannerMode ? prompt + ' day trip itinerary' : prompt;

      // Use the manager to handle key rotation automatically
      const response = await geminiManager.generateContentStreamWithRetry(
        'gemini-2.0-flash',
        {
          contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
          config: {
            systemInstruction: fullSystemInstructions + " You must ALWAYS use the provided tools to generate locations. DO NOT reply with conversational text.",
            temperature: 0.5,
            tools: [{ functionDeclarations: [locationFunctionDeclaration, lineFunctionDeclaration] }],
            toolConfig: { functionCallingConfig: { mode: 'ANY' } },
          },
        }
      );

      let results = false;
      let firstLocation: [number, number] | null = null;

      for await (const chunk of response) {
        const fns = chunk.functionCalls ?? [];
        for (const fn of fns) {
          if (fn.name === 'location' && fn.args) {
            const args: any = fn.args;
            const newNode: GeneratedNode = {
                lat: Number(args.lat),
                lon: Number(args.lng),
                tags: { ...args, sequence: String(args.sequence || '') }
            };

            setGeneratedNodes(prev => [...prev, newNode]);
            
            // Set map center to first generated location
            if (!firstLocation) {
                firstLocation = [newNode.lat, newNode.lon];
                setMapCenter(firstLocation);
            }

            if (isPlannerMode && args.time) {
               setDayPlanItinerary(prev => {
                 const newItem = { ...args };
                 return [...prev, newItem].sort((a, b) => (a.sequence || 99) - (b.sequence || 99));
               });
            }
            results = true;
          }
          
          if (fn.name === 'line' && fn.args) {
            const args: any = fn.args;
            const newWay: GeneratedWay = {
                path: [
                    [Number(args.start.lat), Number(args.start.lng)],
                    [Number(args.end.lat), Number(args.end.lng)]
                ],
                tags: args
            };
            setGeneratedWays(prev => [...prev, newWay]);
            results = true;
          }
        }
      }

      if (!results) throw new Error('Could not generate any results. Try again.');
      if (isPlannerMode) setTimelineVisible(true);

    } catch (e: any) {
      setErrorMessage(e.message);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  // --- Helper UI ---
  const getPlaceholderImage = (name: string) => `https://placehold.co/300x180?text=${encodeURIComponent(name.substring(0,10))}`;

  return (
    <div className="maps-planner-wrapper">
      <div id="map-container" className={`map-container ${timelineVisible ? 'map-container-shifted' : ''}`}>
        
        {/* --- INI BAGIAN PENGGANTI SVG --- */}
        <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: "100%", width: "100%" }}
            zoomControl={false} // Custom control nanti kalau mau
        >
            {/* 1. Controller untuk pindah kamera saat AI generate */}
            <MapController coords={mapCenter} />

            {/* 2. Tile Layer (Peta Dasar OSM) - Ini yang membuat peta tampil benar */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 3. Render Routes (Garis) dari AI */}
            {generatedWays.map((way, i) => (
                <Polyline 
                    key={`way-${i}`}
                    positions={way.path}
                    pathOptions={{ 
                        color: isPlannerMode ? '#2196F3' : '#CC0099', 
                        dashArray: isPlannerMode ? '5, 10' : undefined,
                        weight: 4
                    }}
                />
            ))}

            {/* 4. Render Markers (Lokasi) dari AI */}
            {generatedNodes.map((node, i) => (
                <Marker 
                    key={`node-${i}`} 
                    position={[node.lat, node.lon]}
                    icon={iconDefault}
                    eventHandlers={{
                        click: () => {
                            setActiveCardIndex(i);
                            setIsBottomSheetExpanded(true); // Auto expand when clicking marker
                        },
                    }}
                >
                    <Popup>
                        <strong>{node.tags.name}</strong><br/>
                        {node.tags.description}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
        {/* --- END MAP COMPONENT --- */}

        {/* UI Overlay (Search, Planner Toggle, Cards) - Tetap sama */}
        <div className="search-container">
          <div className="mode-toggle">
            <label className="switch">
              <input type="checkbox" checked={isPlannerMode} onChange={(e) => setIsPlannerMode(e.target.checked)} />
              <span className="slider round"></span>
            </label>
            <span className="mode-label">Day Planner Mode</span>
          </div>

          <div className="search-bar">
            <textarea
              placeholder={isPlannerMode ? "Create a day plan..." : "Explore places..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            ></textarea>
            <button className={`search-button ${isLoading ? 'loading' : ''}`} onClick={handleGenerate}>
              {isLoading ? '...' : 'GO'}
            </button>
          </div>
          {errorMessage && <div className="error">{errorMessage}</div>}
        </div>

        {/* Bottom Sheet Itinerary */}
        {generatedNodes.length > 0 && (
          <div className={`bottom-sheet ${isBottomSheetExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="bottom-sheet-header" onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}>
                <div className="drag-handle"></div>
                <div className="header-content">
                    <h3>Your Itinerary ({generatedNodes.length} stops)</h3>
                    <span className="toggle-icon">{isBottomSheetExpanded ? '▼' : '▲'}</span>
                </div>
            </div>
            
            <div className="bottom-sheet-content">
                {generatedNodes.map((node, index) => (
                    <div 
                        key={index} 
                        className={`itinerary-item ${activeCardIndex === index ? 'active' : ''}`}
                        onClick={() => {
                            setActiveCardIndex(index);
                            setMapCenter([node.lat, node.lon]);
                        }}
                    >
                        <div className="item-sequence">{node.tags.sequence || index + 1}</div>
                        <div className="item-details">
                            <div className="item-time">{node.tags.time || 'Flexible'}</div>
                            <div className="item-name">{node.tags.name}</div>
                            <div className="item-desc">{node.tags.description}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Timeline UI (Disederhanakan untuk brevity, logika sama) */}
      {timelineVisible && (
          <div className="timeline-container visible">
              <h3>Itinerary</h3>
              <div className="timeline">
                {dayPlanItinerary.map((item, idx) => (
                    <div key={idx} className="timeline-item">
                        <b>{item.time}</b>: {item.name}
                    </div>
                ))}
              </div>
          </div>
      )}
    </div>
  );
}

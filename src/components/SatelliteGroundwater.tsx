import React, { useState, useEffect, useRef } from "react";
import { Compass, Eye, Droplet, Layers } from "lucide-react";
import { FarmerProfile } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const plots = [
  { id: 1, offsetLat: 0.002, offsetLng: 0.003, farmer: "Anji Reddy (You)", crop: "Cotton", ndvi: 0.82, moisture: 68, vigor: 0.85, size: "3.5 Acres" },
  { id: 2, offsetLat: -0.003, offsetLng: 0.002, farmer: "B. Venkatesh", crop: "Chilli", ndvi: 0.61, moisture: 42, vigor: 0.58, size: "2.1 Acres" },
  { id: 3, offsetLat: 0.004, offsetLng: -0.002, farmer: "K. Lakshmi", crop: "Rice (Paddy)", ndvi: 0.89, moisture: 92, vigor: 0.91, size: "4.0 Acres" },
  { id: 4, offsetLat: -0.001, offsetLng: -0.004, farmer: "M. Ramulu", crop: "Maize", ndvi: 0.52, moisture: 35, vigor: 0.49, size: "2.5 Acres" },
  { id: 5, offsetLat: 0.001, offsetLng: -0.001, farmer: "T. Srinivas", crop: "Turmeric", ndvi: 0.74, moisture: 59, vigor: 0.72, size: "1.8 Acres" },
];

const getPlotColor = (plot: typeof plots[0], layer: "NDVI" | "Moisture" | "Vigor") => {
  if (layer === "NDVI") {
    if (plot.ndvi > 0.8) return "#15803d"; // green-700
    if (plot.ndvi > 0.7) return "#166534"; // green-800
    return "#c2410c"; // orange-700
  } else if (layer === "Moisture") {
    if (plot.moisture > 80) return "#1d4ed8"; // blue-700
    if (plot.moisture > 50) return "#1e40af"; // blue-800
    return "#c2410c"; // orange-700
  } else {
    if (plot.vigor > 0.8) return "#047857"; // emerald-700
    if (plot.vigor > 0.7) return "#065f46"; // emerald-800
    return "#b45309"; // amber-700
  }
};

function MapCircle({ 
  center, 
  radius, 
  color 
}: { 
  center: google.maps.LatLngLiteral; 
  radius: number; 
  color: string; 
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    circleRef.current = new google.maps.Circle({
      map,
      center,
      radius,
      fillColor: color,
      fillOpacity: 0.25,
      strokeColor: color,
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius, color]);

  return null;
}

function PlotMarker({ 
  plot, 
  center, 
  activeLayer, 
  color 
}: { 
  plot: typeof plots[0]; 
  center: google.maps.LatLngLiteral; 
  activeLayer: "NDVI" | "Moisture" | "Vigor"; 
  color: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);
  const position = {
    lat: center.lat + plot.offsetLat,
    lng: center.lng + plot.offsetLng,
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setOpen(true)}
        title={`${plot.farmer}'s Plot`}
      >
        <Pin background={color} strokeColor="#fff" glyphColor="#fff" scale={1.1} />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1.5 text-stone-800 space-y-1 text-xs max-w-[200px] min-w-[150px]">
            <h4 className="font-bold border-b pb-1 text-stone-900">{plot.farmer}</h4>
            <p className="text-stone-600 font-medium">Crop: <span className="text-stone-900">{plot.crop}</span> ({plot.size})</p>
            <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 font-mono">
              <span className="text-stone-500">NDVI:</span>
              <span className="font-bold text-emerald-700">{plot.ndvi}</span>
              <span className="text-stone-500">Moisture:</span>
              <span className="font-bold text-blue-700">{plot.moisture}%</span>
              <span className="text-stone-500">Vigor:</span>
              <span className="font-bold text-green-700">{plot.vigor}</span>
            </div>
            <p className="text-[9px] text-stone-400 italic pt-1">
              Layer: {activeLayer}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function LiveMap({ 
  farmerProfile, 
  activeLayer 
}: { 
  farmerProfile: FarmerProfile | null; 
  activeLayer: "NDVI" | "Moisture" | "Vigor" 
}) {
  const [mapCenter, setMapCenter] = useState({ lat: 17.8767, lng: 79.7917 }); // Default Chennaraopet
  const geocodingLib = useMapsLibrary('geocoding');

  useEffect(() => {
    if (!geocodingLib) return;
    const address = `${farmerProfile?.village || "Chennaraopet"}, ${farmerProfile?.district || "Warangal"}, Telangana, India`;
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        setMapCenter({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [geocodingLib, farmerProfile?.village, farmerProfile?.district]);

  return (
    <Map
      center={mapCenter}
      defaultZoom={15}
      mapTypeId="hybrid"
      mapId="DEMO_MAP_ID"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
      gestureHandling="cooperative"
    >
      {plots.map((plot) => {
        const plotPos = {
          lat: mapCenter.lat + plot.offsetLat,
          lng: mapCenter.lng + plot.offsetLng,
        };
        const color = getPlotColor(plot, activeLayer);
        return (
          <React.Fragment key={plot.id}>
            <PlotMarker
              plot={plot}
              center={mapCenter}
              activeLayer={activeLayer}
              color={color}
            />
            <MapCircle
              center={plotPos}
              radius={180}
              color={color}
            />
          </React.Fragment>
        );
      })}
    </Map>
  );
}

interface SatelliteProps {
  farmerProfile: FarmerProfile | null;
  translations: Record<string, string>;
}

export default function SatelliteGroundwater({ farmerProfile, translations }: SatelliteProps) {
  const [activeLayer, setActiveLayer] = useState<"NDVI" | "Moisture" | "Vigor">("NDVI");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");

  const handleFetchWaterAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Given my groundwater depth is ${farmerProfile?.groundwaterDepth || 75} meters, soil type is ${farmerProfile?.soilType || "Black soil"}, and irrigation is ${farmerProfile?.irrigationAvailable ? "available" : "unavailable"}, what are 3 highly specific water conservation and drip irrigation management tips for my crops? Keep the response extremely direct.`,
          language: farmerProfile?.language || "english",
        }),
      });
      const data = await response.json();
      setAdvice(data.reply);
    } catch (err) {
      setAdvice(
        farmerProfile?.language === "telugu"
          ? "1. డ్రిప్ ఇరిగేషన్ పద్ధతులను అవలంబించండి.\n2. ఆవిరిపోకుండా మల్చింగ్ షీట్లు వాడండి.\n3. సాయంత్రం లేదా ఉదయం వేళల్లో మాత్రమే తడులు పెట్టండి."
          : "1. Switch to drip irrigation networks to cut water wastage by 50%.\n2. Practice organic mulching to prevent moisture evaporation.\n3. Irrigate strictly during early mornings or late evenings to avoid sun-induced evaporation."
      );
    } finally {
      setLoading(false);
    }
  };

  // 10-year historic borehole table levels for chart
  const waterHistory = [
    { year: "2018", level: 55 },
    { year: "2019", level: 58 },
    { year: "2020", level: 62 },
    { year: "2021", level: 60 },
    { year: "2022", level: 68 },
    { year: "2023", level: 71 },
    { year: "2024", level: 75 },
  ];

  return (
    <div id="satellite-module" className="space-y-6">
      {/* Banner */}
      <div className="bento-card-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
          <Compass size={160} />
        </div>
        <span className="text-bento-mint text-xs font-bold uppercase tracking-wider bg-bento-forest/60 border border-bento-mint/20 px-3 py-1 rounded-full">
          Synthetic Aperture Radar & Borehole Analytics
        </span>
        <h2 className="font-display text-2xl font-bold mt-2">
          {translations.satellite || "Satellite Monitoring & Groundwater"}
        </h2>
        <p className="text-bento-mint/80 text-sm mt-1">
          Monitor Normalized Difference Vegetation Index (NDVI), soil water retention, and historic borehole tables using live Google Maps satellite imagery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Satellite Map */}
        <div className="lg:col-span-2 bento-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-bento-deep text-md flex items-center gap-1.5">
                <Layers className="text-bento-forest" size={18} /> Spectral Remote Sensing Map
              </h3>
              <p className="text-[10px] text-stone-500">
                Village Area: <strong className="text-stone-700">{farmerProfile?.village || "Chennaraopet"}</strong>
              </p>
            </div>

            {/* Layer Toggles */}
            <div className="flex gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 w-fit">
              <button
                onClick={() => setActiveLayer("NDVI")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${activeLayer === "NDVI" ? "bg-bento-deep text-white shadow-xs" : "text-stone-600 hover:bg-stone-200"}`}
              >
                NDVI Vigor
              </button>
              <button
                onClick={() => setActiveLayer("Moisture")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${activeLayer === "Moisture" ? "bg-bento-deep text-white shadow-xs" : "text-stone-600 hover:bg-stone-200"}`}
              >
                Soil Moisture
              </button>
              <button
                onClick={() => setActiveLayer("Vigor")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${activeLayer === "Vigor" ? "bg-bento-deep text-white shadow-xs" : "text-stone-600 hover:bg-stone-200"}`}
              >
                Canopy Growth
              </button>
            </div>
          </div>

          {/* Map canvas */}
          <div className="relative aspect-video w-full rounded-2xl bg-stone-900 overflow-hidden shadow-inner border border-stone-800">
            {hasValidKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <LiveMap farmerProfile={farmerProfile} activeLayer={activeLayer} />
              </APIProvider>
            ) : (
              /* Splash screen / setup instructions when key is missing */
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white bg-stone-950">
                <div className="max-w-md space-y-4">
                  <h4 className="font-display font-bold text-md text-bento-mint flex items-center justify-center gap-2">
                    <Compass className="animate-spin text-bento-mint" size={20} />
                    Google Maps API Key Required
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Set your <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> secret in AI Studio to unlock live spectral remote sensing overlays on real satellite map imagery for <strong>{farmerProfile?.village || "Chennaraopet"}</strong>.
                  </p>
                  <div className="text-[11px] text-left bg-stone-900 p-4 rounded-xl border border-stone-800 space-y-2 font-mono text-stone-400">
                    <p>1. Open <strong>Settings</strong> (⚙️ gear icon, top-right)</p>
                    <p>2. Select <strong>Secrets</strong></p>
                    <p>3. Add key: <code className="text-bento-mint bg-stone-950 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></p>
                    <p>4. Enter your Google Maps API key as the value.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Float HUD overlays - only visible when map is active */}
            {hasValidKey && (
              <div className="absolute bottom-3 left-3 bg-bento-deep/90 border border-bento-forest/40 text-white p-2.5 rounded-xl text-[9px] font-mono space-y-1 z-10 pointer-events-none">
                <span className="font-bold text-bento-mint">SPECTRAL INDEX SUMMARY</span>
                {activeLayer === "NDVI" && <p>Mean NDVI: 0.74 (Healthy Crop)</p>}
                {activeLayer === "Moisture" && <p>Root Zone Moisture: 64% (Adequate)</p>}
                {activeLayer === "Vigor" && <p>Canopy Growth: 0.68 (Optimal)</p>}
              </div>
            )}

            {/* Map Legend Overlay - only visible when map is active */}
            {hasValidKey && (
              <div className="absolute right-3 bottom-3 bg-bento-deep/90 border border-bento-forest/40 text-white p-2.5 rounded-xl text-[9px] font-mono space-y-1.5 min-w-[100px] z-10 pointer-events-none">
                <span className="font-bold uppercase tracking-wider text-bento-mint/80">Legend</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activeLayer === "NDVI" ? "#15803d" : activeLayer === "Moisture" ? "#1d4ed8" : "#047857" }} />
                  <span>High Vigor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activeLayer === "NDVI" ? "#166534" : activeLayer === "Moisture" ? "#1e40af" : "#065f46" }} />
                  <span>Optimal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: activeLayer === "NDVI" ? "#c2410c" : activeLayer === "Moisture" ? "#c2410c" : "#b45309" }} />
                  <span>Low / Dry</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Borehole Groundwater charts & Advice */}
        <div className="space-y-6">
          <div className="bento-card">
            <h3 className="font-display font-bold text-bento-deep text-sm mb-3 flex items-center gap-1">
              <Droplet size={16} className="text-bento-forest" /> Borehole Depth Table (m)
            </h3>
            <div className="h-44 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={waterHistory} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" stroke="#78716c" />
                  <YAxis stroke="#78716c" reversed={true} />
                  <Tooltip formatter={(value) => [`${value} meters`, "Groundwater table"]} />
                  <Area type="monotone" dataKey="level" stroke="#40916C" fill="#52B788" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-stone-500 mt-2 text-center italic">
              Note: Chart reversed. Lower line indicates deeper groundwater table, indicating resource decline.
            </p>
          </div>

          {/* AI Groundwater crop advice */}
          <div className="bento-card space-y-3">
            <h4 className="font-display font-bold text-bento-deep text-xs uppercase tracking-wider flex items-center gap-1">
              <Eye className="text-bento-forest" size={15} />
              Borehole AI Water Advisor
            </h4>

            {advice ? (
              <div className="p-3 bg-bento-light/40 rounded-2xl border border-bento-mint/30 text-[11px] leading-relaxed text-stone-700 whitespace-pre-line">
                {advice}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Tap below to calculate water conservation guidelines and drought resiliency indicators tailored to your borehole depth ({farmerProfile?.groundwaterDepth || 75}m).
              </p>
            )}

            <button
              id="btn-groundwater-advice"
              onClick={handleFetchWaterAdvice}
              disabled={loading}
              className="w-full bg-bento-deep hover:bg-bento-forest disabled:bg-stone-300 text-white font-medium py-2 rounded-xl transition text-xs shadow-md cursor-pointer"
            >
              {loading ? "Analyzing water tables..." : "Get Borehole AI Advice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

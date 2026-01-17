"use client";

import { useEffect, useState } from "react";
import { Company } from "@/types";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Component to handle map view updates
// Component to handle map view updates and controls
function MapPlugins({ center, zoom }: { center: [number, number] | null; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        if (map && center) {
            map.flyTo(center, zoom, {
                duration: 1.5
            });
        }
    }, [center, zoom, map]);

    // Manually add zoom control to ensure it's added after map initialization
    useEffect(() => {
        const zoomControl = new L.Control.Zoom({ position: 'bottomright' });
        map.addControl(zoomControl);
        return () => {
            map.removeControl(zoomControl);
        };
    }, [map]);

    return null;
}

interface CompanyMapProps {
    companies: Company[];
    selectedCompanyId?: string | null;
    onMarkerClick: (companyId: string) => void;
}

export default function CompanyMap({ companies, selectedCompanyId, onMarkerClick }: CompanyMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    // Custom red marker icon
    // Custom red marker icon
    const redIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #E21E36; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3); position: relative;">
                <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
    });

    // Fix for Leaflet icons (no longer needed if using custom redIcon exclusively, but kept for default markers if any)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const startPosition: [number, number] = [49.8175, 15.4730]; // Center of CZ
    const companiesWithCoords = companies.filter(c => c.latitude && c.longitude);

    // Check if valid coordinates exist for selected company
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const hasValidSelectedCoords = selectedCompany &&
        selectedCompany.latitude !== undefined &&
        selectedCompany.latitude !== 0 &&
        selectedCompany.longitude !== undefined &&
        selectedCompany.longitude !== 0;

    const mapCenter: [number, number] = hasValidSelectedCoords
        ? [selectedCompany.latitude!, selectedCompany.longitude!]
        : startPosition;

    const zoomLevel = hasValidSelectedCoords ? 13 : 8;

    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={mapCenter}
                zoom={zoomLevel}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapPlugins center={hasValidSelectedCoords ? mapCenter : null} zoom={zoomLevel} />

                {companiesWithCoords.map((company) => (
                    <Marker
                        key={company.id}
                        position={[company.latitude!, company.longitude!]}
                        icon={redIcon}
                        eventHandlers={{
                            click: () => onMarkerClick(company.id),
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-sm mb-1">{company.name}</h3>
                                <p className="text-xs text-gray-600 mb-2">{company.city}</p>
                                <a
                                    href={`/companies/${company.id}`}
                                    className="text-xs text-[#E21E36] hover:underline font-medium"
                                >
                                    Zobrazit detail
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

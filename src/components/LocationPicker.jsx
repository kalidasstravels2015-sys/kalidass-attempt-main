import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { loadGoogleMaps } from '../lib/googleMapsLoader';

const LocationPicker = ({ isOpen, onClose, onConfirm, type }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [address, setAddress] = useState('Locating...');
    const [isDragging, setIsDragging] = useState(false);

    // Default to Chennai
    const defaultCenter = { lat: 13.0827, lng: 80.2707 };

    useEffect(() => {
        if (!isOpen) return;

        let isCancelled = false;
        loadGoogleMaps()
            .catch(() => {})
            .then(() => {
                if (!isCancelled) {
                    setTimeout(() => {
                        initMap();
                    }, 100);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    const initMap = () => {
        if (!mapRef.current || !window.google) return;

        // Try to get current location for initial center
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setCenter(pos);
                    }
                },
                () => {
                    // Error/Permission denied - stick to default
                }
            );
        }

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy', // Better mobile touch handling
        });

        mapInstanceRef.current = map;

        // Update address when map stops moving
        map.addListener('dragstart', () => {
            setIsDragging(true);
            setAddress('Moving...');
        });

        map.addListener('idle', () => {
            setIsDragging(false);
            const center = map.getCenter();
            geocodePosition(center);
        });

        // Initial geocode
        geocodePosition(defaultCenter);
    };

    const geocodePosition = (latlng) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                // Prefer places with names, or route names
                const bestResult = results[0];
                // Logic to strip country/pincode if needed, but full address is usually safer
                setAddress(bestResult.formatted_address);
            } else {
                setAddress('Unknown location');
            }
        });
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                mapInstanceRef.current.setCenter(pos);
                mapInstanceRef.current.setZoom(17);
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-m3-scrim/60 backdrop-blur-sm p-4">
            <div className="bg-m3-surface w-full max-w-lg rounded-m3-xl overflow-hidden shadow-m3-3 border border-m3-outline-variant flex flex-col h-[80vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-5 py-4 border-b border-m3-outline-variant/60 flex items-center justify-between bg-m3-surface z-10">
                    <h3 className="font-bold text-lg text-m3-on-surface font-heading">Set {type} Location</h3>
                    <button onClick={onClose} className="p-2 hover:bg-m3-surface-container rounded-m3-full text-m3-on-surface-variant transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="relative flex-1 bg-m3-surface-container">
                    <div ref={mapRef} className="w-full h-full" />

                    {/* Centered Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center">
                        <div className={`transition-transform duration-200 ${isDragging ? '-translate-y-2' : ''}`}>
                            <MapPin className="w-8 h-8 text-m3-primary fill-m3-primary drop-shadow-md" />
                        </div>
                        <div className="w-1.5 h-1.5 bg-black/25 rounded-full blur-[1px] mt-[-2px]" />
                    </div>

                    {/* Current Location Button (M3 Small FAB) */}
                    <button
                        onClick={handleCurrentLocation}
                        className="absolute bottom-6 right-4 bg-m3-surface p-3 rounded-m3-full shadow-m3-2 hover:bg-m3-surface-container active:scale-95 transition-all border border-m3-outline-variant/50 cursor-pointer"
                        title="Go to current location"
                    >
                        <Navigation className="w-5 h-5 text-m3-primary fill-m3-primary/20" />
                    </button>
                </div>

                {/* Footer */}
                <div className="p-5 bg-m3-surface border-t border-m3-outline-variant/60 space-y-4 z-10">
                    <div>
                        <p className="text-badge font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1">Selected Location</p>
                        <p className="text-sm font-medium text-m3-on-surface line-clamp-2 min-h-[2.5em]">
                            {address}
                        </p>
                    </div>

                    <button
                        onClick={() => onConfirm(address)}
                        disabled={isDragging || address === 'Locating...' || address === 'Unknown location'}
                        className="w-full bg-m3-primary hover:bg-m3-primary/90 text-m3-on-primary py-3.5 rounded-m3-full font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-m3-1 cursor-pointer"
                    >
                        CONFIRM LOCATION
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;

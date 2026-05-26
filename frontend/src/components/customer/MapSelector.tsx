import {useEffect, useRef, useState} from "react";
import {GoogleMap, Marker, useLoadScript} from "@react-google-maps/api";

const mapContainerStyle = { width: "100%", height: "300px" };
const center = { lat: 17.385, lng: 78.4867 }; // Default: Hyderabad

export function MapSelector ({ lat, lng,  onChange, isEditable = true }: { lat?:number, lng?:number, onChange: (lat: number, lng: number) => void, isEditable?: boolean }) {
    const google_api_key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
    const [marker, setMarker] = useState((lat && lng) ? {lat, lng} : center);
    const { isLoaded } = useLoadScript({ googleMapsApiKey: google_api_key });

    // Handle geolocation on mount if no valid coordinates are provided
    useEffect(() => {
        const hasValidCoords = lat && lng && lat !== 0 && lng !== 0;
        if (!hasValidCoords) {
            console.log("[DEBUG MapSelector] No valid coordinates provided. Attempting geolocation...");
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const currentLat = position.coords.latitude;
                        const currentLng = position.coords.longitude;
                        console.log("[DEBUG MapSelector] Geolocation success:", currentLat, currentLng);
                        setMarker({ lat: currentLat, lng: currentLng });
                        onChange(currentLat, currentLng);
                    },
                    (error) => {
                        console.warn("[DEBUG MapSelector] Geolocation failed, using fallback:", error);
                        setMarker(center);
                        onChange(center.lat, center.lng);
                    }
                );
            } else {
                console.warn("[DEBUG MapSelector] Geolocation not supported, using fallback.");
                setMarker(center);
                onChange(center.lat, center.lng);
            }
        }
    }, []);

    // Sync with parent state updates if any
    useEffect(() => {
        if (lat && lng && lat !== 0 && lng !== 0) {
            console.log("[DEBUG MapSelector] Syncing from parent props:", lat, lng);
            setMarker({ lat, lng });
        }
    }, [lat, lng]);

    if (!isLoaded) return <div>Loading map...</div>;

    const handleMapClick = (e: google.maps.MapMouseEvent)=> {
        const clickLat = e.latLng?.lat() ?? marker.lat;
        const clickLng = e.latLng?.lng() ?? marker.lng;
        console.log("[DEBUG MapSelector] Map clicked at:", clickLat, clickLng);
        setMarker({ lat: clickLat, lng: clickLng });
        onChange(clickLat, clickLng);
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        const dragLat = e.latLng?.lat() ?? marker.lat;
        const dragLng = e.latLng?.lng() ?? marker.lng;
        console.log("[DEBUG MapSelector] Marker drag ended at:", dragLat, dragLng);
        setMarker({ lat: dragLat, lng: dragLng });
        onChange(dragLat, dragLng);
    };

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={marker}
            zoom={13}
            onClick={isEditable ? handleMapClick : undefined}
            options={{
                draggable: isEditable,
                zoomControl: isEditable,
                scrollwheel: isEditable,
                disableDoubleClickZoom: !isEditable,
            }}
        >
            <Marker 
                position={marker} 
                draggable={isEditable} 
                onDragEnd={isEditable ? handleMarkerDragEnd : undefined}
            />
        </GoogleMap>
    );
};

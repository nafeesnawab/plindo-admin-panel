import { Loader2, LocateFixed, MapPin, Navigation } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/ui/button";

interface MapLocationPickerProps {
	latitude: number | null;
	longitude: number | null;
	onLocationChange: (lat: number, lng: number, address?: string) => void;
	onAddressChange?: (address: string) => void;
}

// Reverse geocoding using Nominatim (free, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
			{
				headers: {
					"Accept-Language": "en",
				},
			},
		);
		const data = await response.json();
		return data.display_name || "";
	} catch {
		return "";
	}
}

export function MapLocationPicker({
	latitude,
	longitude,
	onLocationChange,
	onAddressChange,
}: MapLocationPickerProps) {
	const [isLocating, setIsLocating] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);

	// Default center (Cyprus - Nicosia)
	const defaultCenter: [number, number] = [35.1856, 33.3823];

	const position = useMemo<[number, number] | null>(() => {
		if (latitude !== null && longitude !== null) {
			return [latitude, longitude];
		}
		return null;
	}, [latitude, longitude]);

	const mapCenter = position || defaultCenter;

	const handlePositionChange = useCallback(
		async (lat: number, lng: number) => {
			const address = await reverseGeocode(lat, lng);
			onLocationChange(lat, lng, address);
			if (onAddressChange && address) {
				onAddressChange(address);
			}
		},
		[onLocationChange, onAddressChange],
	);

	// Initialize map with vanilla Leaflet
	useEffect(() => {
		let mounted = true;

		const initMap = async () => {
			const L = await import("leaflet");
			await import("leaflet/dist/leaflet.css");

			if (!mounted || !mapContainerRef.current || mapInstanceRef.current)
				return;

			// Fix default marker icon
			const defaultIcon = L.default.icon({
				iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
				iconRetinaUrl:
					"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
				shadowUrl:
					"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41],
			});

			const map = L.default
				.map(mapContainerRef.current)
				.setView(mapCenter, position ? 16 : 10);

			L.default
				.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				})
				.addTo(map);

			// Add marker if position exists
			if (position) {
				markerRef.current = L.default
					.marker(position, { icon: defaultIcon })
					.addTo(map);
			}

			// Handle map clicks
			map.on("click", async (e: L.LeafletMouseEvent) => {
				const { lat, lng } = e.latlng;

				// Update or create marker
				if (markerRef.current) {
					markerRef.current.setLatLng([lat, lng]);
				} else {
					markerRef.current = L.default
						.marker([lat, lng], { icon: defaultIcon })
						.addTo(map);
				}

				// Trigger position change
				const address = await reverseGeocode(lat, lng);
				onLocationChange(lat, lng, address);
				if (onAddressChange && address) {
					onAddressChange(address);
				}
			});

			mapInstanceRef.current = map;
			setMapLoaded(true);
		};

		initMap();

		return () => {
			mounted = false;
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	// Update marker position when latitude/longitude change
	useEffect(() => {
		if (!mapInstanceRef.current || !mapLoaded) return;

		const updateMarker = async () => {
			const L = await import("leaflet");

			const defaultIcon = L.default.icon({
				iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
				iconRetinaUrl:
					"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
				shadowUrl:
					"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41],
			});

			if (position) {
				if (markerRef.current) {
					markerRef.current.setLatLng(position);
				} else {
					markerRef.current = L.default
						.marker(position, { icon: defaultIcon })
						.addTo(mapInstanceRef.current!);
				}
				mapInstanceRef.current!.setView(position, 16);
			}
		};

		updateMarker();
	}, [position, mapLoaded]);

	const getCurrentLocation = useCallback(() => {
		if (!navigator.geolocation) {
			setLocationError("Geolocation is not supported by your browser");
			return;
		}

		setIsLocating(true);
		setLocationError(null);

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude: lat, longitude: lng } = pos.coords;
				await handlePositionChange(lat, lng);

				// Center map on new location
				if (mapInstanceRef.current) {
					mapInstanceRef.current.setView([lat, lng], 16);
				}

				setIsLocating(false);
			},
			(err) => {
				setIsLocating(false);
				switch (err.code) {
					case err.PERMISSION_DENIED:
						setLocationError(
							"Location permission denied. Please enable location access.",
						);
						break;
					case err.POSITION_UNAVAILABLE:
						setLocationError("Location information is unavailable.");
						break;
					case err.TIMEOUT:
						setLocationError("Location request timed out.");
						break;
					default:
						setLocationError("An error occurred while getting your location.");
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			},
		);
	}, [handlePositionChange]);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<MapPin className="h-4 w-4" />
					<span>Click on the map to pin your business location</span>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={getCurrentLocation}
					disabled={isLocating}
					className="gap-2"
				>
					{isLocating ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Locating...
						</>
					) : (
						<>
							<LocateFixed className="h-4 w-4" />
							Use My Location
						</>
					)}
				</Button>
			</div>

			{locationError && (
				<div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
					{locationError}
				</div>
			)}

			<div
				ref={mapContainerRef}
				className="rounded-lg border overflow-hidden"
				style={{ height: "280px" }}
			>
				{!mapLoaded && (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<Loader2 className="h-6 w-6 animate-spin mr-2" />
						Loading map...
					</div>
				)}
			</div>

			{position && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
					<Navigation className="h-4 w-4 text-primary" />
					<span>
						<strong>Coordinates:</strong> {position[0].toFixed(6)},{" "}
						{position[1].toFixed(6)}
					</span>
				</div>
			)}
		</div>
	);
}

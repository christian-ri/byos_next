import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type SkyWatchParams = {
	location?: string;
	latitude?: string | number;
	longitude?: string | number;
	radiusKm?: string | number;
};

type GeocodingResponse = {
	results?: Array<{
		name: string;
		country?: string;
		timezone?: string;
		latitude: number;
		longitude: number;
	}>;
};

type AirplanesLiveAircraft = {
	hex: string;
	flight?: string;
	r?: string;
	t?: string;
	desc?: string;
	alt_baro?: number | string;
	gs?: number;
	track?: number;
	lat?: number;
	lon?: number;
	dst?: number;
	dir?: number;
};

type AirplanesLiveResponse = {
	ac?: AirplanesLiveAircraft[];
};

type Aircraft = {
	id: string;
	callsign: string;
	aircraftType: string;
	routeLabel: string;
	altitudeLabel: string;
	speedLabel: string;
	latitude: number | null;
	longitude: number | null;
	x: number;
	y: number;
	heading: number;
	brightness: number;
};

type MapTile = {
	id: string;
	src: string;
	left: number;
	top: number;
	size: number;
};

type MapView = {
	centerLat: number;
	centerLon: number;
	zoom: number;
	size: number;
	tiles: MapTile[];
};

export type SkyWatchRecipeData = {
	title: string;
	locationLabel: string;
	radiusLabel: string;
	updatedAt: string;
	note?: string;
	map: MapView;
	aircraft: Aircraft[];
};

const DEFAULT_LAT = 50.8503;
const DEFAULT_LON = 4.3517;
const DEFAULT_RADIUS_KM = 90;
const DEFAULT_LOCATION = "Brussels";
const MAP_SIZE = 360;
const MAP_TILE_SIZE = 256;
const EARTH_CIRCUMFERENCE_METERS = 40075016.686;

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function toNm(km: number) {
	return km * 0.539957;
}

function lonToWorldPx(lon: number, zoom: number) {
	return ((lon + 180) / 360) * MAP_TILE_SIZE * 2 ** zoom;
}

function latToWorldPx(lat: number, zoom: number) {
	const clampedLat = clamp(lat, -85.05112878, 85.05112878);
	const radians = (clampedLat * Math.PI) / 180;
	const mercator =
		(1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
	return mercator * MAP_TILE_SIZE * 2 ** zoom;
}

function mapZoomForRadius(lat: number, radiusKm: number) {
	const spanMeters = radiusKm * 1000 * 2.35;
	const metersPerPixel = spanMeters / MAP_SIZE;
	const rawZoom = Math.log2(
		(Math.cos((lat * Math.PI) / 180) * EARTH_CIRCUMFERENCE_METERS) /
			(MAP_TILE_SIZE * metersPerPixel),
	);

	return clamp(Math.floor(rawZoom), 6, 11);
}

function buildMapView(centerLat: number, centerLon: number, radiusKm: number) {
	const zoom = mapZoomForRadius(centerLat, radiusKm);
	const centerWorldX = lonToWorldPx(centerLon, zoom);
	const centerWorldY = latToWorldPx(centerLat, zoom);
	const topLeftX = centerWorldX - MAP_SIZE / 2;
	const topLeftY = centerWorldY - MAP_SIZE / 2;
	const maxTileIndex = 2 ** zoom - 1;
	const tileStartX = Math.floor(topLeftX / MAP_TILE_SIZE);
	const tileEndX = Math.floor((topLeftX + MAP_SIZE) / MAP_TILE_SIZE);
	const tileStartY = Math.floor(topLeftY / MAP_TILE_SIZE);
	const tileEndY = Math.floor((topLeftY + MAP_SIZE) / MAP_TILE_SIZE);
	const tiles: MapTile[] = [];

	for (let tileY = tileStartY; tileY <= tileEndY; tileY += 1) {
		if (tileY < 0 || tileY > maxTileIndex) continue;

		for (let tileX = tileStartX; tileX <= tileEndX; tileX += 1) {
			const wrappedX =
				((tileX % (maxTileIndex + 1)) + (maxTileIndex + 1)) %
				(maxTileIndex + 1);

			tiles.push({
				id: `${zoom}-${wrappedX}-${tileY}`,
				src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
				left: tileX * MAP_TILE_SIZE - topLeftX,
				top: tileY * MAP_TILE_SIZE - topLeftY,
				size: MAP_TILE_SIZE,
			});
		}
	}

	return {
		map: {
			centerLat,
			centerLon,
			zoom,
			size: MAP_SIZE,
			tiles,
		},
		topLeftX,
		topLeftY,
	};
}

function projectAircraftToMap(
	latitude: number,
	longitude: number,
	topLeftX: number,
	topLeftY: number,
	zoom: number,
) {
	const x = lonToWorldPx(longitude, zoom) - topLeftX;
	const y = latToWorldPx(latitude, zoom) - topLeftY;

	return {
		x: clamp(x / MAP_SIZE, 0.04, 0.96),
		y: clamp(y / MAP_SIZE, 0.04, 0.96),
	};
}

function formatAltitude(value?: number | string) {
	if (value === "ground") return "Ground";
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) return "--";
	return `${Math.round(numeric / 100) / 10}k ft`;
}

function buildFallback(
	locationLabel: string,
	map: MapView,
	note?: string,
): SkyWatchRecipeData {
	return {
		title: "SkyWatch",
		locationLabel,
		radiusLabel: "50 nm",
		updatedAt: formatUpdatedAt(new Date()),
		note,
		map,
		aircraft: [
			{
				id: "sample-1",
				callsign: "EZY2850",
				aircraftType: "AIRBUS A-320neo",
				routeLabel: "DLM → BRS",
				altitudeLabel: "38k ft",
				speedLabel: "419 kt",
				latitude: null,
				longitude: null,
				x: 0.33,
				y: 0.23,
				heading: 295,
				brightness: 1,
			},
			{
				id: "sample-2",
				callsign: "BAW169",
				aircraftType: "BOEING 787-9 Dreamliner",
				routeLabel: "LHR → PVG",
				altitudeLabel: "35k ft",
				speedLabel: "511 kt",
				latitude: null,
				longitude: null,
				x: 0.67,
				y: 0.58,
				heading: 120,
				brightness: 0.92,
			},
			{
				id: "sample-3",
				callsign: "PGTP9SG",
				aircraftType: "AIRBUS A-321neo",
				routeLabel: "STN → SAW",
				altitudeLabel: "37.1k ft",
				speedLabel: "472 kt",
				latitude: null,
				longitude: null,
				x: 0.46,
				y: 0.67,
				heading: 340,
				brightness: 0.88,
			},
			{
				id: "sample-4",
				callsign: "OOI37",
				aircraftType: "FLIGHT DESIGN",
				routeLabel: "",
				altitudeLabel: "600 ft",
				speedLabel: "57 kt",
				latitude: null,
				longitude: null,
				x: 0.89,
				y: 0.79,
				heading: 76,
				brightness: 0.7,
			},
		],
	};
}

async function resolveLocation(params?: SkyWatchParams) {
	const query = String(params?.location || "").trim();
	if (query) {
		const geo = await fetchJsonWithTimeout<GeocodingResponse>(
			`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
			{ headers: { Accept: "application/json" } },
			8000,
		).catch(() => null);

		const first = geo?.results?.[0];
		if (first) {
			return {
				latitude: first.latitude,
				longitude: first.longitude,
				name: `${first.name}${first.country ? `, ${first.country}` : ""}`,
			};
		}
	}

	const latitude = Number(params?.latitude);
	const longitude = Number(params?.longitude);
	if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
		return {
			latitude,
			longitude,
			name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
		};
	}

	const geo = await fetchJsonWithTimeout<GeocodingResponse>(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(DEFAULT_LOCATION)}&count=1&language=en&format=json`,
		{ headers: { Accept: "application/json" } },
		8000,
	).catch(() => null);

	const first = geo?.results?.[0];
	if (!first) {
		return {
			latitude: DEFAULT_LAT,
			longitude: DEFAULT_LON,
			name: DEFAULT_LOCATION,
		};
	}

	return {
		latitude: first.latitude,
		longitude: first.longitude,
		name: `${first.name}${first.country ? `, ${first.country}` : ""}`,
	};
}

export default async function getData(
	params?: SkyWatchParams,
): Promise<SkyWatchRecipeData> {
	const location = await resolveLocation(params);
	const latitude = location.latitude;
	const longitude = location.longitude;
	const radiusKm = clamp(
		Number(params?.radiusKm ?? DEFAULT_RADIUS_KM),
		20,
		160,
	);
	const radiusNm = Math.round(toNm(radiusKm));
	const mapView = buildMapView(latitude, longitude, radiusKm);

	try {
		const response = await fetchJsonWithTimeout<AirplanesLiveResponse>(
			`https://api.airplanes.live/v2/point/${latitude}/${longitude}/${radiusNm}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const aircraft =
			response.ac
				?.filter(
					(entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lon),
				)
				.slice(0, 12)
				.map((entry) => {
					const lat = Number(entry.lat);
					const lon = Number(entry.lon);
					const projected = projectAircraftToMap(
						lat,
						lon,
						mapView.topLeftX,
						mapView.topLeftY,
						mapView.map.zoom,
					);
					const altitudeNumeric = Number(entry.alt_baro);
					const brightness = Number.isFinite(altitudeNumeric)
						? clamp(0.45 + altitudeNumeric / 50000, 0.5, 1)
						: 0.55;

					return {
						id: entry.hex,
						callsign: entry.flight?.trim() || entry.r || entry.hex.slice(0, 6),
						aircraftType: entry.desc || entry.t || "Aircraft",
						routeLabel: entry.r || "",
						altitudeLabel: formatAltitude(entry.alt_baro),
						speedLabel: `${Math.round(entry.gs || 0)} kt`,
						latitude: lat,
						longitude: lon,
						x: projected.x,
						y: projected.y,
						heading: Number(entry.track || 0),
						brightness,
					};
				}) || [];

		if (aircraft.length === 0) {
			return buildFallback(
				location.name,
				mapView.map,
				"No live aircraft returned for this area.",
			);
		}

		return {
			title: "SkyWatch",
			locationLabel: location.name,
			radiusLabel: `${radiusNm} nm`,
			updatedAt: formatUpdatedAt(new Date()),
			note: "Aircraft via airplanes.live public point feed.",
			map: mapView.map,
			aircraft,
		};
	} catch (error) {
		console.error("Error loading SkyWatch data:", error);
		return buildFallback(
			location.name,
			mapView.map,
			"Live aircraft fetch failed, so this preview is showing sample traffic.",
		);
	}
}

import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type FlightBoardParams = {
	airportCode?: string;
	radiusKm?: string | number;
};

type AirportRecord = {
	name: string;
	code: string;
	iata_code?: string;
	latitude: number;
	longitude: number;
};

type OpenSkyResponse = {
	states?: Array<
		[
			string,
			string | null,
			string | null,
			number | null,
			number | null,
			number | null,
			number | null,
			number | null,
			boolean | null,
			number | null,
			number | null,
			number | null,
			number[] | null,
			number | null,
			string | null,
			boolean | null,
			number | null,
		]
	>;
};

export type FlightRow = {
	callsign: string;
	country: string;
	status: string;
	altitude: string;
	speed: string;
	distance: string;
};

export type FlightBoardRecipeData = {
	airportName: string;
	airportCode: string;
	updatedAt: string;
	note?: string;
	flights: FlightRow[];
};

const FALLBACK_AIRPORTS: Record<string, AirportRecord> = {
	JFK: {
		name: "John F. Kennedy International Airport",
		code: "KJFK",
		iata_code: "JFK",
		latitude: 40.6413,
		longitude: -73.7781,
	},
	LAX: {
		name: "Los Angeles International Airport",
		code: "KLAX",
		iata_code: "LAX",
		latitude: 33.9416,
		longitude: -118.4085,
	},
	SFO: {
		name: "San Francisco International Airport",
		code: "KSFO",
		iata_code: "SFO",
		latitude: 37.6213,
		longitude: -122.379,
	},
	LHR: {
		name: "London Heathrow Airport",
		code: "EGLL",
		iata_code: "LHR",
		latitude: 51.47,
		longitude: -0.4543,
	},
};

const SAMPLE_FLIGHTS: FlightRow[] = [
	{
		callsign: "DAL2417",
		country: "United States",
		status: "Approach",
		altitude: "5,200 ft",
		speed: "172 kt",
		distance: "11 km",
	},
	{
		callsign: "JBU529",
		country: "United States",
		status: "Ground",
		altitude: "-",
		speed: "18 kt",
		distance: "3 km",
	},
	{
		callsign: "BAW117",
		country: "United Kingdom",
		status: "Climb",
		altitude: "9,800 ft",
		speed: "221 kt",
		distance: "21 km",
	},
	{
		callsign: "AAL1452",
		country: "United States",
		status: "Cruise",
		altitude: "12,600 ft",
		speed: "308 kt",
		distance: "38 km",
	},
];

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
) {
	const earthRadiusKm = 6371;
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) ** 2;

	return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function formatAltitude(meters: number | null) {
	if (!meters) return "-";
	return `${Math.round(meters * 3.28084).toLocaleString("en-US")} ft`;
}

function formatSpeed(ms: number | null) {
	if (!ms) return "-";
	return `${Math.round(ms * 1.94384)} kt`;
}

function deriveStatus(onGround: boolean | null, verticalRate: number | null) {
	if (onGround) return "Ground";
	if ((verticalRate || 0) > 1.5) return "Climb";
	if ((verticalRate || 0) < -1.5) return "Descent";
	return "Cruise";
}

function buildFallback(code: string, note?: string): FlightBoardRecipeData {
	const airport = FALLBACK_AIRPORTS[code] || FALLBACK_AIRPORTS.JFK;
	return {
		airportName: airport.name,
		airportCode: airport.iata_code || airport.code,
		updatedAt: formatUpdatedAt(new Date()),
		note,
		flights: SAMPLE_FLIGHTS,
	};
}

async function resolveAirport(code: string): Promise<AirportRecord> {
	const fallback = FALLBACK_AIRPORTS[code.toUpperCase()];
	if (fallback) {
		return fallback;
	}

	const live = await fetchJsonWithTimeout<AirportRecord>(
		`https://airportsapi.com/api/airports/${encodeURIComponent(code)}`,
		{
			headers: {
				Accept: "application/json",
			},
		},
		8000,
	);

	return live;
}

export default async function getData(
	params?: FlightBoardParams,
): Promise<FlightBoardRecipeData> {
	const airportCode = String(params?.airportCode || "JFK").trim().toUpperCase();
	const radiusKm = Math.max(10, Math.min(150, Number(params?.radiusKm || 60)));

	try {
		const airport = await resolveAirport(airportCode);
		const latDelta = radiusKm / 111;
		const lonDelta =
			radiusKm /
			(Math.max(Math.cos(toRadians(airport.latitude)), 0.25) * 111);

		const data = await fetchJsonWithTimeout<OpenSkyResponse>(
			`https://opensky-network.org/api/states/all?lamin=${airport.latitude - latDelta}&lomin=${airport.longitude - lonDelta}&lamax=${airport.latitude + latDelta}&lomax=${airport.longitude + lonDelta}`,
			{
				headers: {
					Accept: "application/json",
				},
			},
			10000,
		);

		const flights =
			data.states
				?.map((state) => {
					const longitude = state[5];
					const latitude = state[6];
					if (longitude == null || latitude == null) {
						return null;
					}

					const distanceKm = haversineKm(
						airport.latitude,
						airport.longitude,
						latitude,
						longitude,
					);

					return {
						callsign: state[1]?.trim() || state[0].toUpperCase(),
						country: state[2] || "Unknown",
						status: deriveStatus(state[8], state[11]),
						altitude: formatAltitude(state[13] || state[7]),
						speed: formatSpeed(state[9]),
						distance: `${Math.round(distanceKm)} km`,
						distanceKm,
					};
				})
				.filter((flight): flight is FlightRow & { distanceKm: number } => Boolean(flight))
				.sort((a, b) => a.distanceKm - b.distanceKm)
				.slice(0, 6)
				.map(({ distanceKm: _distanceKm, ...flight }) => flight) || [];

		if (flights.length === 0) {
			return buildFallback(
				airportCode,
				"No live aircraft were returned for this airport window.",
			);
		}

		return {
			airportName: airport.name,
			airportCode: airport.iata_code || airport.code,
			updatedAt: formatUpdatedAt(new Date()),
			note: "Airport activity approximation powered by OpenSky live state vectors.",
			flights,
		};
	} catch (error) {
		console.error("Error loading flightboard data:", error);
		return buildFallback(
			airportCode,
			"Live airport activity fetch failed, so this preview is showing sample traffic.",
		);
	}
}

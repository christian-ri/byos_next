import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type SkyWatchParams = {
	latitude?: string | number;
	longitude?: string | number;
	radiusKm?: string | number;
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

type Aircraft = {
	id: string;
	callsign: string;
	altitudeFt: number;
	speedKt: number;
	x: number;
	y: number;
	heading: number;
	status: string;
};

export type SkyWatchRecipeData = {
	title: string;
	locationLabel: string;
	radiusLabel: string;
	updatedAt: string;
	note?: string;
	aircraft: Aircraft[];
};

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;
const DEFAULT_RADIUS_KM = 80;

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

function buildFallback(note?: string): SkyWatchRecipeData {
	return {
		title: "SkyWatch",
		locationLabel: "New York Harbor",
		radiusLabel: "80 km radius",
		updatedAt: formatUpdatedAt(new Date()),
		note,
		aircraft: [
			{
				id: "sample-1",
				callsign: "DAL2417",
				altitudeFt: 19200,
				speedKt: 322,
				x: 0.2,
				y: 0.35,
				heading: 45,
				status: "Climb",
			},
			{
				id: "sample-2",
				callsign: "JBU529",
				altitudeFt: 6400,
				speedKt: 178,
				x: 0.62,
				y: 0.56,
				heading: 280,
				status: "Approach",
			},
			{
				id: "sample-3",
				callsign: "BAW117",
				altitudeFt: 33100,
				speedKt: 472,
				x: 0.78,
				y: 0.22,
				heading: 120,
				status: "Cruise",
			},
		],
	};
}

export default async function getData(
	params?: SkyWatchParams,
): Promise<SkyWatchRecipeData> {
	const latitude = Number(params?.latitude ?? DEFAULT_LAT);
	const longitude = Number(params?.longitude ?? DEFAULT_LON);
	const radiusKm = clamp(
		Number(params?.radiusKm ?? DEFAULT_RADIUS_KM),
		20,
		200,
	);

	try {
		const latDelta = radiusKm / 111;
		const lonDelta =
			radiusKm / (Math.max(Math.cos(toRadians(latitude)), 0.25) * 111);

		const response = await fetchJsonWithTimeout<OpenSkyResponse>(
			`https://opensky-network.org/api/states/all?lamin=${latitude - latDelta}&lomin=${longitude - lonDelta}&lamax=${latitude + latDelta}&lomax=${longitude + lonDelta}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const aircraft =
			response.states
				?.map((state) => {
					const lon = state[5];
					const lat = state[6];
					if (lon == null || lat == null) return null;

					const distance = haversineKm(latitude, longitude, lat, lon);
					if (distance > radiusKm) return null;

					return {
						id: state[0],
						callsign: state[1]?.trim() || state[0].slice(0, 6).toUpperCase(),
						altitudeFt: Math.round((state[13] || state[7] || 0) * 3.28084),
						speedKt: Math.round((state[9] || 0) * 1.94384),
						x: clamp(
							(lon - (longitude - lonDelta)) / (lonDelta * 2),
							0.04,
							0.96,
						),
						y: clamp(
							(latDelta - (lat - latitude)) / (latDelta * 2),
							0.06,
							0.94,
						),
						heading: state[10] || 0,
						status: state[8]
							? "Ground"
							: distance < radiusKm * 0.35
								? "Approach"
								: "Cruise",
						distance,
					};
				})
				.filter((entry): entry is Aircraft & { distance: number } =>
					Boolean(entry),
				)
				.sort((a, b) => a.distance - b.distance)
				.slice(0, 8)
				.map(({ distance: _distance, ...entry }) => entry) || [];

		if (aircraft.length === 0) {
			return buildFallback("No live aircraft returned for this radius.");
		}

		return {
			title: "SkyWatch",
			locationLabel: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
			radiusLabel: `${radiusKm} km radius`,
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live aircraft positions via public state vectors.",
			aircraft,
		};
	} catch (error) {
		console.error("Error loading SkyWatch data:", error);
		return buildFallback(
			"Live aircraft fetch failed, so this preview is showing sample traffic.",
		);
	}
}

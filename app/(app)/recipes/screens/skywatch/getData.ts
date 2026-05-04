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
	x: number;
	y: number;
	heading: number;
	brightness: number;
};

export type SkyWatchRecipeData = {
	title: string;
	locationLabel: string;
	radiusLabel: string;
	updatedAt: string;
	note?: string;
	aircraft: Aircraft[];
};

const DEFAULT_LAT = 50.8503;
const DEFAULT_LON = 4.3517;
const DEFAULT_RADIUS_KM = 90;

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function toNm(km: number) {
	return km * 0.539957;
}

function formatAltitude(value?: number | string) {
	if (value === "ground") return "Ground";
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric <= 0) return "--";
	return `${Math.round(numeric / 100) / 10}k ft`;
}

function buildFallback(note?: string): SkyWatchRecipeData {
	return {
		title: "SkyWatch",
		locationLabel: "Brussels",
		radiusLabel: "50 nm",
		updatedAt: formatUpdatedAt(new Date()),
		note,
		aircraft: [
			{
				id: "sample-1",
				callsign: "EZY2850",
				aircraftType: "AIRBUS A-320neo",
				routeLabel: "DLM → BRS",
				altitudeLabel: "38k ft",
				speedLabel: "419 kt",
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
				x: 0.89,
				y: 0.79,
				heading: 76,
				brightness: 0.7,
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
		160,
	);
	const radiusNm = Math.round(toNm(radiusKm));

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
					const dst = clamp(Number(entry.dst || 0), 0, radiusNm);
					const dir = Number(entry.dir || 0);
					const angle = ((dir - 90) * Math.PI) / 180;
					const radial = dst / Math.max(radiusNm, 1);
					const x = clamp(0.5 + Math.cos(angle) * radial * 0.42, 0.06, 0.94);
					const y = clamp(0.5 + Math.sin(angle) * radial * 0.42, 0.08, 0.9);
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
						x,
						y,
						heading: Number(entry.track || 0),
						brightness,
					};
				}) || [];

		if (aircraft.length === 0) {
			return buildFallback("No live aircraft returned for this area.");
		}

		return {
			title: "SkyWatch",
			locationLabel: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
			radiusLabel: `${radiusNm} nm`,
			updatedAt: formatUpdatedAt(new Date()),
			note: "Aircraft via airplanes.live public point feed.",
			aircraft,
		};
	} catch (error) {
		console.error("Error loading SkyWatch data:", error);
		return buildFallback(
			"Live aircraft fetch failed, so this preview is showing sample traffic.",
		);
	}
}

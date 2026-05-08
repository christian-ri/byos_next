import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type IssPositionParams = {
	units?: string;
	showFootprint?: string | boolean;
	showTimestamp?: string | boolean;
};

type IssApiResponse = {
	name: string;
	id: number;
	latitude: number;
	longitude: number;
	altitude: number;
	velocity: number;
	visibility: string;
	footprint: number;
	timestamp: number;
};

export type IssPositionRecipeData = {
	title: string;
	subtitle: string;
	unitsLabel: string;
	showFootprint: boolean;
	showTimestamp: boolean;
	latitudeLabel: string;
	longitudeLabel: string;
	altitudeLabel: string;
	velocityLabel: string;
	visibilityLabel: string;
	updatedAt: string;
	footprintLabel: string;
	mapX: number;
	mapY: number;
	footprintPercent: number;
	note?: string;
};

const API_URL = "https://api.wheretheiss.at/v1/satellites/25544";

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["yes", "true", "1", "on"].includes(normalized)) return true;
	if (["no", "false", "0", "off"].includes(normalized)) return false;
	return fallback;
}

function normalizeUnits(value?: string) {
	return String(value || "")
		.trim()
		.toLowerCase() === "miles"
		? "miles"
		: "kilometers";
}

function formatSigned(value: number, positive: string, negative: string) {
	const absValue = Math.abs(value).toFixed(2);
	return `${absValue}° ${value >= 0 ? positive : negative}`;
}

function visibilityLabel(value?: string) {
	if (!value) return "Unknown";
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildFallback(
	unitsLabel: "kilometers" | "miles",
	showFootprint: boolean,
	showTimestamp: boolean,
	note = "Data unavailable",
): IssPositionRecipeData {
	const altitude = unitsLabel === "miles" ? 258 : 415;
	const velocity = unitsLabel === "miles" ? 17150 : 27600;
	const footprint = unitsLabel === "miles" ? 2780 : 4475;

	return {
		title: "ISS Position",
		subtitle: "International Space Station",
		unitsLabel,
		showFootprint,
		showTimestamp,
		latitudeLabel: "23.45° N",
		longitudeLabel: "42.10° W",
		altitudeLabel: `${altitude.toLocaleString("en-US")} ${
			unitsLabel === "miles" ? "mi" : "km"
		}`,
		velocityLabel: `${velocity.toLocaleString("en-US")} ${
			unitsLabel === "miles" ? "mph" : "km/h"
		}`,
		visibilityLabel: "Daylight",
		updatedAt: formatUpdatedAt(new Date()),
		footprintLabel: `${footprint.toLocaleString("en-US")} ${
			unitsLabel === "miles" ? "mi" : "km"
		}`,
		mapX: 0.38,
		mapY: 0.4,
		footprintPercent: 0.24,
		note,
	};
}

export default async function getData(
	params?: IssPositionParams,
): Promise<IssPositionRecipeData> {
	const unitsLabel = normalizeUnits(params?.units);
	const showFootprint = parseBoolean(params?.showFootprint, true);
	const showTimestamp = parseBoolean(params?.showTimestamp, true);

	try {
		const response = await fetchJsonWithTimeout<IssApiResponse>(
			API_URL,
			{ headers: { Accept: "application/json" } },
			8000,
		);

		const distanceFactor = unitsLabel === "miles" ? 0.621371 : 1;
		const speedUnit = unitsLabel === "miles" ? "mph" : "km/h";
		const distanceUnit = unitsLabel === "miles" ? "mi" : "km";
		const latitude = Number(response.latitude);
		const longitude = Number(response.longitude);

		return {
			title: "ISS Position",
			subtitle: "International Space Station",
			unitsLabel,
			showFootprint,
			showTimestamp,
			latitudeLabel: formatSigned(latitude, "N", "S"),
			longitudeLabel: formatSigned(longitude, "E", "W"),
			altitudeLabel: `${Math.round(
				Number(response.altitude) * distanceFactor,
			).toLocaleString("en-US")} ${distanceUnit}`,
			velocityLabel: `${Math.round(
				Number(response.velocity) * distanceFactor,
			).toLocaleString("en-US")} ${speedUnit}`,
			visibilityLabel: visibilityLabel(response.visibility),
			updatedAt: formatUpdatedAt(new Date(Number(response.timestamp) * 1000)),
			footprintLabel: `${Math.round(
				Number(response.footprint) * distanceFactor,
			).toLocaleString("en-US")} ${distanceUnit}`,
			mapX: Math.min(0.94, Math.max(0.06, (longitude + 180) / 360)),
			mapY: Math.min(0.9, Math.max(0.1, (90 - latitude) / 180)),
			footprintPercent: Math.min(
				0.32,
				Math.max(
					0.12,
					(Number(response.footprint) * distanceFactor) /
						(unitsLabel === "miles" ? 16000 : 26000),
				),
			),
		};
	} catch (error) {
		console.error("Error loading ISS data:", error);
		return buildFallback(unitsLabel, showFootprint, showTimestamp);
	}
}

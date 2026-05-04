import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type WeatherParams = {
	location?: string;
	latitude?: string | number;
	longitude?: string | number;
	units?: string;
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

type ForecastResponse = {
	timezone?: string;
	current?: {
		temperature_2m?: number;
		apparent_temperature?: number;
		precipitation?: number;
		weather_code?: number;
		wind_speed_10m?: number;
	};
	daily?: {
		time?: string[];
		weather_code?: number[];
		temperature_2m_max?: number[];
		temperature_2m_min?: number[];
		sunrise?: string[];
		sunset?: string[];
	};
};

type ForecastDay = {
	label: string;
	condition: string;
	high: string;
	low: string;
};

export type LpWeatherRecipeData = {
	title: string;
	locationLabel: string;
	currentTemp: string;
	feelsLike: string;
	condition: string;
	windSpeed: string;
	precipitation: string;
	sunrise: string;
	sunset: string;
	updatedAt: string;
	note?: string;
	days: ForecastDay[];
};

function weatherLabel(code?: number) {
	switch (code) {
		case 0:
			return "Clear";
		case 1:
		case 2:
		case 3:
			return "Cloudy";
		case 45:
		case 48:
			return "Fog";
		case 51:
		case 53:
		case 55:
		case 61:
		case 63:
		case 65:
		case 80:
		case 81:
		case 82:
			return "Rain";
		case 71:
		case 73:
		case 75:
		case 85:
		case 86:
			return "Snow";
		case 95:
		case 96:
		case 99:
			return "Storm";
		default:
			return "Mixed";
	}
}

function formatClock(value?: string) {
	if (!value) return "--:--";
	return new Date(value).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

async function resolveLocation(params?: WeatherParams) {
	const latitude = Number(params?.latitude);
	const longitude = Number(params?.longitude);
	if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
		return {
			latitude,
			longitude,
			name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
			timezone: "auto",
		};
	}

	const query = String(params?.location || "Boston").trim();
	const geo = await fetchJsonWithTimeout<GeocodingResponse>(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
		{ headers: { Accept: "application/json" } },
		8000,
	);
	const first = geo.results?.[0];
	if (!first) {
		throw new Error(`Could not resolve location "${query}"`);
	}

	return {
		latitude: first.latitude,
		longitude: first.longitude,
		name: `${first.name}${first.country ? `, ${first.country}` : ""}`,
		timezone: first.timezone || "auto",
	};
}

export default async function getData(
	params?: WeatherParams,
): Promise<LpWeatherRecipeData> {
	const units = String(params?.units || "metric")
		.trim()
		.toLowerCase();

	try {
		const location = await resolveLocation(params);
		const forecast = await fetchJsonWithTimeout<ForecastResponse>(
			`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=${encodeURIComponent(location.timezone) || "auto"}&forecast_days=5${units === "imperial" ? "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch" : ""}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const days =
			forecast.daily?.time?.slice(0, 4).map((date, index) => ({
				label: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
				condition: weatherLabel(forecast.daily?.weather_code?.[index]),
				high: String(
					Math.round(forecast.daily?.temperature_2m_max?.[index] || 0),
				),
				low: String(
					Math.round(forecast.daily?.temperature_2m_min?.[index] || 0),
				),
			})) || [];

		return {
			title: "LP Weather",
			locationLabel: location.name,
			currentTemp: String(Math.round(forecast.current?.temperature_2m || 0)),
			feelsLike: String(
				Math.round(forecast.current?.apparent_temperature || 0),
			),
			condition: weatherLabel(forecast.current?.weather_code),
			windSpeed: String(Math.round(forecast.current?.wind_speed_10m || 0)),
			precipitation: String(forecast.current?.precipitation || 0),
			sunrise: formatClock(forecast.daily?.sunrise?.[0]),
			sunset: formatClock(forecast.daily?.sunset?.[0]),
			updatedAt: formatUpdatedAt(new Date()),
			note: "Forecast via Open-Meteo.",
			days,
		};
	} catch (error) {
		console.error("Error loading LP Weather data:", error);
		return {
			title: "LP Weather",
			locationLabel: "Boston, United States",
			currentTemp: "12",
			feelsLike: "9",
			condition: "Cloudy",
			windSpeed: "14",
			precipitation: "0",
			sunrise: "5:36 AM",
			sunset: "7:45 PM",
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live forecast failed, so this preview is showing sample weather.",
			days: [
				{ label: "Sun", condition: "Cloudy", high: "12", low: "5" },
				{ label: "Mon", condition: "Rain", high: "20", low: "4" },
				{ label: "Tue", condition: "Clear", high: "24", low: "10" },
				{ label: "Wed", condition: "Rain", high: "18", low: "13" },
			],
		};
	}
}

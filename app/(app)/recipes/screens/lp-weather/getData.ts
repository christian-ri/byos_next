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
		wind_direction_10m?: number;
		relative_humidity_2m?: number;
	};
	hourly?: {
		time?: string[];
		temperature_2m?: number[];
		weather_code?: number[];
		precipitation_probability?: number[];
	};
	daily?: {
		time?: string[];
		weather_code?: number[];
		temperature_2m_max?: number[];
		temperature_2m_min?: number[];
		sunrise?: string[];
		sunset?: string[];
		precipitation_probability_max?: number[];
	};
};

type ForecastDay = {
	label: string;
	condition: string;
	icon: string;
	high: number;
	low: number;
	precipProbability: number;
};

type HourPoint = {
	timeLabel: string;
	temperature: number;
	icon: string;
	precipProbability: number;
};

export type LpWeatherRecipeData = {
	title: string;
	locationLabel: string;
	temperatureUnit: "C" | "F";
	windUnit: "km/h" | "mph";
	currentTemp: number;
	feelsLike: number;
	condition: string;
	conditionIcon: string;
	windSpeed: number;
	windDirection: string;
	humidity: number;
	sunrise: string;
	sunset: string;
	sunriseIso?: string;
	sunsetIso?: string;
	updatedAt: string;
	note?: string;
	days: ForecastDay[];
	hourly: HourPoint[];
};

function weatherLabel(code?: number) {
	switch (code) {
		case 0:
			return "Clear";
		case 1:
			return "Mainly Clear";
		case 2:
			return "Partly Cloudy";
		case 3:
			return "Overcast";
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

function weatherIcon(code?: number) {
	switch (code) {
		case 0:
			return "sun";
		case 1:
		case 2:
			return "partly-cloudy";
		case 3:
			return "cloud";
		case 45:
		case 48:
			return "fog";
		case 51:
		case 53:
		case 55:
		case 61:
		case 63:
		case 65:
		case 80:
		case 81:
		case 82:
			return "rain";
		case 71:
		case 73:
		case 75:
		case 85:
		case 86:
			return "snow";
		case 95:
		case 96:
		case 99:
			return "storm";
		default:
			return "cloud";
	}
}

function formatClock(value?: string) {
	if (!value) return "--:--";
	return new Date(value).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

function windDirectionLabel(degrees?: number) {
	if (!Number.isFinite(degrees)) return "--";
	const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	const index = Math.round(((degrees || 0) % 360) / 45) % directions.length;
	return directions[index];
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
	const units = String(params?.units || "imperial")
		.trim()
		.toLowerCase();

	try {
		const location = await resolveLocation(params);
		const forecast = await fetchJsonWithTimeout<ForecastResponse>(
			`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=${encodeURIComponent(location.timezone) || "auto"}&forecast_days=6${units === "imperial" ? "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch" : ""}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const hourly = (forecast.hourly?.time || [])
			.slice(0, 8)
			.map((time, index) => ({
				timeLabel:
					index === 0
						? "Now"
						: new Date(time).toLocaleTimeString("en-US", {
								hour: "numeric",
							}),
				temperature: Math.round(forecast.hourly?.temperature_2m?.[index] || 0),
				icon: weatherIcon(forecast.hourly?.weather_code?.[index]),
				precipProbability: Math.round(
					forecast.hourly?.precipitation_probability?.[index] || 0,
				),
			}));

		const days =
			forecast.daily?.time?.slice(0, 6).map((date, index) => ({
				label:
					index === 0
						? "Today"
						: new Date(date).toLocaleDateString("en-US", {
								weekday: "long",
							}),
				condition: weatherLabel(forecast.daily?.weather_code?.[index]),
				icon: weatherIcon(forecast.daily?.weather_code?.[index]),
				high: Math.round(forecast.daily?.temperature_2m_max?.[index] || 0),
				low: Math.round(forecast.daily?.temperature_2m_min?.[index] || 0),
				precipProbability: Math.round(
					forecast.daily?.precipitation_probability_max?.[index] || 0,
				),
			})) || [];

		return {
			title: "LP Weather",
			locationLabel: location.name,
			temperatureUnit: units === "imperial" ? "F" : "C",
			windUnit: units === "imperial" ? "mph" : "km/h",
			currentTemp: Math.round(forecast.current?.temperature_2m || 0),
			feelsLike: Math.round(forecast.current?.apparent_temperature || 0),
			condition: weatherLabel(forecast.current?.weather_code),
			conditionIcon: weatherIcon(forecast.current?.weather_code),
			windSpeed: Math.round(forecast.current?.wind_speed_10m || 0),
			windDirection: windDirectionLabel(forecast.current?.wind_direction_10m),
			humidity: Math.round(forecast.current?.relative_humidity_2m || 0),
			sunrise: formatClock(forecast.daily?.sunrise?.[0]),
			sunset: formatClock(forecast.daily?.sunset?.[0]),
			sunriseIso: forecast.daily?.sunrise?.[0],
			sunsetIso: forecast.daily?.sunset?.[0],
			updatedAt: formatUpdatedAt(new Date()),
			note: "Forecast via Open-Meteo.",
			days,
			hourly,
		};
	} catch (error) {
		console.error("Error loading LP Weather data:", error);
		return {
			title: "LP Weather",
			locationLabel: "Boston, United States",
			temperatureUnit: units === "imperial" ? "F" : "C",
			windUnit: units === "imperial" ? "mph" : "km/h",
			currentTemp: 48,
			feelsLike: 38,
			condition: "Overcast",
			conditionIcon: "cloud",
			windSpeed: 17,
			windDirection: "W",
			humidity: 35,
			sunrise: "6:15 AM",
			sunset: "7:15 PM",
			sunriseIso: new Date().toISOString(),
			sunsetIso: new Date().toISOString(),
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live forecast failed, so this preview is showing sample weather.",
			hourly: [
				{
					timeLabel: "Now",
					temperature: 47,
					icon: "cloud",
					precipProbability: 0,
				},
				{
					timeLabel: "5 PM",
					temperature: 47,
					icon: "partly-cloudy",
					precipProbability: 0,
				},
				{
					timeLabel: "9 PM",
					temperature: 38,
					icon: "moon",
					precipProbability: 24,
				},
				{
					timeLabel: "1 AM",
					temperature: 33,
					icon: "moon",
					precipProbability: 10,
				},
				{
					timeLabel: "5 AM",
					temperature: 32,
					icon: "cloud",
					precipProbability: 12,
				},
				{
					timeLabel: "9 AM",
					temperature: 34,
					icon: "snow",
					precipProbability: 20,
				},
				{
					timeLabel: "1 PM",
					temperature: 34,
					icon: "cloud",
					precipProbability: 8,
				},
			],
			days: [
				{
					label: "Today",
					condition: "Overcast",
					icon: "cloud",
					high: 48,
					low: 35,
					precipProbability: 0,
				},
				{
					label: "Tuesday",
					condition: "Snow",
					icon: "snow",
					high: 40,
					low: 31,
					precipProbability: 24,
				},
				{
					label: "Wednesday",
					condition: "Cloudy",
					icon: "cloud",
					high: 39,
					low: 29,
					precipProbability: 0,
				},
				{
					label: "Thursday",
					condition: "Clear",
					icon: "sun",
					high: 54,
					low: 34,
					precipProbability: 0,
				},
				{
					label: "Friday",
					condition: "Cloudy",
					icon: "cloud",
					high: 62,
					low: 39,
					precipProbability: 0,
				},
				{
					label: "Saturday",
					condition: "Cloudy",
					icon: "cloud",
					high: 61,
					low: 46,
					precipProbability: 12,
				},
			],
		};
	}
}

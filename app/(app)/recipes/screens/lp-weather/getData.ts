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
	hours?: string | number;
	days?: string | number;
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
		time?: string;
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
	dateLabel: string;
	condition: string;
	iconClass: string;
	high: number;
	low: number;
	precipProbability: number;
	sunrise?: string;
	sunset?: string;
};

type HourPoint = {
	label: string;
	timeIso: string;
	temperature: number;
	iconClass: string;
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
	iconClass: string;
	windSpeed: number;
	windDirection: string;
	humidity: number;
	sunrise: string;
	sunset: string;
	sunriseIso?: string;
	sunsetIso?: string;
	currentTimeIso?: string;
	updatedAt: string;
	note?: string;
	days: ForecastDay[];
	hourly: HourPoint[];
};

const DEFAULT_LAT = 42.3601;
const DEFAULT_LON = -71.0589;
const DEFAULT_LOCATION = "Boston, United States";

function normalizeUnits(value?: string) {
	return String(value || "metric")
		.trim()
		.toLowerCase() === "metric"
		? "metric"
		: "imperial";
}

function normalizeHours(value?: string | number) {
	const hours = Number(value);
	if (!Number.isFinite(hours)) return 25;
	return Math.max(1, Math.min(25, Math.round(hours)));
}

function normalizeDays(value?: string | number) {
	const days = Number(value);
	if (!Number.isFinite(days)) return 6;
	return Math.max(1, Math.min(6, Math.round(days)));
}

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
			return "Drizzle";
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

function isDaytime(currentTime?: string, sunrise?: string, sunset?: string) {
	if (!currentTime || !sunrise || !sunset) return true;
	const now = new Date(currentTime).getTime();
	return now >= new Date(sunrise).getTime() && now < new Date(sunset).getTime();
}

function iconClassForWeather(code?: number, day = true) {
	switch (code) {
		case 0:
			return day ? "wi-day-sunny" : "wi-night-clear";
		case 1:
			return day ? "wi-day-sunny-overcast" : "wi-night-partly-cloudy";
		case 2:
			return day ? "wi-day-cloudy" : "wi-night-cloudy";
		case 3:
			return "wi-cloudy";
		case 45:
		case 48:
			return "wi-fog";
		case 51:
		case 53:
		case 55:
		case 61:
		case 63:
		case 65:
		case 80:
		case 81:
		case 82:
			return "wi-rain";
		case 71:
		case 73:
		case 75:
		case 85:
		case 86:
			return "wi-snow";
		case 95:
		case 96:
		case 99:
			return "wi-thunderstorm";
		default:
			return "wi-na";
	}
}

function formatClock(value?: string, timeZone?: string) {
	if (!value) return "--:--";
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatHourLabel(value: string, timeZone?: string) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "numeric",
		hour12: true,
	})
		.format(new Date(value))
		.replace(/\s/g, "")
		.toLowerCase();
}

function formatWeekday(value: string, timeZone?: string) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "long",
	}).format(new Date(value));
}

function formatShortDate(value: string, timeZone?: string) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		month: "short",
		day: "numeric",
	}).format(new Date(value));
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
		return {
			latitude: DEFAULT_LAT,
			longitude: DEFAULT_LON,
			name: DEFAULT_LOCATION,
			timezone: "America/New_York",
		};
	}

	return {
		latitude: first.latitude,
		longitude: first.longitude,
		name: `${first.name}${first.country ? `, ${first.country}` : ""}`,
		timezone: first.timezone || "auto",
	};
}

function buildFallback(
	units: "metric" | "imperial",
	hours: number,
	days: number,
): LpWeatherRecipeData {
	const nowDate = new Date();
	const sunriseDate = new Date(nowDate);
	sunriseDate.setHours(6, 15, 0, 0);
	const sunsetDate = new Date(nowDate);
	sunsetDate.setHours(19, 15, 0, 0);
	const now = nowDate.toISOString();
	return {
		title: "LP Weather",
		locationLabel: DEFAULT_LOCATION,
		temperatureUnit: units === "imperial" ? "F" : "C",
		windUnit: units === "imperial" ? "mph" : "km/h",
		currentTemp: units === "imperial" ? 45 : 7,
		feelsLike: units === "imperial" ? 35 : 2,
		condition: "Clear",
		iconClass: "wi-day-sunny",
		windSpeed: units === "imperial" ? 16 : 26,
		windDirection: "NE",
		humidity: 58,
		sunrise: "6:15 AM",
		sunset: "7:15 PM",
		sunriseIso: sunriseDate.toISOString(),
		sunsetIso: sunsetDate.toISOString(),
		currentTimeIso: now,
		updatedAt: formatUpdatedAt(new Date()),
		note: "Live forecast failed, so this preview is showing sample weather.",
		hourly: Array.from({ length: Math.min(hours, 25) }, (_, index) => {
			const time = new Date(nowDate.getTime() + index * 60 * 60 * 1000);
			const tempSeries =
				units === "imperial"
					? [
							45, 45, 44, 44, 43, 42, 38, 39, 38, 43, 48, 53, 57, 57, 59, 59,
							53, 53, 53, 52, 51, 51, 50, 49, 48,
						]
					: [
							7, 7, 7, 7, 6, 6, 3, 4, 3, 6, 9, 12, 14, 14, 15, 15, 12, 12, 12,
							11, 11, 11, 10, 9, 9,
						];
			const precipSeries = [
				0, 0, 0, 0, 0, 0, 12, 18, 12, 8, 22, 18, 30, 16, 34, 28, 10, 8, 6, 12,
				14, 12, 16, 14, 12,
			];
			return {
				label: index === 0 ? "Now" : formatHourLabel(time.toISOString()),
				timeIso: time.toISOString(),
				temperature: tempSeries[index] ?? tempSeries[tempSeries.length - 1],
				iconClass:
					index < 6
						? "wi-day-sunny"
						: index < 10
							? "wi-rain"
							: index < 16
								? "wi-night-partly-cloudy"
								: "wi-day-cloudy",
				precipProbability:
					precipSeries[index] ?? precipSeries[precipSeries.length - 1],
			};
		}),
		days: Array.from({ length: days }, (_, index) => {
			const dayDate = new Date(nowDate.getTime() + index * 24 * 60 * 60 * 1000);
			return {
				label:
					index === 0
						? "Today"
						: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
								dayDate,
							),
				dateLabel: new Intl.DateTimeFormat("en-US", {
					month: "short",
					day: "numeric",
				}).format(dayDate),
				condition:
					["Clear", "Rain", "Rain", "Rain", "Snow", "Partly Cloudy"][index] ||
					"Mixed",
				iconClass:
					[
						"wi-rain",
						"wi-rain",
						"wi-rain",
						"wi-rain",
						"wi-snow",
						"wi-day-cloudy",
					][index] || "wi-cloudy",
				high:
					(units === "imperial"
						? [51, 60, 41, 44, 37, 57]
						: [11, 16, 5, 7, 3, 14])[index] || 0,
				low:
					(units === "imperial"
						? [38, 33, 30, 32, 31, 38]
						: [3, 1, -1, 0, -1, 3])[index] || 0,
				precipProbability: [86, 29, 21, 21, 29, 83][index] || 0,
				sunrise: new Date(
					sunriseDate.getTime() + index * 24 * 60 * 60 * 1000,
				).toISOString(),
				sunset: new Date(
					sunsetDate.getTime() + index * 24 * 60 * 60 * 1000,
				).toISOString(),
			};
		}),
	};
}

export default async function getData(
	params?: WeatherParams,
): Promise<LpWeatherRecipeData> {
	const units = normalizeUnits(params?.units);
	const hours = normalizeHours(params?.hours);
	const days = normalizeDays(params?.days);

	try {
		const location = await resolveLocation(params);
		const forecast = await fetchJsonWithTimeout<ForecastResponse>(
			`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=${encodeURIComponent(location.timezone || "auto")}&forecast_days=${days}${units === "imperial" ? "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch" : ""}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const timeZone = forecast.timezone || location.timezone || "auto";
		const currentTime = forecast.current?.time;
		const sunriseToday = forecast.daily?.sunrise?.[0];
		const sunsetToday = forecast.daily?.sunset?.[0];
		const hourlyTimes = forecast.hourly?.time || [];
		const startIndex = currentTime
			? Math.max(
					0,
					hourlyTimes.findIndex(
						(time) => new Date(time) >= new Date(currentTime),
					),
				)
			: 0;
		const slicedTimes = hourlyTimes.slice(startIndex, startIndex + hours);
		const hourly = slicedTimes.map((time, index) => ({
			label: index === 0 ? "Now" : formatHourLabel(time, timeZone),
			timeIso: time,
			temperature: Math.round(
				forecast.hourly?.temperature_2m?.[startIndex + index] || 0,
			),
			iconClass: iconClassForWeather(
				forecast.hourly?.weather_code?.[startIndex + index],
				isDaytime(
					time,
					forecast.daily?.sunrise?.find(
						(sunrise) => sunrise?.slice(0, 10) === time.slice(0, 10),
					),
					forecast.daily?.sunset?.find(
						(sunset) => sunset?.slice(0, 10) === time.slice(0, 10),
					),
				),
			),
			precipProbability: Math.round(
				forecast.hourly?.precipitation_probability?.[startIndex + index] || 0,
			),
		}));

		const forecastDays =
			forecast.daily?.time?.slice(0, days).map((date, index) => {
				const sunrise = forecast.daily?.sunrise?.[index];
				const sunset = forecast.daily?.sunset?.[index];
				return {
					label: index === 0 ? "Today" : formatWeekday(date, timeZone),
					dateLabel: formatShortDate(date, timeZone),
					condition: weatherLabel(forecast.daily?.weather_code?.[index]),
					iconClass: iconClassForWeather(
						forecast.daily?.weather_code?.[index],
						true,
					),
					high: Math.round(forecast.daily?.temperature_2m_max?.[index] || 0),
					low: Math.round(forecast.daily?.temperature_2m_min?.[index] || 0),
					precipProbability: Math.round(
						forecast.daily?.precipitation_probability_max?.[index] || 0,
					),
					sunrise,
					sunset,
				};
			}) || [];

		return {
			title: "LP Weather",
			locationLabel: location.name,
			temperatureUnit: units === "imperial" ? "F" : "C",
			windUnit: units === "imperial" ? "mph" : "km/h",
			currentTemp: Math.round(forecast.current?.temperature_2m || 0),
			feelsLike: Math.round(forecast.current?.apparent_temperature || 0),
			condition: weatherLabel(forecast.current?.weather_code),
			iconClass: iconClassForWeather(
				forecast.current?.weather_code,
				isDaytime(currentTime, sunriseToday, sunsetToday),
			),
			windSpeed: Math.round(forecast.current?.wind_speed_10m || 0),
			windDirection: windDirectionLabel(forecast.current?.wind_direction_10m),
			humidity: Math.round(forecast.current?.relative_humidity_2m || 0),
			sunrise: formatClock(sunriseToday, timeZone),
			sunset: formatClock(sunsetToday, timeZone),
			sunriseIso: sunriseToday,
			sunsetIso: sunsetToday,
			currentTimeIso: currentTime,
			updatedAt: formatUpdatedAt(new Date(), timeZone),
			note: "Forecast via Open-Meteo.",
			days: forecastDays,
			hourly,
		};
	} catch (error) {
		console.error("Error loading LP Weather data:", error);
		return buildFallback(units, hours, days);
	}
}

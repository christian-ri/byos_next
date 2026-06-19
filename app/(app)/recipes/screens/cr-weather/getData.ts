import {
	fetchJsonWithTimeout,
	formatDateTime,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";
import { estimateBatteryLife } from "@/utils/helpers";

export const dynamic = "force-dynamic";

export type WeatherIconName =
	| "clear-day"
	| "partly-cloudy-day"
	| "overcast"
	| "rain"
	| "partly-cloudy-day-rain"
	| "thunderstorms"
	| "snow"
	| "fog"
	| "wind";

export type HourPoint = {
	label: string;
	temp: number;
	feels: number;
	precipitationProbability: number;
};

export type DayPoint = {
	label: string;
	icon: WeatherIconName;
	high: number;
	low: number;
	windSpeed: number;
	windArrow: string;
};

export type CrWeatherData = {
	location: string;
	time: string;
	updatedAt: string;
	batteryLabel: string;
	temperatureUnit: "C" | "F";
	windUnit: "km/h" | "mph";
	currentTemp: string;
	feelsLike: string;
	condition: string;
	description: string;
	windSpeed: string;
	windDirection: string;
	humidity: string;
	pressure: string;
	currentIcon: WeatherIconName;
	hourly: HourPoint[];
	days: DayPoint[];
	aqi: string;
	aqiStatus: string;
	aqiScale: string;
	aqiSummary: string;
	aqiRecommendation: string;
	aqiPrimary: string;
	aqiAvailable: boolean;
};

type CrWeatherParams = {
	location?: string;
	latitude?: string | number;
	longitude?: string | number;
	units?: string;
	language?: string;
	batteryVoltage?: string | number;
	batteryPercent?: string | number;
	batteryLabel?: string;
};

type GeocodingResponse = {
	results?: Array<{
		name: string;
		country_code?: string;
		country?: string;
		admin1?: string;
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
		relative_humidity_2m?: number;
		surface_pressure?: number;
		weather_code?: number;
		wind_speed_10m?: number;
		wind_direction_10m?: number;
		is_day?: number;
	};
	hourly?: {
		time?: string[];
		temperature_2m?: number[];
		apparent_temperature?: number[];
		weather_code?: number[];
		precipitation_probability?: number[];
	};
	daily?: {
		time?: string[];
		temperature_2m_max?: number[];
		temperature_2m_min?: number[];
		weather_code?: number[];
		wind_speed_10m_max?: number[];
		wind_direction_10m_dominant?: number[];
	};
};

type AirQualityResponse = {
	current?: {
		european_aqi?: number;
		pm2_5?: number;
	};
};

const DEFAULT_LOCATION = "Berlin, DE";
const DEFAULT_LATITUDE = 52.52;
const DEFAULT_LONGITUDE = 13.405;

function parseOptionalNumber(value?: string | number) {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : Number.NaN;
	}

	const normalized = String(value ?? "").trim();
	if (!normalized) return Number.NaN;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeUnits(value?: string) {
	return String(value || "metric")
		.trim()
		.toLowerCase() === "imperial"
		? "imperial"
		: "metric";
}

function normalizeLanguage(value?: string) {
	const normalized = String(value || "de")
		.trim()
		.toLowerCase();
	return normalized.length >= 2 ? normalized : "de";
}

function formatClock(value: string | Date, timeZone?: string) {
	return formatDateTime(
		value,
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		timeZone,
	);
}

function formatHourLabel(value: string, timeZone?: string) {
	return formatDateTime(
		value,
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		timeZone,
	);
}

function formatDayLabel(value: string, index: number, timeZone?: string) {
	if (index === 0) return "HEUTE";
	return formatDateTime(value, { weekday: "short" }, timeZone)
		.replace(".", "")
		.toUpperCase();
}

function formatBatteryLabel(params?: CrWeatherParams) {
	const explicitLabel = String(params?.batteryLabel || "").trim();
	if (explicitLabel) return explicitLabel;

	const voltage = parseOptionalNumber(params?.batteryVoltage);
	if (!Number.isFinite(voltage)) return "--";

	const percent = parseOptionalNumber(params?.batteryPercent);
	const estimate = estimateBatteryLife(
		voltage,
		48,
		1800,
		Number.isFinite(percent) ? percent : null,
	);
	if (estimate.isCharging) return "CHG";
	return `${Math.round(estimate.batteryPercentage)}%`;
}

function windDirectionLabel(degrees?: number) {
	if (!Number.isFinite(degrees)) return "--";
	const directions = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
	const index = Math.round(((degrees || 0) % 360) / 45) % directions.length;
	return directions[index];
}

function windArrow(degrees?: number) {
	if (!Number.isFinite(degrees)) return "→";
	const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
	const index = Math.round(((degrees || 0) % 360) / 45) % arrows.length;
	return arrows[index];
}

function weatherLabel(code?: number) {
	switch (code) {
		case 0:
			return "Klar";
		case 1:
			return "Überwiegend klar";
		case 2:
			return "Teils bewölkt";
		case 3:
			return "Bedeckt";
		case 45:
		case 48:
			return "Nebel";
		case 51:
		case 53:
		case 55:
			return "Nieselregen";
		case 56:
		case 57:
			return "Gefrierender Nieselregen";
		case 61:
		case 63:
		case 65:
			return "Regen";
		case 66:
		case 67:
			return "Gefrierender Regen";
		case 71:
		case 73:
		case 75:
		case 77:
			return "Schnee";
		case 80:
		case 81:
		case 82:
			return "Regenschauer";
		case 85:
		case 86:
			return "Schneeschauer";
		case 95:
		case 96:
		case 99:
			return "Gewitter";
		default:
			return "Wechselhaft";
	}
}

function weatherIcon(code?: number, isDay = true): WeatherIconName {
	if ([45, 48].includes(code || -1)) return "fog";
	if ([95, 96, 99].includes(code || -1)) return "thunderstorms";
	if ([71, 73, 75, 77, 85, 86].includes(code || -1)) return "snow";
	if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code || -1)) {
		return isDay && [80, 81].includes(code || -1)
			? "partly-cloudy-day-rain"
			: "rain";
	}
	if ((code || 0) === 3) return "overcast";
	if ([1, 2].includes(code || -1)) return "partly-cloudy-day";
	if ((code || 0) === 0) return "clear-day";
	return "partly-cloudy-day";
}

function aqiCategory(value?: number) {
	if (!Number.isFinite(value)) {
		return {
			status: "N/A",
			summary: "Luftqualitätsdaten derzeit nicht verfügbar.",
			recommendation: "Bitte später erneut prüfen.",
		};
	}

	if ((value || 0) <= 20) {
		return {
			status: "SEHR GUT",
			summary: "Die Luftqualität ist sehr gut.",
			recommendation: "Beste Bedingungen für Aktivitäten im Freien.",
		};
	}

	if ((value || 0) <= 40) {
		return {
			status: "GUT",
			summary: "Die Luftqualität ist gut.",
			recommendation: "Ideal für Aktivitäten im Freien.",
		};
	}

	if ((value || 0) <= 60) {
		return {
			status: "MÄSSIG",
			summary: "Die Luftqualität ist mäßig.",
			recommendation: "Für die meisten Menschen weiterhin unkritisch.",
		};
	}

	if ((value || 0) <= 80) {
		return {
			status: "ERHÖHT",
			summary: "Die Luftqualität ist erhöht.",
			recommendation: "Empfindliche Personen sollten sich schonen.",
		};
	}

	return {
		status: "SCHLECHT",
		summary: "Die Luftqualität ist schlecht.",
		recommendation: "Längere Aktivitäten im Freien besser vermeiden.",
	};
}

async function resolveLocation(params?: CrWeatherParams) {
	const latitude = parseOptionalNumber(params?.latitude);
	const longitude = parseOptionalNumber(params?.longitude);

	if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
		return {
			latitude,
			longitude,
			name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
			timezone: "auto",
		};
	}

	const query = String(params?.location || DEFAULT_LOCATION).trim();
	const language = normalizeLanguage(params?.language);
	const geo = await fetchJsonWithTimeout<GeocodingResponse>(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=${encodeURIComponent(language)}&format=json`,
		{ headers: { Accept: "application/json" } },
		8000,
	).catch(() => null);

	const first = geo?.results?.[0];
	if (!first) {
		return {
			latitude: DEFAULT_LATITUDE,
			longitude: DEFAULT_LONGITUDE,
			name: DEFAULT_LOCATION,
			timezone: "Europe/Berlin",
		};
	}

	return {
		latitude: first.latitude,
		longitude: first.longitude,
		name: [first.name, first.country_code || first.country]
			.filter(Boolean)
			.join(", "),
		timezone: first.timezone || "auto",
	};
}

function buildDescription(
	temperature: number,
	windSpeed: number,
	windDirection: string,
	condition: string,
) {
	const tempTone =
		temperature >= 28
			? "Spürbar warm."
			: temperature >= 20
				? "Angenehm mild."
				: temperature >= 10
					? "Frisch, aber angenehm."
					: "Kühl und eher frisch.";
	const windTone =
		windSpeed >= 30
			? "Kräftiger Wind"
			: windSpeed >= 18
				? "Mäßiger Wind"
				: "Leichter Wind";
	return `${tempTone} ${windTone} aus ${windDirection}. ${condition}.`;
}

function buildFallback(): CrWeatherData {
	return {
		location: DEFAULT_LOCATION,
		time: "10:42",
		updatedAt: "10:41",
		batteryLabel: "--",
		temperatureUnit: "C",
		windUnit: "km/h",
		currentTemp: "18.6°",
		feelsLike: "17.2°",
		condition: "Teils bewölkt",
		description: "Angenehm mild. Leichter Wind aus Südwest.",
		windSpeed: "14 km/h",
		windDirection: "SW",
		humidity: "63 %",
		pressure: "1016 hPa",
		currentIcon: "partly-cloudy-day",
		hourly: [
			{ label: "11:00", temp: 18, feels: 17, precipitationProbability: 10 },
			{ label: "12:00", temp: 19, feels: 18, precipitationProbability: 20 },
			{ label: "13:00", temp: 20, feels: 19, precipitationProbability: 35 },
			{ label: "14:00", temp: 21, feels: 20, precipitationProbability: 30 },
			{ label: "15:00", temp: 20, feels: 19, precipitationProbability: 15 },
			{ label: "16:00", temp: 19, feels: 18, precipitationProbability: 5 },
		],
		days: [
			{
				label: "HEUTE",
				icon: "partly-cloudy-day",
				high: 21,
				low: 12,
				windSpeed: 14,
				windArrow: "↙",
			},
			{
				label: "SA",
				icon: "rain",
				high: 19,
				low: 11,
				windSpeed: 18,
				windArrow: "↙",
			},
			{
				label: "SO",
				icon: "clear-day",
				high: 22,
				low: 13,
				windSpeed: 12,
				windArrow: "→",
			},
			{
				label: "MO",
				icon: "overcast",
				high: 20,
				low: 12,
				windSpeed: 16,
				windArrow: "↘",
			},
			{
				label: "DI",
				icon: "rain",
				high: 18,
				low: 10,
				windSpeed: 20,
				windArrow: "↙",
			},
		],
		aqi: "42",
		aqiStatus: "GUT",
		aqiScale: "AQI (DE)",
		aqiSummary: "Die Luftqualität ist gut.",
		aqiRecommendation: "Ideal für Aktivitäten im Freien.",
		aqiPrimary: "Hauptbelastung: Feinstaub (PM2.5)",
		aqiAvailable: true,
	};
}

export default async function getData(
	params?: CrWeatherParams,
): Promise<CrWeatherData> {
	const units = normalizeUnits(params?.units);
	const batteryLabel = formatBatteryLabel(params);

	try {
		const location = await resolveLocation(params);
		const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant&timezone=${encodeURIComponent(location.timezone || "auto")}&forecast_days=5${units === "imperial" ? "&temperature_unit=fahrenheit&wind_speed_unit=mph" : ""}`;
		const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&current=european_aqi,pm2_5&timezone=${encodeURIComponent(location.timezone || "auto")}`;

		const [forecast, airQuality] = await Promise.all([
			fetchJsonWithTimeout<ForecastResponse>(
				forecastUrl,
				{ headers: { Accept: "application/json" } },
				10000,
			),
			fetchJsonWithTimeout<AirQualityResponse>(
				airUrl,
				{ headers: { Accept: "application/json" } },
				10000,
			).catch(
				(): AirQualityResponse => ({
					current: undefined,
				}),
			),
		]);

		const timeZone = forecast.timezone || location.timezone || "Europe/Berlin";
		const currentTime = forecast.current?.time || new Date().toISOString();
		const hourlyTimes = forecast.hourly?.time || [];
		const currentIndex = hourlyTimes.findIndex(
			(time) => new Date(time).getTime() >= new Date(currentTime).getTime(),
		);
		const startIndex = currentIndex >= 0 ? currentIndex : 0;
		const visibleHours = hourlyTimes.slice(startIndex, startIndex + 5);
		const currentTempValue = Number(forecast.current?.temperature_2m || 0);
		const currentFeelsValue = Number(
			forecast.current?.apparent_temperature || 0,
		);
		const currentCondition = weatherLabel(forecast.current?.weather_code);
		const currentWindDirection = windDirectionLabel(
			forecast.current?.wind_direction_10m,
		);
		const airCurrent = airQuality.current;

		const hourly = visibleHours.map((time, index) => ({
			label: formatHourLabel(time, timeZone),
			temp: Math.round(
				Number(forecast.hourly?.temperature_2m?.[startIndex + index] || 0),
			),
			feels: Math.round(
				Number(
					forecast.hourly?.apparent_temperature?.[startIndex + index] || 0,
				),
			),
			precipitationProbability: Math.max(
				0,
				Math.min(
					100,
					Math.round(
						Number(
							forecast.hourly?.precipitation_probability?.[
								startIndex + index
							] || 0,
						),
					),
				),
			),
		}));

		const days = (forecast.daily?.time || [])
			.slice(0, 5)
			.map((date, index) => ({
				label: formatDayLabel(date, index, timeZone),
				icon: weatherIcon(
					Number(forecast.daily?.weather_code?.[index] || 0),
					true,
				),
				high: Math.round(
					Number(forecast.daily?.temperature_2m_max?.[index] || 0),
				),
				low: Math.round(
					Number(forecast.daily?.temperature_2m_min?.[index] || 0),
				),
				windSpeed: Math.round(
					Number(forecast.daily?.wind_speed_10m_max?.[index] || 0),
				),
				windArrow: windArrow(
					Number(forecast.daily?.wind_direction_10m_dominant?.[index] || 0),
				),
			}));

		const aqiValue = Math.round(Number(airCurrent?.european_aqi || 0));
		const hasAqi = Number.isFinite(Number(airCurrent?.european_aqi));
		const aqi = aqiCategory(aqiValue);
		const unitLabel = units === "imperial" ? "mph" : "km/h";
		const pm25Value = Number(airCurrent?.pm2_5);
		const pm25Suffix = Number.isFinite(pm25Value)
			? ` ${Math.round(pm25Value)} µg/m³`
			: "";

		return {
			location: location.name.toUpperCase(),
			time: formatClock(currentTime, timeZone),
			updatedAt: formatClock(new Date(), timeZone),
			batteryLabel,
			temperatureUnit: units === "imperial" ? "F" : "C",
			windUnit: unitLabel,
			currentTemp: `${currentTempValue.toFixed(1)}°`,
			feelsLike: `${currentFeelsValue.toFixed(1)}°`,
			condition: currentCondition,
			description: buildDescription(
				currentTempValue,
				Math.round(Number(forecast.current?.wind_speed_10m || 0)),
				currentWindDirection,
				currentCondition,
			),
			windSpeed: `${Math.round(Number(forecast.current?.wind_speed_10m || 0))} ${unitLabel}`,
			windDirection: currentWindDirection,
			humidity: `${Math.round(Number(forecast.current?.relative_humidity_2m || 0))} %`,
			pressure: `${Math.round(Number(forecast.current?.surface_pressure || 0))} hPa`,
			currentIcon: weatherIcon(
				forecast.current?.weather_code,
				Number(forecast.current?.is_day || 1) === 1,
			),
			hourly: hourly.length > 0 ? hourly : buildFallback().hourly,
			days: days.length > 0 ? days : buildFallback().days,
			aqi: hasAqi ? String(aqiValue) : "--",
			aqiStatus: aqi.status,
			aqiScale: "AQI (DE)",
			aqiSummary: aqi.summary,
			aqiRecommendation: aqi.recommendation,
			aqiPrimary: `Hauptbelastung: Feinstaub (PM2.5)${pm25Suffix}`.trim(),
			aqiAvailable: hasAqi,
		};
	} catch (error) {
		console.error("Error loading CR Weather data:", error);
		return { ...buildFallback(), batteryLabel };
	}
}

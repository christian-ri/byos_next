import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type PollenAirQualityParams = {
	location?: string;
	latitude?: string | number;
	longitude?: string | number;
	showUsAqi?: boolean;
	showPm25?: boolean;
	showPm10?: boolean;
	showNo2?: boolean;
	showO3?: boolean;
	showCo?: boolean;
	showSo2?: boolean;
	showUvIndex?: boolean;
	showPollen?: string | boolean;
};

type GeocodingResponse = {
	results?: Array<{
		name: string;
		admin1?: string;
		country?: string;
		timezone?: string;
		latitude: number;
		longitude: number;
	}>;
};

type OpenMeteoWeatherResponse = {
	timezone?: string;
	current?: {
		time?: string;
		temperature_2m?: number;
		apparent_temperature?: number;
		relative_humidity_2m?: number;
		wind_speed_10m?: number;
		wind_direction_10m?: number;
		surface_pressure?: number;
		weather_code?: number;
	};
	hourly?: {
		time?: string[];
		temperature_2m?: number[];
		weather_code?: number[];
	};
	daily?: {
		sunrise?: string[];
		sunset?: string[];
	};
};

type AirQualityResponse = {
	timezone?: string;
	current?: Record<string, number | string | null | undefined>;
	hourly?: Record<
		string,
		Array<number | string | null | undefined> | undefined
	>;
};

type MetricCard = {
	key: string;
	label: string;
	value: string;
	unit?: string;
};

type TrendPoint = {
	label: string;
	value: number;
};

type ForecastPoint = {
	label: string;
	temperature: string;
	icon: "sun" | "cloud" | "rain" | "storm" | "fog" | "snow";
};

type PollenItem = {
	key: string;
	label: string;
	level: string;
	score: number;
	ratio: number;
};

export type PollenAirQualityData = {
	title: string;
	locationLabel: string;
	dateLabel: string;
	timeLabel: string;
	updatedAt: string;
	timeZone: string;
	showPollen: boolean;
	pollenAvailable: boolean;
	currentIcon: "sun" | "cloud" | "rain" | "storm" | "fog" | "snow";
	currentTemp: string;
	feelsLike: string;
	humidity: string;
	windSpeed: string;
	windDirection: string;
	pressure: string;
	weatherLabel: string;
	aqiVisible: boolean;
	aqiValue: number | null;
	aqiLabel: string;
	aqiBandDetail: string;
	metrics: MetricCard[];
	trendLabel: string;
	trendUnit?: string;
	trendPoints: TrendPoint[];
	pollenSummary: string;
	pollenItems: PollenItem[];
	forecast: ForecastPoint[];
	sunrise: string;
	sunset: string;
	recommendations: string[];
	note?: string;
};

const DEFAULT_LOCATION = "State College, PA";
const DEFAULT_LATITUDE = 40.7934;
const DEFAULT_LONGITUDE = -77.86;

function parseBoolean(value: unknown, fallback = true) {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["true", "1", "yes", "on"].includes(normalized)) return true;
		if (["false", "0", "no", "off"].includes(normalized)) return false;
	}
	return fallback;
}

function roundMetric(value: number | null | undefined, digits = 0) {
	if (!Number.isFinite(value)) return "--";
	return Number(value).toFixed(digits);
}

function formatClock(value: string | Date, timeZone?: string) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(value));
}

function formatDateLabel(value: string | Date, timeZone?: string) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value));
}

function weatherDescription(code?: number) {
	const weatherCodes: Record<number, string> = {
		0: "Sunny",
		1: "Mostly Clear",
		2: "Partly Cloudy",
		3: "Overcast",
		45: "Fog",
		48: "Fog",
		51: "Light Drizzle",
		53: "Drizzle",
		55: "Dense Drizzle",
		61: "Rain",
		63: "Rain",
		65: "Heavy Rain",
		71: "Snow",
		73: "Snow",
		75: "Heavy Snow",
		80: "Rain Showers",
		81: "Rain Showers",
		82: "Heavy Showers",
		95: "Storm",
		96: "Storm",
		99: "Storm",
	};
	return weatherCodes[code || 0] || "Weather";
}

function weatherIcon(code?: number): ForecastPoint["icon"] {
	if ([45, 48].includes(code || -1)) return "fog";
	if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code || -1)) return "rain";
	if ([71, 73, 75].includes(code || -1)) return "snow";
	if ([95, 96, 99].includes(code || -1)) return "storm";
	if ([1, 2, 3].includes(code || -1)) return "cloud";
	return "sun";
}

function cardinalDirection(degrees?: number) {
	if (!Number.isFinite(degrees)) return "--";
	const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
	return directions[Math.round((Number(degrees) % 360) / 45) % 8];
}

function aqiCategory(value: number | null) {
	if (!Number.isFinite(value)) {
		return {
			label: "No data",
			detail: "Current AQI is not available right now.",
		};
	}

	if ((value || 0) <= 50) {
		return {
			label: "Good",
			detail: "Air quality is satisfactory and poses little or no risk.",
		};
	}
	if ((value || 0) <= 100) {
		return {
			label: "Moderate",
			detail: "Acceptable overall, but sensitive groups may notice symptoms.",
		};
	}
	if ((value || 0) <= 150) {
		return {
			label: "Elevated",
			detail: "Sensitive groups should reduce prolonged outdoor exposure.",
		};
	}
	if ((value || 0) <= 200) {
		return {
			label: "Unhealthy",
			detail: "Everyone should limit longer or intense outdoor activity.",
		};
	}
	return {
		label: "Very Poor",
		detail: "Air quality is poor enough to warrant indoor caution.",
	};
}

async function resolveLocation(params?: PollenAirQualityParams) {
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

	const query = String(params?.location || DEFAULT_LOCATION).trim();
	const geo = await fetchJsonWithTimeout<GeocodingResponse>(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
		{ headers: { Accept: "application/json" } },
		8000,
	).catch(() => null);

	const first = geo?.results?.[0];
	if (!first) {
		return {
			latitude: DEFAULT_LATITUDE,
			longitude: DEFAULT_LONGITUDE,
			name: DEFAULT_LOCATION,
			timezone: "America/New_York",
		};
	}

	return {
		latitude: first.latitude,
		longitude: first.longitude,
		name: [first.name, first.admin1, first.country].filter(Boolean).join(", "),
		timezone: first.timezone || "auto",
	};
}

function buildMetricCards(
	current: AirQualityResponse["current"],
	params?: PollenAirQualityParams,
) {
	const config = [
		{
			enabled: parseBoolean(params?.showPm25, true),
			key: "pm25",
			label: "PM2.5",
			value: roundMetric(Number(current?.pm2_5), 1),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showPm10, true),
			key: "pm10",
			label: "PM10",
			value: roundMetric(Number(current?.pm10), 1),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showO3, true),
			key: "o3",
			label: "O3",
			value: roundMetric(Number(current?.ozone), 1),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showNo2, true),
			key: "no2",
			label: "NO2",
			value: roundMetric(Number(current?.nitrogen_dioxide), 1),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showSo2, false),
			key: "so2",
			label: "SO2",
			value: roundMetric(Number(current?.sulphur_dioxide), 1),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showCo, false),
			key: "co",
			label: "CO",
			value: roundMetric(Number(current?.carbon_monoxide), 0),
			unit: "ug/m3",
		},
		{
			enabled: parseBoolean(params?.showUvIndex, true),
			key: "uv_index",
			label: "UV",
			value: roundMetric(Number(current?.uv_index), 1),
		},
	].filter((card) => card.enabled);

	return config.slice(0, 6);
}

function buildPollenItems(current: AirQualityResponse["current"]) {
	const pollenFields = [
		{ key: "grass", label: "Grass", source: "grass_pollen" },
		{ key: "tree", label: "Tree", source: "birch_pollen" },
		{ key: "weed", label: "Weed", source: "ragweed_pollen" },
		{ key: "mold", label: "Mold", source: "alder_pollen" },
	];

	const items = pollenFields
		.map((field) => {
			const value = Number(current?.[field.source]);
			if (!Number.isFinite(value)) return null;
			const rounded = Math.max(0, Math.round(value * 10) / 10);
			const ratio = Math.min(1, rounded / 12);
			const level =
				rounded < 2.5
					? "Low"
					: rounded < 6
						? "Moderate"
						: rounded < 9
							? "High"
							: "Very High";
			return {
				key: field.key,
				label: field.label,
				level,
				score: rounded,
				ratio,
			};
		})
		.filter((item): item is PollenItem => item !== null);

	if (items.length === 0) {
		return {
			available: false,
			items: [] as PollenItem[],
			summary:
				"Pollen forecast unavailable for this region in the Open-Meteo model.",
		};
	}

	const top = [...items].sort((a, b) => b.score - a.score)[0];
	return {
		available: true,
		items,
		summary: `${top.level} pollen pressure • ${top.score.toFixed(1)}/12`,
	};
}

function buildForecast(
	hourly: OpenMeteoWeatherResponse["hourly"],
	timeZone: string,
) {
	const times = hourly?.time || [];
	const temps = hourly?.temperature_2m || [];
	const codes = hourly?.weather_code || [];

	return times.slice(0, 5).map((time, index) => ({
		label: index === 0 ? "Now" : formatClock(time, timeZone),
		temperature: `${Math.round(Number(temps[index] || 0))}°`,
		icon: weatherIcon(Number(codes[index] || 0)),
	}));
}

function buildRecommendations({
	aqiValue,
	pollenItems,
	pollenVisible,
	weatherCode,
}: {
	aqiValue: number | null;
	pollenItems: PollenItem[];
	pollenVisible: boolean;
	weatherCode?: number;
}) {
	const recommendations: string[] = [];

	if (!Number.isFinite(aqiValue) || (aqiValue || 0) <= 50) {
		recommendations.push("Good for outdoor activity.");
	} else if ((aqiValue || 0) <= 100) {
		recommendations.push("Outdoor time is generally fine for most people.");
	} else {
		recommendations.push("Limit intense outdoor exposure today.");
	}

	if (pollenVisible && pollenItems.some((item) => item.score >= 6)) {
		recommendations.push("Pollen load is elevated.");
		recommendations.push("Keep windows closed if you are sensitive.");
	} else if (pollenVisible && pollenItems.length > 0) {
		recommendations.push("Pollen conditions are manageable for most people.");
	}

	if ([0, 1, 2].includes(weatherCode || -1)) {
		recommendations.push("Great for outdoor plans.");
	} else if ([61, 63, 65, 80, 81, 82].includes(weatherCode || -1)) {
		recommendations.push("Take rain gear if you head outside.");
	} else if ([45, 48].includes(weatherCode || -1)) {
		recommendations.push("Visibility is reduced; plan for slower travel.");
	}

	return recommendations.slice(0, 4);
}

function buildFallback(showPollen: boolean): PollenAirQualityData {
	return {
		title: "MeteoWeather",
		locationLabel: DEFAULT_LOCATION,
		dateLabel: formatDateLabel(new Date(), "America/New_York"),
		timeLabel: formatClock(new Date(), "America/New_York"),
		updatedAt: formatUpdatedAt(new Date()),
		timeZone: "America/New_York",
		showPollen,
		pollenAvailable: showPollen,
		currentIcon: "sun",
		currentTemp: "18°",
		feelsLike: "18°",
		humidity: "52%",
		windSpeed: "14 km/h",
		windDirection: "WNW",
		pressure: "1018 hPa",
		weatherLabel: "Sunny",
		aqiVisible: true,
		aqiValue: 42,
		aqiLabel: "Good",
		aqiBandDetail: "Air quality is satisfactory and poses little or no risk.",
		metrics: [
			{ key: "pm25", label: "PM2.5", value: "12", unit: "ug/m3" },
			{ key: "pm10", label: "PM10", value: "24", unit: "ug/m3" },
			{ key: "o3", label: "O3", value: "48", unit: "ug/m3" },
			{ key: "no2", label: "NO2", value: "11", unit: "ug/m3" },
		],
		trendLabel: "AQI",
		trendUnit: "",
		trendPoints: [
			{ label: "-24h", value: 60 },
			{ label: "-18h", value: 46 },
			{ label: "-12h", value: 30 },
			{ label: "-6h", value: 12 },
			{ label: "Now", value: 24 },
		],
		pollenSummary: "Moderate pollen pressure • 5.8/12",
		pollenItems: showPollen
			? [
					{
						key: "tree",
						label: "Tree",
						level: "Moderate",
						score: 5.8,
						ratio: 0.48,
					},
					{
						key: "grass",
						label: "Grass",
						level: "Low",
						score: 2.1,
						ratio: 0.18,
					},
					{
						key: "weed",
						label: "Weed",
						level: "Moderate",
						score: 4.7,
						ratio: 0.39,
					},
					{ key: "mold", label: "Mold", level: "Low", score: 2.0, ratio: 0.17 },
				]
			: [],
		forecast: [
			{ label: "Now", temperature: "18°", icon: "sun" },
			{ label: "12:00", temperature: "22°", icon: "sun" },
			{ label: "15:00", temperature: "24°", icon: "cloud" },
			{ label: "18:00", temperature: "23°", icon: "cloud" },
			{ label: "21:00", temperature: "17°", icon: "fog" },
		],
		sunrise: "05:14",
		sunset: "21:03",
		recommendations: showPollen
			? [
					"Great for outdoor activities.",
					"Air quality is good.",
					"Keep windows closed if you are sensitive to pollen.",
				]
			: [
					"Great for outdoor activities.",
					"Air quality is good.",
					"Good day to open windows.",
				],
		note: "Open-Meteo live data unavailable. Showing fallback preview.",
	};
}

export default async function getData(
	params?: PollenAirQualityParams,
): Promise<PollenAirQualityData> {
	const showPollen = parseBoolean(params?.showPollen, true);

	try {
		const location = await resolveLocation(params);
		const aqiEnabled = parseBoolean(params?.showUsAqi, true);
		const weatherPromise = fetchJsonWithTimeout<OpenMeteoWeatherResponse>(
			`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&forecast_hours=12&timezone=${encodeURIComponent(location.timezone || "auto")}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);
		const airPromise = fetchJsonWithTimeout<AirQualityResponse>(
			`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index&timezone=${encodeURIComponent(location.timezone || "auto")}&forecast_hours=24`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const [weather, forecast] = await Promise.all([weatherPromise, airPromise]);
		const weatherCurrent = weather.current || {};
		const current = forecast.current || {};
		const metrics = buildMetricCards(current, params);
		const trendTimes = (forecast.hourly?.time || []) as Array<
			string | undefined
		>;
		const trendValues = (forecast.hourly?.us_aqi || []) as Array<
			number | string | null | undefined
		>;
		const trendIndices = [0, 6, 12, 18, 23].filter(
			(index) => index < trendTimes.length && index < trendValues.length,
		);
		const trendPoints = trendIndices.map((index, pointIndex) => ({
			label:
				pointIndex === trendIndices.length - 1
					? "Now"
					: `-${Math.max(0, 24 - pointIndex * 6)}h`,
			value: Number(trendValues[index] || 0),
		}));

		const pollen = showPollen
			? buildPollenItems(current)
			: {
					available: false,
					items: [] as PollenItem[],
					summary: "Pollen section hidden in recipe settings.",
				};
		const aqiValue = Number.isFinite(Number(current.us_aqi))
			? Number(current.us_aqi)
			: null;
		const category = aqiCategory(aqiValue);
		const recommendations = buildRecommendations({
			aqiValue,
			pollenItems: pollen.items,
			pollenVisible: showPollen && pollen.available,
			weatherCode: Number(weatherCurrent.weather_code || 0),
		});
		const timeZone = String(
			weather.timezone ||
				forecast.timezone ||
				location.timezone ||
				"America/New_York",
		);

		return {
			title: "MeteoWeather",
			locationLabel: location.name,
			dateLabel: formatDateLabel(new Date(), timeZone),
			timeLabel: formatClock(new Date(), timeZone),
			updatedAt: formatUpdatedAt(new Date(), timeZone),
			timeZone,
			showPollen,
			pollenAvailable: pollen.available,
			currentIcon: weatherIcon(Number(weatherCurrent.weather_code || 0)),
			currentTemp: `${roundMetric(Number(weatherCurrent.temperature_2m), 0)}°`,
			feelsLike: `${roundMetric(Number(weatherCurrent.apparent_temperature), 0)}°`,
			humidity: `${roundMetric(Number(weatherCurrent.relative_humidity_2m), 0)}%`,
			windSpeed: `${roundMetric(Number(weatherCurrent.wind_speed_10m), 0)} km/h`,
			windDirection: cardinalDirection(
				Number(weatherCurrent.wind_direction_10m),
			),
			pressure: `${roundMetric(Number(weatherCurrent.surface_pressure), 0)} hPa`,
			weatherLabel: weatherDescription(
				Number(weatherCurrent.weather_code || 0),
			),
			aqiVisible: aqiEnabled,
			aqiValue,
			aqiLabel: category.label,
			aqiBandDetail: category.detail,
			metrics,
			trendLabel: "AQI",
			trendUnit: "",
			trendPoints,
			pollenSummary: pollen.summary,
			pollenItems: pollen.items,
			forecast: buildForecast(weather.hourly, timeZone),
			sunrise: weather.daily?.sunrise?.[0]
				? formatClock(weather.daily.sunrise[0], timeZone)
				: "--:--",
			sunset: weather.daily?.sunset?.[0]
				? formatClock(weather.daily.sunset[0], timeZone)
				: "--:--",
			recommendations,
			note:
				showPollen && !pollen.available
					? "Pollen data is unavailable for this region right now."
					: "Data from Open-Meteo.",
		};
	} catch (error) {
		console.error("Error loading MeteoWeather data:", error);
		return buildFallback(showPollen);
	}
}

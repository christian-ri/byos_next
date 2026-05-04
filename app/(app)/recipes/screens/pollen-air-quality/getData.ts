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
	showPollen?: boolean;
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
	status?: string;
};

type TrendPoint = {
	label: string;
	value: number;
};

export type PollenAirQualityData = {
	title: string;
	locationLabel: string;
	updatedAt: string;
	timeZone: string;
	aqiVisible: boolean;
	aqiValue: number | null;
	aqiLabel: string;
	aqiBand: string;
	aqiBandDetail: string;
	metrics: MetricCard[];
	trendLabel: string;
	trendUnit?: string;
	trendPoints: TrendPoint[];
	pollenSummary: string;
	pollenAvailable: boolean;
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

function aqiCategory(value: number | null) {
	if (!Number.isFinite(value)) {
		return {
			label: "No data",
			band: "Awaiting sample",
			detail: "Open-Meteo did not return a current US AQI value.",
		};
	}

	if ((value || 0) <= 50) {
		return {
			label: "Good",
			band: "0-50",
			detail: "Air quality is satisfactory for most people.",
		};
	}
	if ((value || 0) <= 100) {
		return {
			label: "Moderate",
			band: "51-100",
			detail: "Acceptable, but sensitive groups may notice symptoms.",
		};
	}
	if ((value || 0) <= 150) {
		return {
			label: "Unhealthy for sensitive groups",
			band: "101-150",
			detail: "Sensitive groups should consider reducing longer exposure.",
		};
	}
	if ((value || 0) <= 200) {
		return {
			label: "Unhealthy",
			band: "151-200",
			detail: "Everyone may begin to experience adverse effects.",
		};
	}
	if ((value || 0) <= 300) {
		return {
			label: "Very unhealthy",
			band: "201-300",
			detail: "Health alert conditions.",
		};
	}
	return {
		label: "Hazardous",
		band: "301+",
		detail: "Emergency conditions for air quality.",
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
			enabled: parseBoolean(params?.showNo2, true),
			key: "no2",
			label: "NO2",
			value: roundMetric(Number(current?.nitrogen_dioxide), 1),
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
			enabled: parseBoolean(params?.showCo, false),
			key: "co",
			label: "CO",
			value: roundMetric(Number(current?.carbon_monoxide), 0),
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
			enabled: parseBoolean(params?.showUvIndex, true),
			key: "uv_index",
			label: "UV Index",
			value: roundMetric(Number(current?.uv_index), 1),
		},
	].filter((card) => card.enabled);

	return config;
}

function pickTrendKey(
	params: PollenAirQualityParams | undefined,
	aqiEnabled: boolean,
	metricCards: MetricCard[],
) {
	if (aqiEnabled) {
		return { key: "us_aqi", label: "US AQI", unit: "" };
	}

	const preferred = metricCards[0];
	switch (preferred?.key) {
		case "pm25":
			return { key: "pm2_5", label: "PM2.5", unit: "ug/m3" };
		case "pm10":
			return { key: "pm10", label: "PM10", unit: "ug/m3" };
		case "no2":
			return { key: "nitrogen_dioxide", label: "NO2", unit: "ug/m3" };
		case "o3":
			return { key: "ozone", label: "O3", unit: "ug/m3" };
		case "co":
			return { key: "carbon_monoxide", label: "CO", unit: "ug/m3" };
		case "so2":
			return { key: "sulphur_dioxide", label: "SO2", unit: "ug/m3" };
		case "uv_index":
			return { key: "uv_index", label: "UV Index", unit: "" };
		default:
			return parseBoolean(params?.showUsAqi, true)
				? { key: "us_aqi", label: "US AQI", unit: "" }
				: { key: "pm2_5", label: "PM2.5", unit: "ug/m3" };
	}
}

function buildPollenSummary(current: AirQualityResponse["current"]) {
	const pollenFields = [
		{ label: "Alder", key: "alder_pollen" },
		{ label: "Birch", key: "birch_pollen" },
		{ label: "Grass", key: "grass_pollen" },
		{ label: "Mugwort", key: "mugwort_pollen" },
		{ label: "Olive", key: "olive_pollen" },
		{ label: "Ragweed", key: "ragweed_pollen" },
	];

	const available = pollenFields
		.map((field) => ({
			label: field.label,
			value: Number(current?.[field.key]),
		}))
		.filter((field) => Number.isFinite(field.value));

	if (available.length === 0) {
		return {
			available: false,
			summary:
				"Pollen forecast unavailable for this region in the Open-Meteo air quality model.",
		};
	}

	const top = available
		.sort((a, b) => (b.value || 0) - (a.value || 0))
		.slice(0, 3);
	return {
		available: true,
		summary: top
			.map((field) => `${field.label} ${Math.round(field.value || 0)}`)
			.join("  •  "),
	};
}

export default async function getData(
	params?: PollenAirQualityParams,
): Promise<PollenAirQualityData> {
	try {
		const location = await resolveLocation(params);
		const aqiEnabled = parseBoolean(params?.showUsAqi, true);
		const forecast = await fetchJsonWithTimeout<AirQualityResponse>(
			`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=${encodeURIComponent(location.timezone || "auto")}&forecast_hours=12`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		const current = forecast.current || {};
		const metrics = buildMetricCards(current, params);
		const trend = pickTrendKey(params, aqiEnabled, metrics);
		const trendTimes = (forecast.hourly?.time || []) as Array<
			string | undefined
		>;
		const trendValues = (forecast.hourly?.[trend.key] || []) as Array<
			number | string | null | undefined
		>;
		const trendPoints = trendTimes.slice(0, 8).map((time, index) => ({
			label:
				index === 0
					? "Now"
					: new Date(String(time)).toLocaleTimeString("en-US", {
							hour: "numeric",
						}),
			value: Number(trendValues[index] || 0),
		}));

		const pollen = parseBoolean(params?.showPollen, true)
			? buildPollenSummary(current)
			: {
					available: false,
					summary: "Pollen section hidden in recipe settings.",
				};
		const aqiValue = Number.isFinite(Number(current.us_aqi))
			? Number(current.us_aqi)
			: null;
		const category = aqiCategory(aqiValue);

		return {
			title: "Pollen & Air Quality",
			locationLabel: location.name,
			updatedAt: formatUpdatedAt(new Date()),
			timeZone: String(
				forecast.timezone || location.timezone || "America/New_York",
			),
			aqiVisible: aqiEnabled,
			aqiValue,
			aqiLabel: category.label,
			aqiBand: category.band,
			aqiBandDetail: category.detail,
			metrics,
			trendLabel: trend.label,
			trendUnit: trend.unit,
			trendPoints,
			pollenSummary: pollen.summary,
			pollenAvailable: pollen.available,
			note:
				!pollen.available && parseBoolean(params?.showPollen, true)
					? "Open-Meteo currently exposes pollen fields only for supported regions, not State College."
					: undefined,
		};
	} catch (error) {
		console.error("Error loading pollen and air quality data:", error);
		return {
			title: "Pollen & Air Quality",
			locationLabel: DEFAULT_LOCATION,
			updatedAt: formatUpdatedAt(new Date()),
			timeZone: "America/New_York",
			aqiVisible: true,
			aqiValue: null,
			aqiLabel: "Unavailable",
			aqiBand: "--",
			aqiBandDetail: "The Open-Meteo request failed.",
			metrics: [],
			trendLabel: "US AQI",
			trendUnit: "",
			trendPoints: [],
			pollenSummary:
				"Air quality request failed. Check the recipe settings and try again.",
			pollenAvailable: false,
			note: "Open-Meteo request failed for this refresh.",
		};
	}
}

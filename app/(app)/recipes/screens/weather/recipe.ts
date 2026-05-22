import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "weather";
export const title = "Weather Forecast";
export const renderer = "chromium";

export { getData };

type WeatherData = {
	temperature?: string;
	feelsLike?: string;
	humidity?: string;
	windSpeed?: string;
	description?: string;
	location?: string;
	lastUpdated?: string;
	highTemp?: string;
	lowTemp?: string;
	pressure?: string;
	sunset?: string;
	sunrise?: string;
};

function iconToken(description: string) {
	const lower = description.toLowerCase();
	if (lower.includes("rain") || lower.includes("drizzle")) return "RAIN";
	if (lower.includes("snow")) return "SNOW";
	if (lower.includes("clear") || lower.includes("sun")) return "SUN";
	if (lower.includes("fog") || lower.includes("mist")) return "FOG";
	if (lower.includes("thunder")) return "STM";
	if (lower.includes("cloud")) return "CLD";
	return "WX";
}

export function renderHtml(data: WeatherData) {
	const stats = [
		{ label: "Feels like", value: `${data.feelsLike || "N/A"}°C` },
		{ label: "Humidity", value: `${data.humidity || "N/A"}%` },
		{ label: "Wind", value: `${data.windSpeed || "N/A"} km/h` },
		{ label: "Pressure", value: `${data.pressure || "N/A"} hPa` },
		{ label: "Sunrise", value: data.sunrise || "N/A" },
		{ label: "Sunset", value: data.sunset || "N/A" },
	];

	const bodyHtml = `
		<section class="screen weather-simple-screen">
			<div class="weather-simple-shell">
				<header class="weather-simple-header">
					<div>
						<div class="meta">Weather forecast</div>
						<h1 class="title">${escapeHtml(data.location || "Unknown location")}</h1>
					</div>
					<div class="footer">${escapeHtml(data.lastUpdated || "N/A")}</div>
				</header>
				<div class="weather-simple-main">
					<section class="weather-simple-hero">
						<div class="weather-simple-token">${escapeHtml(iconToken(data.description || ""))}</div>
						<div class="weather-simple-temp">${escapeHtml(data.temperature || "N/A")}°C</div>
						<div class="description">${escapeHtml(data.description || "Unknown")}</div>
						<div class="weather-simple-range">H ${escapeHtml(data.highTemp || "N/A")}° / L ${escapeHtml(data.lowTemp || "N/A")}°</div>
					</section>
					<section class="weather-simple-stats">
						${stats
							.map(
								(stat) => `
									<div class="weather-simple-stat">
										<div class="meta">${escapeHtml(stat.label)}</div>
										<div class="value">${escapeHtml(stat.value)}</div>
									</div>
								`,
							)
							.join("")}
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.weather-simple-screen {
				padding: 24px;
				background: #f5f2ec;
			}

			.weather-simple-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #faf9f5 0%, #efebe3 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.weather-simple-header {
				display: flex;
				justify-content: space-between;
				align-items: end;
				gap: 16px;
			}

			.weather-simple-main {
				display: grid;
				grid-template-columns: 294px 1fr;
				gap: 14px;
			}

			.weather-simple-hero,
			.weather-simple-stat {
				border: 2px solid #111;
				background: #fff;
			}

			.weather-simple-hero {
				padding: 18px;
				display: grid;
				align-content: start;
				gap: 12px;
			}

			.weather-simple-token {
				width: 94px;
				height: 94px;
				border: 2px solid #111;
				border-radius: 47px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 18px;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.weather-simple-temp {
				font-size: 62px;
				line-height: 0.9;
				font-weight: 800;
				letter-spacing: -0.05em;
			}

			.weather-simple-range {
				font-size: 18px;
				line-height: 1.2;
				font-weight: 700;
			}

			.weather-simple-stats {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 10px;
			}

			.weather-simple-stat {
				padding: 14px;
				display: grid;
				gap: 8px;
				align-content: start;
			}

			.weather-simple-stat .value {
				font-size: 20px;
				line-height: 1.15;
			}
		`,
	});
}

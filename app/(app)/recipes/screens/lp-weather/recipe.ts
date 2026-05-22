import type { LpWeatherRecipeData } from "@/app/(app)/recipes/screens/lp-weather/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "lp-weather";
export const title = "LP Weather";
export const renderer = "chromium";

export { getData };

function iconToken(iconClass: string) {
	if (iconClass.includes("sunny") || iconClass.includes("clear")) return "SUN";
	if (iconClass.includes("cloud")) return "CLD";
	if (iconClass.includes("rain")) return "RAIN";
	if (iconClass.includes("snow")) return "SNOW";
	if (iconClass.includes("storm") || iconClass.includes("thunder"))
		return "STM";
	if (iconClass.includes("fog")) return "FOG";
	return "MIX";
}

function renderHourlyBars(data: LpWeatherRecipeData) {
	const points = data.hourly.slice(0, 8);
	if (points.length === 0) {
		return `<div class="weather-empty">No hourly forecast</div>`;
	}

	const maxTemp = Math.max(...points.map((point) => point.temperature), 1);
	const minTemp = Math.min(...points.map((point) => point.temperature), 0);
	const spread = Math.max(4, maxTemp - minTemp);

	return points
		.map((point) => {
			const height = 28 + ((point.temperature - minTemp) / spread) * 54;
			return `
				<div class="weather-hour">
					<div class="weather-hour__temp">${escapeHtml(point.temperature)}&deg;</div>
					<div class="weather-hour__bar-wrap">
						<div class="weather-hour__bar" style="height:${height.toFixed(1)}px"></div>
					</div>
					<div class="weather-hour__icon">${escapeHtml(iconToken(point.iconClass))}</div>
					<div class="weather-hour__time">${escapeHtml(point.label)}</div>
					<div class="weather-hour__precip">${escapeHtml(point.precipProbability)}%</div>
				</div>
			`;
		})
		.join("");
}

function renderDailyCards(data: LpWeatherRecipeData) {
	return data.days
		.slice(0, 6)
		.map(
			(day) => `
				<div class="weather-day">
					<div class="meta">${escapeHtml(day.label)}</div>
					<div class="weather-day__date">${escapeHtml(day.dateLabel)}</div>
					<div class="weather-day__icon">${escapeHtml(iconToken(day.iconClass))}</div>
					<div class="weather-day__condition">${escapeHtml(day.condition)}</div>
					<div class="weather-day__range">${escapeHtml(day.high)}&deg; / ${escapeHtml(day.low)}&deg;</div>
					<div class="weather-day__precip">${escapeHtml(day.precipProbability)}% precip</div>
				</div>
			`,
		)
		.join("");
}

export function renderHtml(data: LpWeatherRecipeData) {
	const bodyHtml = `
		<section class="screen weather-screen">
			<div class="weather-shell">
				<header class="weather-header">
					<div>
						<div class="meta">${escapeHtml(data.title)}</div>
						<h1 class="title">${escapeHtml(data.locationLabel)}</h1>
					</div>
					<div class="weather-header__aside">
						<div class="value">${escapeHtml(data.currentTemp)}&deg;${escapeHtml(data.temperatureUnit)}</div>
						<div class="footer">${escapeHtml(data.updatedAt)}</div>
					</div>
				</header>
				<div class="weather-top">
					<section class="item weather-current">
						<div class="weather-current__hero">
							<div class="weather-token">${escapeHtml(iconToken(data.iconClass))}</div>
							<div>
								<div class="title weather-current__temp">${escapeHtml(data.currentTemp)}&deg;</div>
								<div class="description">${escapeHtml(data.condition)}</div>
							</div>
						</div>
						<div class="weather-current__stats">
							<div><span class="meta">Feels like</span><span class="description">${escapeHtml(data.feelsLike)}&deg;${escapeHtml(data.temperatureUnit)}</span></div>
							<div><span class="meta">Wind</span><span class="description">${escapeHtml(data.windSpeed)} ${escapeHtml(data.windUnit)} ${escapeHtml(data.windDirection)}</span></div>
							<div><span class="meta">Humidity</span><span class="description">${escapeHtml(data.humidity)}%</span></div>
							<div><span class="meta">Sunrise / sunset</span><span class="description">${escapeHtml(data.sunrise)} / ${escapeHtml(data.sunset)}</span></div>
						</div>
						${data.note ? `<div class="weather-note">${escapeHtml(data.note)}</div>` : ""}
					</section>
					<section class="item weather-hourly">
						<div class="weather-section-head">
							<div class="title title--small">Hourly outlook</div>
							<div class="meta">Next ${escapeHtml(Math.min(data.hourly.length, 8))} points</div>
						</div>
						<div class="weather-hourly__grid">${renderHourlyBars(data)}</div>
					</section>
				</div>
				<section class="weather-days">
					<div class="weather-section-head">
						<div class="title title--small">6-day forecast</div>
						<div class="meta">${escapeHtml(data.temperatureUnit)} scale</div>
					</div>
					<div class="weather-days__grid">${renderDailyCards(data)}</div>
				</section>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.weather-screen {
				padding: 24px;
				background: #f5f2ec;
			}

			.weather-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fbfaf7 0%, #f1eee7 100%);
				display: grid;
				grid-template-rows: auto auto 1fr;
				gap: 14px;
			}

			.weather-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
			}

			.weather-header__aside {
				display: grid;
				justify-items: end;
				gap: 8px;
				text-align: right;
			}

			.weather-top {
				display: grid;
				grid-template-columns: 290px 1fr;
				gap: 14px;
			}

			.weather-current {
				background: #fff;
				gap: 18px;
			}

			.weather-current__hero {
				display: flex;
				align-items: center;
				gap: 16px;
			}

			.weather-token {
				width: 84px;
				height: 84px;
				border: 2px solid #111;
				border-radius: 42px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 17px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.weather-current__temp {
				font-size: 60px;
			}

			.weather-current__stats {
				display: grid;
				gap: 10px;
			}

			.weather-current__stats div {
				display: grid;
				gap: 3px;
				padding-top: 8px;
				border-top: 1px solid #b7b0a5;
			}

			.weather-note {
				font-size: 13px;
				line-height: 1.3;
				font-weight: 600;
			}

			.weather-hourly {
				background: #fff;
				gap: 10px;
			}

			.weather-section-head {
				display: flex;
				justify-content: space-between;
				align-items: end;
				gap: 12px;
			}

			.weather-hourly__grid {
				display: grid;
				grid-template-columns: repeat(8, 1fr);
				gap: 8px;
				align-items: end;
				min-height: 184px;
			}

			.weather-hour {
				display: grid;
				grid-template-rows: auto 1fr auto auto auto;
				gap: 6px;
				justify-items: center;
				padding: 8px 6px;
				border: 1px solid #111;
				background: linear-gradient(180deg, #fff 0%, #f6f4ef 100%);
			}

			.weather-hour__temp,
			.weather-hour__icon {
				font-size: 13px;
				line-height: 1.1;
				font-weight: 800;
				text-transform: uppercase;
			}

			.weather-hour__bar-wrap {
				height: 84px;
				width: 100%;
				display: flex;
				align-items: end;
				justify-content: center;
			}

			.weather-hour__bar {
				width: 22px;
				background: #111;
			}

			.weather-hour__time,
			.weather-hour__precip {
				font-size: 12px;
				line-height: 1.1;
				font-weight: 600;
			}

			.weather-days {
				display: grid;
				gap: 10px;
				min-height: 0;
			}

			.weather-days__grid {
				display: grid;
				grid-template-columns: repeat(6, 1fr);
				gap: 8px;
				min-height: 0;
			}

			.weather-day {
				border: 2px solid #111;
				background: #fff;
				padding: 10px 10px 12px;
				display: grid;
				gap: 6px;
				align-content: start;
			}

			.weather-day__date,
			.weather-day__icon,
			.weather-day__condition,
			.weather-day__range,
			.weather-day__precip {
				font-size: 13px;
				line-height: 1.2;
				font-weight: 600;
			}

			.weather-day__icon {
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}

			.weather-day__condition {
				min-height: 31px;
			}
		`,
	});
}

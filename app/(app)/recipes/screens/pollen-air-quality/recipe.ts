import type { PollenAirQualityData } from "@/app/(app)/recipes/screens/pollen-air-quality/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "pollen-air-quality";
export const title = "Pollen & Air Quality";
export const renderer = "chromium";

export { getData };

function weatherGlyph(type: PollenAirQualityData["currentIcon"]) {
	switch (type) {
		case "cloud":
			return "CLD";
		case "rain":
			return "RAIN";
		case "storm":
			return "STM";
		case "fog":
			return "FOG";
		case "snow":
			return "SNOW";
		default:
			return "SUN";
	}
}

function weatherIconSvg(type: PollenAirQualityData["currentIcon"], size = 40) {
	const common = `fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
	switch (type) {
		case "rain":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 43h23c7 0 12-4.7 12-11.1S49 20 42.5 20c-1.7-6.6-7.2-10-14-10-8 0-14 5.8-15.3 13.5C8.6 24.5 5 28.4 5 33c0 5.5 4.4 10 10 10h4" ${common}></path><path d="M23 47l-3 7M34 47l-3 7M45 47l-3 7" ${common}></path></svg>`;
		case "storm":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 41h24c6.7 0 11-4.4 11-10.2S49.6 21 43.5 21c-1.8-6.4-7.3-10-14.2-10-8 0-13.8 5.7-15.1 13.1C8.9 25 5 28.7 5 33.6 5 38.2 8.8 41 14 41h5" ${common}></path><path d="M31 44l-5 10h6l-4 8 12-14h-7l4-8z" fill="#111"></path></svg>`;
		case "snow":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 40h24c6.7 0 11-4.4 11-10.2S49.6 20 43.5 20c-1.8-6.4-7.3-10-14.2-10-8 0-13.8 5.7-15.1 13.1C8.9 24 5 27.7 5 32.6 5 37.2 8.8 40 14 40h5" ${common}></path><path d="M24 47h8M28 43v8M40 48h8M44 44v8" ${common}></path></svg>`;
		case "fog":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M16 24h30c6 0 10 4 10 9.2 0 4.8-4 8.8-9.5 8.8H16c-6 0-10-4-10-9.2C6 28 10 24 16 24Z" ${common}></path><path d="M10 47h38M16 53h30" ${common}></path></svg>`;
		case "cloud":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M18 43h27c8 0 13-5.1 13-12 0-6.4-4.9-11.4-11.7-11.4-1.9-7.1-7.8-11.6-15.5-11.6-8.7 0-15 5.9-16.4 13.8C8.7 23 5 27.3 5 32.5 5 38.3 9.7 43 16 43h2" ${common}></path></svg>`;
		default:
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="11" ${common}></circle><path d="M32 7v9M32 48v9M7 32h9M48 32h9M14.5 14.5l6.4 6.4M43.1 43.1l6.4 6.4M14.5 49.5l6.4-6.4M43.1 20.9l6.4-6.4" ${common}></path></svg>`;
	}
}

function renderMetric(metric: PollenAirQualityData["metrics"][number]) {
	return `<div class="paq-metric"><div class="meta">${escapeHtml(metric.label)}</div><div class="paq-metric__value">${escapeHtml(metric.value)}</div>${metric.unit ? `<div class="footer">${escapeHtml(metric.unit)}</div>` : ""}</div>`;
}

function renderForecast(
	point: PollenAirQualityData["forecast"][number],
	index: number,
	items: PollenAirQualityData["forecast"],
) {
	return `<div class="paq-forecast ${index < items.length - 1 ? "paq-forecast--divider" : ""}"><div class="meta">${escapeHtml(point.label)}</div><div class="paq-forecast__icon">${escapeHtml(weatherGlyph(point.icon))}</div><div class="description">${escapeHtml(point.temperature)}</div></div>`;
}

function renderPollenRow(item: PollenAirQualityData["pollenItems"][number]) {
	return `<div class="paq-pollen-row"><div class="description">${escapeHtml(item.label)}</div><div class="paq-pollen-row__bar"><div class="paq-pollen-row__fill" style="width:${Math.max(8, item.ratio * 100)}%"></div></div><div class="meta">${escapeHtml(item.level)}</div></div>`;
}

function renderPanel(title: string, content: string, className = "") {
	return `<section class="paq-panel ${className}"><div class="paq-panel__title">${escapeHtml(title)}</div>${content}</section>`;
}

export function renderHtml(data: PollenAirQualityData) {
	const showPollenPanel =
		data.showPollen && data.pollenAvailable && data.pollenItems.length > 0;
	const recommendationTitle = showPollenPanel
		? "RECOMMENDATION"
		: "WHAT YOU CAN DO TODAY";

	const bodyHtml = `
		<section class="screen paq-screen">
			<div class="paq-shell">
				<header class="paq-header">
					<div class="paq-location">${escapeHtml(data.locationLabel.toUpperCase())}</div>
					<div class="paq-header__right">
						<div class="description">${escapeHtml(data.dateLabel.toUpperCase())}</div>
						<div class="paq-divider"></div>
						<div class="paq-time">${escapeHtml(data.timeLabel)}</div>
					</div>
				</header>
				<div class="paq-top">
					${renderPanel(
						"CURRENT WEATHER",
						`<div class="paq-current"><div class="paq-current__icon">${weatherIconSvg(data.currentIcon, 54)}</div><div class="paq-current__copy"><div class="paq-current__temp">${escapeHtml(data.currentTemp)}</div><div class="description">${escapeHtml(data.weatherLabel)}</div><div class="meta">Feels like ${escapeHtml(data.feelsLike)}</div></div></div><div class="paq-separator"></div><div class="paq-weather-stats"><div class="paq-weather-stat"><div class="meta">Hum.</div><div class="description">${escapeHtml(data.humidity)}</div></div><div class="paq-weather-stat"><div class="meta">Wind</div><div class="description">${escapeHtml(data.windSpeed)}</div><div class="footer">${escapeHtml(data.windDirection)}</div></div><div class="paq-weather-stat"><div class="meta">Press.</div><div class="description">${escapeHtml(data.pressure)}</div></div></div>`,
						"paq-panel--weather",
					)}
					${renderPanel(
						"AIR QUALITY",
						`<div class="paq-air-row"><div class="paq-aqi"><div class="meta">AQI (US)</div><div class="paq-aqi__value">${data.aqiVisible && data.aqiValue !== null ? escapeHtml(String(Math.round(data.aqiValue))) : "--"}</div></div><div class="paq-trend"><div class="meta">TREND (24H)</div><div class="paq-trend__bars">${data.trendPoints
							.map(
								(point) =>
									`<div class="paq-trend__bar-wrap"><div class="paq-trend__bar" style="height:${Math.max(12, point.value)}px"></div><div class="footer">${escapeHtml(point.label)}</div></div>`,
							)
							.join(
								"",
							)}</div></div></div><div class="description">${escapeHtml(data.aqiLabel)}. ${escapeHtml(data.aqiBandDetail)}</div><div class="paq-metrics">${data.metrics
							.slice(0, 4)
							.map((metric) => renderMetric(metric))
							.join("")}</div>`,
						showPollenPanel
							? "paq-panel--air"
							: "paq-panel--air paq-panel--air-wide",
					)}
					${
						showPollenPanel
							? renderPanel(
									"POLLEN",
									`<div class="description"><strong>${escapeHtml(data.pollenSummary)}</strong></div><div class="paq-pollen-list">${data.pollenItems
										.slice(0, 4)
										.map((item) => renderPollenRow(item))
										.join("")}</div>`,
									"paq-panel--pollen",
								)
							: ""
					}
				</div>
				<div class="paq-bottom">
					${renderPanel(
						"TODAY'S FORECAST",
						`<div class="paq-forecast-strip">${data.forecast
							.slice(0, 5)
							.map((point, index, items) => renderForecast(point, index, items))
							.join("")}</div>`,
						"paq-panel--forecast",
					)}
					${renderPanel("SUN", `<div class="paq-sun-block"><div><div class="meta">SUNRISE</div><div class="description paq-sun-block__value">${escapeHtml(data.sunrise)}</div></div><div><div class="meta">SUNSET</div><div class="description paq-sun-block__value">${escapeHtml(data.sunset)}</div></div></div>`, "paq-panel--sun")}
					${renderPanel(
						recommendationTitle,
						`<div class="paq-recommendations">${data.recommendations
							.slice(0, 3)
							.map(
								(item) => `<div class="description">${escapeHtml(item)}</div>`,
							)
							.join(
								"",
							)}<div class="meta">${escapeHtml(data.note || "Data from Open-Meteo.")}</div></div>`,
						"paq-panel--recommendation",
					)}
				</div>
				<footer class="paq-footer"><div class="meta">${showPollenPanel ? "Weather • Air Quality • Pollen" : "Weather • Air Quality"}</div><div class="meta">${showPollenPanel ? `Last update: ${escapeHtml(data.updatedAt)}` : escapeHtml(data.note || "Data from Open-Meteo.")}</div></footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.paq-screen { padding: 8px; background: #f5f2ec; }
			.paq-shell { height: 100%; display: grid; grid-template-rows: 52px 248px 156px 32px; gap: 8px; }
			.paq-header, .paq-footer, .paq-panel { border: 2px solid #111; background: #fff; box-sizing: border-box; }
			.paq-header { padding: 0 16px; display: flex; align-items: center; justify-content: space-between; }
			.paq-location { font-size: 26px; line-height: 1; font-weight: 800; }
			.paq-header__right { display: flex; align-items: center; gap: 14px; }
			.paq-divider { width: 2px; height: 28px; background: #111; }
			.paq-time { font-size: 28px; line-height: 1; font-weight: 800; }
			.paq-top, .paq-bottom { display: flex; gap: 8px; }
			.paq-panel { padding: 10px 12px; display: flex; flex-direction: column; overflow: hidden; }
			.paq-panel__title { font-size: 16px; line-height: 1; font-weight: 800; margin-bottom: 8px; }
			.paq-panel--weather { width: 230px; }
			.paq-panel--air { width: 348px; }
			.paq-panel--air-wide { width: 546px; }
			.paq-panel--pollen { width: 190px; }
			.paq-panel--forecast { width: 326px; }
			.paq-panel--sun { width: 150px; }
			.paq-panel--recommendation { flex: 1; }
			.paq-current { display: flex; gap: 10px; align-items: center; }
			.paq-current__icon { width: 58px; display: flex; justify-content: center; flex-shrink: 0; }
			.paq-current__copy { width: 128px; display: grid; gap: 3px; }
			.paq-current__temp { font-size: 46px; line-height: 0.9; font-weight: 800; }
			.paq-separator { height: 10px; border-top: 2px solid #111; margin-top: 10px; }
			.paq-weather-stats { display: flex; justify-content: space-between; }
			.paq-weather-stat, .paq-metric { border: 2px solid #111; padding: 6px 4px; display: grid; justify-items: center; gap: 2px; box-sizing: border-box; overflow: hidden; }
			.paq-weather-stat { width: 50px; }
			.paq-air-row { display: flex; gap: 12px; }
			.paq-aqi { width: 72px; }
			.paq-aqi__value { font-size: 40px; line-height: 0.9; font-weight: 800; }
			.paq-trend { flex: 1; min-width: 0; }
			.paq-trend__bars { margin-top: 6px; height: 92px; display: flex; align-items: end; justify-content: space-between; gap: 6px; border-left: 2px solid #111; border-bottom: 2px solid #111; padding: 10px 8px 8px 10px; box-sizing: border-box; }
			.paq-trend__bar-wrap { display: grid; justify-items: center; align-items: end; gap: 4px; }
			.paq-trend__bar { width: 16px; background: #111; }
			.paq-metrics { margin-top: 10px; display: flex; gap: 6px; }
			.paq-metric { flex: 1; }
			.paq-metric__value { font-size: 14px; line-height: 1.05; font-weight: 800; text-align: center; }
			.paq-pollen-list { margin-top: 10px; display: grid; gap: 10px; }
			.paq-pollen-row { display: grid; grid-template-columns: 50px 1fr 56px; align-items: center; gap: 6px; }
			.paq-pollen-row__bar { height: 8px; border: 2px solid #111; position: relative; box-sizing: border-box; }
			.paq-pollen-row__fill { position: absolute; left: 0; top: 0; height: 100%; background: #111; }
			.paq-forecast-strip { display: flex; width: 100%; }
			.paq-forecast { width: 58px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-right: 6px; margin-right: 6px; box-sizing: border-box; }
			.paq-forecast--divider { border-right: 2px dotted #888; }
			.paq-forecast__icon { font-size: 18px; line-height: 1; font-weight: 800; }
			.paq-sun-block { display: grid; gap: 12px; }
			.paq-sun-block__value { font-size: 22px; line-height: 1; font-weight: 800; }
			.paq-recommendations { display: grid; gap: 6px; }
			.paq-panel .description { font-size: 14px; line-height: 1.18; }
			.paq-panel .meta { font-size: 11px; line-height: 1.05; }
			.paq-footer .meta { font-size: 11px; line-height: 1; }
			.paq-footer { padding: 0 14px; display: flex; align-items: center; justify-content: space-between; }
		`,
	});
}

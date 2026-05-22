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
						`<div class="paq-current"><div class="paq-current__icon">${escapeHtml(weatherGlyph(data.currentIcon))}</div><div class="paq-current__copy"><div class="paq-current__temp">${escapeHtml(data.currentTemp)}</div><div class="description">${escapeHtml(data.weatherLabel)}</div><div class="meta">Feels like ${escapeHtml(data.feelsLike)}</div></div></div><div class="paq-separator"></div><div class="paq-weather-stats"><div class="paq-weather-stat"><div class="meta">Humidity</div><div class="description">${escapeHtml(data.humidity)}</div></div><div class="paq-weather-stat"><div class="meta">Wind</div><div class="description">${escapeHtml(data.windSpeed)}</div><div class="footer">${escapeHtml(data.windDirection)}</div></div><div class="paq-weather-stat"><div class="meta">Pressure</div><div class="description">${escapeHtml(data.pressure)}</div></div></div>`,
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
			.paq-panel--weather { width: 260px; }
			.paq-panel--air { width: 304px; }
			.paq-panel--air-wide { width: 528px; }
			.paq-panel--pollen { width: 216px; }
			.paq-panel--forecast { width: 336px; }
			.paq-panel--sun { width: 160px; }
			.paq-panel--recommendation { flex: 1; }
			.paq-current { display: flex; gap: 10px; align-items: center; }
			.paq-current__icon { width: 92px; display: flex; justify-content: center; flex-shrink: 0; font-size: 28px; line-height: 1; font-weight: 800; }
			.paq-current__copy { width: 132px; display: grid; gap: 4px; }
			.paq-current__temp { font-size: 58px; line-height: 0.9; font-weight: 800; }
			.paq-separator { height: 10px; border-top: 2px solid #111; margin-top: 10px; }
			.paq-weather-stats { display: flex; justify-content: space-between; }
			.paq-weather-stat, .paq-metric { border: 2px solid #111; padding: 6px 4px; display: grid; justify-items: center; gap: 2px; box-sizing: border-box; }
			.paq-weather-stat { width: 68px; }
			.paq-air-row { display: flex; gap: 12px; }
			.paq-aqi { width: 72px; }
			.paq-aqi__value { font-size: 52px; line-height: 0.9; font-weight: 800; }
			.paq-trend { flex: 1; min-width: 0; }
			.paq-trend__bars { margin-top: 6px; height: 92px; display: flex; align-items: end; justify-content: space-between; gap: 6px; border-left: 2px solid #111; border-bottom: 2px solid #111; padding: 10px 8px 8px 10px; box-sizing: border-box; }
			.paq-trend__bar-wrap { display: grid; justify-items: center; align-items: end; gap: 4px; }
			.paq-trend__bar { width: 16px; background: #111; }
			.paq-metrics { margin-top: 10px; display: flex; gap: 6px; }
			.paq-metric { flex: 1; }
			.paq-metric__value { font-size: 18px; line-height: 1; font-weight: 800; }
			.paq-pollen-list { margin-top: 10px; display: grid; gap: 10px; }
			.paq-pollen-row { display: grid; grid-template-columns: 56px 1fr 70px; align-items: center; gap: 8px; }
			.paq-pollen-row__bar { height: 8px; border: 2px solid #111; position: relative; box-sizing: border-box; }
			.paq-pollen-row__fill { position: absolute; left: 0; top: 0; height: 100%; background: #111; }
			.paq-forecast-strip { display: flex; width: 100%; }
			.paq-forecast { width: 62px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-right: 8px; margin-right: 8px; box-sizing: border-box; }
			.paq-forecast--divider { border-right: 2px dotted #888; }
			.paq-forecast__icon { font-size: 18px; line-height: 1; font-weight: 800; }
			.paq-sun-block { display: grid; gap: 12px; }
			.paq-sun-block__value { font-size: 24px; line-height: 1; font-weight: 800; }
			.paq-recommendations { display: grid; gap: 8px; }
			.paq-footer { padding: 0 14px; display: flex; align-items: center; justify-content: space-between; }
		`,
	});
}

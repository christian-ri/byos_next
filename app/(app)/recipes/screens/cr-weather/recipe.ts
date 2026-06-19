import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData, { type CrWeatherData, type WeatherIconName } from "./getData";

export const id = "cr-weather";
export const title = "CR Weather";
export const renderer = "chromium";

export { getData };

function iconMapPin(size = 20) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>`;
}

function iconBattery(size = 22) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="18" height="10" rx="1.5"></rect><path d="M22 10v4"></path><path d="M5 10h9v4H5z"></path></svg>`;
}

function iconHeart(size = 14) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.6-9.2-8.4C1.3 8.7 2.6 5 6.3 5c2.1 0 3.6 1.2 4.4 2.8C11.5 6.2 13 5 15.1 5c3.7 0 5 3.7 3.5 6.6C19 15.4 12 20 12 20Z"></path></svg>`;
}

function crLogo(size = 38) {
	return `<svg viewBox="0 0 1683.28 1113.43" width="${size}" height="${Math.round(
		size * 0.66,
	)}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="200" stroke-linecap="round" stroke-linejoin="round"><path d="M444.46 723.41s-23.54-180.43-151.64-194.19c-237.91-25.55-244.01 296.06-82.14 405.73 175.34 130.37 382.57 59.04 382.82 58.73"></path><path d="M529.61 427.84c-82.22-81.41-100.49-142.12-14.78-238.63 56.17-63.26 238.57-185.27 376.03 45.88 137.46 231.15-221.56 377.9-246.35 384.24s200.11 374.35 200.11 374.35"></path><path d="M1063.99 556s-42.37 45.16-84.75 170.33c-18.31 74.43 8.43 149.38 87.67 208.62 207.48 124.52 393.03-253.29 207.48-284.6-127.87-21.57 24.17 319.01 140.27 343.32 126.38 33.75 180.15-74.47 166.57-328.71 1.99-259-173.12-373.01-447.44-321.42"></path></svg>`;
}

function iconWind(size = 28) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h11a3 3 0 1 0-3-3"></path><path d="M2 12h16a3 3 0 1 1-3 3"></path><path d="M4 16h8"></path></svg>`;
}

function iconDroplet(size = 28) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3.2 4 6 7.4 6 11a6 6 0 0 1-12 0c0-3.6 2.8-7 6-11Z"></path></svg>`;
}

function iconGauge(size = 28) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 15a7.5 7.5 0 1 1 15 0"></path><path d="M12 12l3.6-3.6"></path><circle cx="12" cy="12" r="1.4"></circle></svg>`;
}

function weatherIcon(name: WeatherIconName, size = 72) {
	const common = `fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
	switch (name) {
		case "clear-day":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="12" ${common}></circle><path d="M32 7v9M32 48v9M7 32h9M48 32h9M14.5 14.5l6.5 6.5M43 43l6.5 6.5M14.5 49.5l6.5-6.5M43 21l6.5-6.5" ${common}></path></svg>`;
		case "overcast":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M17 45h28c8 0 13-5.1 13-12s-5-12-12.2-12c-2.4-7.7-9.1-12.3-17.1-12.3-9.6 0-16.4 6.5-17.8 15.1C5.2 25.3 2 29.2 2 34c0 6.2 5 11 11.3 11H17Z" ${common}></path></svg>`;
		case "rain":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M17 39h28c8 0 13-5 13-11.8S53 15.6 45.8 15.6c-2.3-7.2-8.8-11.6-16.9-11.6-9.4 0-16.1 6.3-17.4 14.7C5.4 20.4 2 24 2 28.8 2 34.5 6.7 39 12.7 39H17Z" ${common}></path><path d="M20 45l-3 8M32 45l-3 8M44 45l-3 8" ${common}></path></svg>`;
		case "partly-cloudy-day-rain":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="43" cy="18" r="8" ${common}></circle><path d="M43 4v4M43 28v4M30 18h4M52 18h4M34.5 9.5l2.8 2.8M48.7 23.7l2.8 2.8" ${common}></path><path d="M16 39h28c8 0 13-5 13-11.8S52 15.6 44.8 15.6c-2.3-7.2-8.8-11.6-16.9-11.6-9.4 0-16.1 6.3-17.4 14.7C4.4 20.4 1 24 1 28.8 1 34.5 5.7 39 11.7 39H16Z" ${common}></path><path d="M20 45l-3 8M32 45l-3 8M44 45l-3 8" ${common}></path></svg>`;
		case "thunderstorms":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M17 39h28c8 0 13-5 13-11.8S53 15.6 45.8 15.6c-2.3-7.2-8.8-11.6-16.9-11.6-9.4 0-16.1 6.3-17.4 14.7C5.4 20.4 2 24 2 28.8 2 34.5 6.7 39 12.7 39H17Z" ${common}></path><path d="M29 42l-5 10h6l-4 8 13-15h-7l4-8z" fill="currentColor" stroke="none"></path></svg>`;
		case "snow":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M17 39h28c8 0 13-5 13-11.8S53 15.6 45.8 15.6c-2.3-7.2-8.8-11.6-16.9-11.6-9.4 0-16.1 6.3-17.4 14.7C5.4 20.4 2 24 2 28.8 2 34.5 6.7 39 12.7 39H17Z" ${common}></path><path d="M20 48h7M23.5 44.5v7M19.5 44.8l8 6.4M27.5 44.8l-8 6.4M38 48h7M41.5 44.5v7M37.5 44.8l8 6.4M45.5 44.8l-8 6.4" ${common}></path></svg>`;
		case "fog":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M17 32h28c8 0 13-5 13-11.6S53.2 9 46 9c-2.2-6.4-8.2-10-15.4-10C21.8-1 15.2 4.8 13.8 12 6.9 12.8 2 17.2 2 23.2 2 28.3 6.3 32 12 32h5Z" ${common}></path><path d="M10 40h36M14 47h28M8 54h34" ${common}></path></svg>`;
		case "wind":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M7 22h28c5 0 8-3 8-7 0-3.5-2.5-6-6-6-2.7 0-5 1.6-6 4.2" ${common}></path><path d="M6 33h40c5.5 0 9 3.3 9 7.8 0 4-3 7.2-7.2 7.2-3 0-5.4-1.8-6.3-4.6" ${common}></path><path d="M14 44h18" ${common}></path></svg>`;
		default:
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="43" cy="18" r="8" ${common}></circle><path d="M43 4v4M43 28v4M30 18h4M52 18h4M34.5 9.5l2.8 2.8M48.7 23.7l2.8 2.8" ${common}></path><path d="M16 44h28c8 0 13-5.1 13-12S52 20 44.8 20c-2.3-7.3-8.8-12-17-12-9.5 0-16.2 6.4-17.5 14.9C4.3 24.6 1 28.4 1 33.3 1 39 5.7 44 11.7 44H16Z" ${common}></path></svg>`;
	}
}

function aqiRingSvg(value: string, size = 84) {
	const dots = Array.from({ length: 16 }, (_, index) => {
		const angle = (-90 + index * 22.5) * (Math.PI / 180);
		const x = 42 + Math.cos(angle) * 30;
		const y = 42 + Math.sin(angle) * 30;
		return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4" fill="#111"></circle>`;
	}).join("");

	return `<svg viewBox="0 0 84 84" width="${size}" height="${size}" aria-hidden="true"><g>${dots}</g><text x="42" y="49" text-anchor="middle" font-size="28" font-weight="800" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" fill="currentColor">${escapeHtml(value)}</text></svg>`;
}

function renderHourlyGraph(data: CrWeatherData) {
	const width = 452;
	const height = 184;
	const axisX = 38;
	const plotLeft = 82;
	const right = 12;
	const top = 18;
	const bottom = 30;
	const chartWidth = width - plotLeft - right;
	const chartHeight = height - top - bottom;
	const values = data.hourly.flatMap((point) => [point.temp, point.feels]);
	const minValue = Math.min(...values);
	const maxValue = Math.max(...values);
	const min = Math.floor(minValue) - 4;
	const max = Math.ceil(maxValue) + 4;
	const range = max - min;
	const points = data.hourly.map((point, index) => {
		const x =
			plotLeft + (index / Math.max(data.hourly.length - 1, 1)) * chartWidth;
		const yTemp = top + ((max - point.temp) / range) * chartHeight;
		const yFeels = top + ((max - point.feels) / range) * chartHeight;
		const yPrecip =
			top +
			((100 - Math.max(0, Math.min(100, point.precipitationProbability))) /
				100) *
				chartHeight;
		const labelY = Math.max(10, Math.min(yTemp, yFeels) - 11);
		return { ...point, x, yTemp, yFeels, yPrecip, labelY };
	});
	const tempPath = points.map((point) => `${point.x},${point.yTemp}`).join(" ");
	const feelsPath = points
		.map((point) => `${point.x},${point.yFeels}`)
		.join(" ");
	const precipPath = points
		.map((point) => `${point.x},${point.yPrecip}`)
		.join(" ");
	const precipAreaPath =
		points.length > 0
			? [
					`M${points[0].x},${top + chartHeight}`,
					...points.map((point) => `L${point.x},${point.yPrecip}`),
					`L${points[points.length - 1].x},${top + chartHeight}`,
					"Z",
				].join(" ")
			: "";
	const yTicks = Array.from({ length: 5 }, (_, index) => {
		const ratio = index / 4;
		return Math.round((max - range * ratio) * 10) / 10;
	});

	return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true" class="cr-graph">
		<defs>
			<pattern id="crw-precip-hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
				<line x1="0" y1="0" x2="0" y2="5" stroke="#111" stroke-width="1" opacity="0.42"></line>
			</pattern>
		</defs>
		<path d="M${axisX},${top} V${height - bottom} H${width - right}" fill="none" stroke="#111" stroke-width="1.6"></path>
		${yTicks
			.map((tick) => {
				const y = top + ((max - tick) / range) * chartHeight;
				return `<text x="${axisX - 10}" y="${y + 4}" text-anchor="end" font-size="11" font-weight="700" fill="#111">${tick}°</text>`;
			})
			.join("")}
		<path d="${precipAreaPath}" fill="url(#crw-precip-hatch)" opacity="1"></path>
		<polyline points="${precipPath}" fill="none" stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"></polyline>
		${points
			.map(
				(point) =>
					`<path d="M${point.x} ${top + chartHeight} V${point.yFeels + 8}" fill="none" stroke="#c9c9c9" stroke-width="1" stroke-dasharray="2 4"></path>`,
			)
			.join("")}
		<polyline points="${tempPath}" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
		<polyline points="${feelsPath}" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1.2 5"></polyline>
		${points
			.map(
				(point) => `
					<circle cx="${point.x}" cy="${point.yTemp}" r="3.6" fill="#111"></circle>
					<circle cx="${point.x}" cy="${point.yFeels}" r="2.8" fill="#111"></circle>
					<text x="${point.x}" y="${point.labelY}" text-anchor="middle" font-size="10" font-weight="700" fill="#111">${point.temp}°</text>
					<text x="${point.x}" y="${top + chartHeight - 9}" text-anchor="middle" font-size="8" font-weight="800" fill="#111">${point.precipitationProbability}%</text>
					<text x="${point.x}" y="${height - 8}" text-anchor="middle" font-size="11" font-weight="600" fill="#111">${escapeHtml(point.label)}</text>
				`,
			)
			.join("")}
	</svg>`;
}

export function renderHtml(data: CrWeatherData) {
	const bodyHtml = `
		<section class="screen crw-screen">
			<div class="crw-shell">
				<header class="crw-header">
					<div class="crw-header__left"><span>CR WEATHER</span>${crLogo(38)}</div>
					<div class="crw-header__center">${iconMapPin(18)}<span>${escapeHtml(data.location.toUpperCase())}</span></div>
					<div class="crw-header__right">${iconBattery(22)}<span class="crw-battery">${escapeHtml(data.batteryLabel)}</span><span class="crw-clock">${escapeHtml(data.time)}</span></div>
				</header>
				<div class="crw-rule"></div>
				<div class="crw-main">
					<section class="crw-current">
						<div class="crw-current__top">
							<div class="crw-current__icon">${weatherIcon(data.currentIcon, 84)}</div>
							<div class="crw-current__hero">
								<div class="crw-kicker">AKTUELL</div>
								<div class="crw-temp">${escapeHtml(data.currentTemp)}<span class="crw-unit">${escapeHtml(data.temperatureUnit)}</span></div>
								<div class="crw-subkicker">FEELS LIKE</div>
								<div class="crw-feels">${escapeHtml(data.feelsLike)}</div>
							</div>
						</div>
						<div class="crw-current__divider"></div>
						<div class="crw-condition">${escapeHtml(data.condition.toUpperCase())}</div>
						<div class="crw-description">${escapeHtml(data.description)}</div>
						<div class="crw-metrics">
							<div class="crw-metric">
								<div class="crw-metric__icon">${iconWind(30)}</div>
								<div class="crw-metric__value">${escapeHtml(data.windSpeed)}</div>
								<div class="crw-metric__accent">${escapeHtml(data.windDirection)}</div>
								<div class="crw-metric__label">WIND</div>
							</div>
							<div class="crw-metric crw-metric--divider">
								<div class="crw-metric__icon">${iconDroplet(30)}</div>
								<div class="crw-metric__value">${escapeHtml(data.humidity)}</div>
								<div class="crw-metric__label">FEUCHTE</div>
							</div>
							<div class="crw-metric crw-metric--divider">
								<div class="crw-metric__icon">${iconGauge(30)}</div>
								<div class="crw-metric__value">${escapeHtml(data.pressure)}</div>
								<div class="crw-metric__label">DRUCK</div>
							</div>
						</div>
						<div class="crw-air">
							<div class="crw-air__left">
								<div class="crw-air__ring">${aqiRingSvg(data.aqi, 50)}</div>
								<div class="crw-air__copy">
									<div class="crw-air__label">LUFTQUALITÄT</div>
									<div class="crw-air__status">${escapeHtml(data.aqiStatus)}</div>
									<div class="crw-air__scale">${escapeHtml(data.aqiScale)}</div>
									<div class="crw-air__summary">${
										data.aqiAvailable
											? `${escapeHtml(data.aqiSummary)} ${escapeHtml(data.aqiPrimary)}`
											: "Luftqualitätsdaten sind aktuell nicht verfügbar."
									}</div>
								</div>
							</div>
						</div>
					</section>
					<div class="crw-main__divider"></div>
					<section class="crw-right">
						<div class="crw-hours">
							<div class="crw-section-header">
								<div class="crw-section-title">NÄCHSTE 5 STUNDEN</div>
								<div class="crw-legend">
									<div class="crw-legend__item"><span class="crw-legend__line"></span>TEMP</div>
									<div class="crw-legend__item"><span class="crw-legend__line crw-legend__line--dashed"></span>FEELS</div>
									<div class="crw-legend__item"><span class="crw-legend__line crw-legend__line--precip"></span>REGEN (%)</div>
								</div>
							</div>
							${renderHourlyGraph(data)}
						</div>
						<div class="crw-right__divider"></div>
						<div class="crw-forecast">
							<div class="crw-forecast__title">5 TAGE VORSCHAU</div>
							<div class="crw-forecast__grid">
								${data.days
									.map(
										(day, index) => `
											<div class="crw-day ${index > 0 ? "crw-day--divider" : ""}">
												<div class="crw-day__label">${escapeHtml(day.label)}</div>
												<div class="crw-day__icon">${weatherIcon(day.icon, 38)}</div>
												<div class="crw-day__temps">${day.high}° / ${day.low}°</div>
												<div class="crw-day__wind">${escapeHtml(day.windArrow)} ${day.windSpeed} ${escapeHtml(data.windUnit)}</div>
											</div>
										`,
									)
									.join("")}
							</div>
						</div>
					</section>
				</div>
				<div class="crw-bottom">
					<div>DATEN VON METEO WEATHER</div>
					<div>AKTUALISIERT: ${escapeHtml(data.updatedAt)}</div>
					<div class="crw-bottom__right">WEATHER WITH LOVE ${iconHeart(12)}</div>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.crw-screen {
				background: #fff;
				color: #111;
				font-family: "IBM Plex Sans Condensed", "Aptos Narrow", "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
			}

			.crw-shell {
				width: 800px;
				height: 480px;
				padding: 16px;
				display: grid;
				grid-template-rows: 24px 2px 398px 22px;
				box-sizing: border-box;
				overflow: hidden;
			}

			.crw-header,
			.crw-bottom {
				display: grid;
				grid-template-columns: 1fr 1fr 1fr;
				align-items: center;
			}

			.crw-header {
				font-size: 16px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.08em;
			}

			.crw-header__left {
				text-align: left;
			}

			.crw-header__left,
			.crw-header__center,
			.crw-header__right,
			.crw-bottom__right {
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.crw-header__center {
				justify-content: center;
			}

			.crw-header__right {
				justify-content: flex-end;
				gap: 10px;
			}

			.crw-battery {
				font-size: 12px;
				font-weight: 700;
				letter-spacing: 0.04em;
			}

			.crw-clock {
				font-size: 18px;
				font-weight: 800;
				letter-spacing: 0.04em;
			}

			.crw-rule {
				background: #111;
				margin-top: 14px;
				margin-bottom: 8px;
			}

			.crw-main {
				display: grid;
				grid-template-columns: 286px 2px 464px;
				height: 398px;
				min-height: 0;
			}

			.crw-main__divider,
			.crw-right__divider {
				background: #111;
			}

			.crw-current {
				padding: 8px 18px 4px 8px;
				display: grid;
				grid-template-rows: 124px 2px 21px 34px 66px 120px;
				gap: 4px;
				min-height: 0;
			}

			.crw-current__top {
				display: grid;
				grid-template-columns: 96px 1fr;
				gap: 12px;
				align-items: center;
			}

			.crw-current__icon {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.crw-current__hero {
				display: grid;
				gap: 6px;
			}

			.crw-kicker,
			.crw-subkicker,
			.crw-section-title,
			.crw-forecast__title,
			.crw-aqi__label {
				font-size: 13px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.08em;
			}

			.crw-temp {
				font-size: 70px;
				line-height: 0.9;
				font-weight: 700;
				letter-spacing: -0.08em;
				white-space: nowrap;
			}

			.crw-unit {
				font-size: 28px;
				margin-left: 6px;
				letter-spacing: 0;
			}

			.crw-feels {
				font-size: 20px;
				line-height: 1;
				font-weight: 700;
			}

			.crw-current__divider,
			.crw-hours,
			.crw-forecast,
			.crw-aqi,
			.crw-bottom {
				border-top: 2px solid #111;
			}

			.crw-condition {
				font-size: 20px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.06em;
			}

			.crw-description {
				font-size: 12px;
				line-height: 1.22;
				font-weight: 500;
				max-width: 238px;
			}

			.crw-metrics {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				align-items: stretch;
				min-height: 0;
				padding-top: 2px;
				padding-bottom: 6px;
			}

			.crw-metric {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 3px;
				text-align: center;
				padding: 0 8px;
			}

			.crw-metric--divider {
				border-left: 1px solid #111;
			}

			.crw-metric__value {
				font-size: 15px;
				line-height: 1;
				font-weight: 700;
			}

			.crw-metric__accent,
			.crw-metric__label {
				font-size: 10px;
				line-height: 1;
				font-weight: 600;
				letter-spacing: 0.03em;
			}

			.crw-right {
				padding-left: 16px;
				display: grid;
				grid-template-rows: 238px 2px 146px;
				min-height: 0;
			}

			.crw-hours {
				padding-top: 8px;
				border-top: 0;
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 8px;
			}

			.crw-section-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}

			.crw-section-title {
				white-space: nowrap;
			}

			.crw-legend {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 10px;
				line-height: 1;
				font-weight: 600;
				letter-spacing: 0.04em;
				white-space: nowrap;
			}

			.crw-legend__item {
				display: flex;
				align-items: center;
				gap: 6px;
			}

			.crw-legend__line {
				width: 30px;
				height: 0;
				border-top: 2px solid #111;
				display: inline-block;
			}

			.crw-legend__line--dashed {
				border-top-style: dotted;
			}

			.crw-legend__line--precip {
				border-top-width: 1px;
				opacity: 0.5;
			}

			.crw-graph {
				display: block;
			}

			.crw-forecast {
				padding-top: 8px;
				border-top: 0;
				display: grid;
				grid-template-rows: auto 122px;
				gap: 4px;
			}

			.crw-forecast__grid {
				display: grid;
				grid-template-columns: repeat(5, 1fr);
				height: 100%;
			}

			.crw-day {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				text-align: center;
				gap: 3px;
				padding: 0 3px;
			}

			.crw-day--divider {
				border-left: 1px solid #111;
			}

			.crw-day__label,
			.crw-day__wind {
				font-size: 9px;
				line-height: 1;
				font-weight: 600;
				letter-spacing: 0.04em;
			}

			.crw-day__temps {
				font-size: 13px;
				line-height: 1;
				font-weight: 700;
			}

			.crw-air__left,
			.crw-air__copy {
				display: flex;
				align-items: center;
			}

			.crw-air {
				border-top: 2px solid #111;
				padding-top: 8px;
				margin-top: 10px;
				display: grid;
				grid-template-columns: 1fr;
				align-content: start;
			}

			.crw-air__left {
				gap: 8px;
				align-items: flex-start;
			}

			.crw-air__copy {
				flex-direction: column;
				align-items: flex-start;
				gap: 3px;
			}

			.crw-air__label {
				font-size: 11px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.08em;
			}

			.crw-air__status {
				font-size: 15px;
				line-height: 1;
				font-weight: 800;
			}

			.crw-air__scale {
				font-size: 9px;
				line-height: 1;
				font-weight: 600;
				letter-spacing: 0.04em;
			}

			.crw-air__summary {
				max-width: 188px;
				font-size: 10px;
				line-height: 1.2;
				font-weight: 700;
				letter-spacing: 0.015em;
			}

			.crw-bottom {
				border-top-width: 1px;
				margin-top: 0;
				padding-top: 4px;
				font-size: 9px;
				line-height: 1;
				font-weight: 600;
				letter-spacing: 0.08em;
			}

			.crw-bottom > :nth-child(2) {
				justify-self: center;
				text-align: center;
			}

			.crw-bottom__right {
				justify-content: flex-end;
			}
		`,
	});
}

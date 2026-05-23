import type { LpWeatherRecipeData } from "@/app/(app)/recipes/screens/lp-weather/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "lp-weather";
export const title = "LP Weather";
export const renderer = "chromium";

export { getData };

function iconKind(iconClass: string) {
	if (iconClass.includes("sunny") || iconClass.includes("clear")) return "sun";
	if (iconClass.includes("cloud")) return "cloud";
	if (iconClass.includes("rain")) return "rain";
	if (iconClass.includes("snow")) return "snow";
	if (iconClass.includes("fog")) return "fog";
	if (iconClass.includes("thunder")) return "storm";
	return "cloud";
}

function iconSvg(kind: string, size = 64) {
	const stroke = 3.2;
	const common = `fill="none" stroke="#111" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"`;
	switch (kind) {
		case "sun":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="11" ${common}></circle><path d="M32 7v9M32 48v9M7 32h9M48 32h9M14.5 14.5l6.4 6.4M43.1 43.1l6.4 6.4M14.5 49.5l6.4-6.4M43.1 20.9l6.4-6.4" ${common}></path></svg>`;
		case "rain":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 43h23c7 0 12-4.7 12-11.1S49 20 42.5 20c-1.7-6.6-7.2-10-14-10-8 0-14 5.8-15.3 13.5C8.6 24.5 5 28.4 5 33c0 5.5 4.4 10 10 10h4" ${common}></path><path d="M23 47l-3 7M34 47l-3 7M45 47l-3 7" ${common}></path></svg>`;
		case "snow":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 40h24c6.7 0 11-4.4 11-10.2S49.6 20 43.5 20c-1.8-6.4-7.3-10-14.2-10-8 0-13.8 5.7-15.1 13.1C8.9 24 5 27.7 5 32.6 5 37.2 8.8 40 14 40h5" ${common}></path><path d="M24 47h8M28 43v8M25.2 44.2l5.6 5.6M30.8 44.2l-5.6 5.6M40 48h8M44 44v8M41.2 45.2l5.6 5.6M46.8 45.2l-5.6 5.6" ${common}></path></svg>`;
		case "storm":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M19 41h24c6.7 0 11-4.4 11-10.2S49.6 21 43.5 21c-1.8-6.4-7.3-10-14.2-10-8 0-13.8 5.7-15.1 13.1C8.9 25 5 28.7 5 33.6 5 38.2 8.8 41 14 41h5" ${common}></path><path d="M31 44l-5 10h6l-4 8 12-14h-7l4-8z" fill="#111"></path></svg>`;
		case "fog":
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M16 24h30c6 0 10 4 10 9.2 0 4.8-4 8.8-9.5 8.8H16c-6 0-10-4-10-9.2C6 28 10 24 16 24Z" ${common}></path><path d="M10 47h38M16 53h30" ${common}></path></svg>`;
		default:
			return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M18 43h27c8 0 13-5.1 13-12 0-6.4-4.9-11.4-11.7-11.4-1.9-7.1-7.8-11.6-15.5-11.6-8.7 0-15 5.9-16.4 13.8C8.7 23 5 27.3 5 32.5 5 38.3 9.7 43 16 43h2" ${common}></path></svg>`;
	}
}

function renderHourlyChart(data: LpWeatherRecipeData) {
	const points = data.hourly.slice(0, 7);
	if (points.length === 0) return "";

	const width = 412;
	const height = 198;
	const left = 20;
	const top = 16;
	const bottom = 34;
	const right = 10;
	const temps = points.map((point) => point.temperature);
	const max = Math.max(...temps) + 2;
	const min = Math.min(...temps) - 2;
	const spread = Math.max(6, max - min);
	const chartHeight = height - top - bottom;
	const chartWidth = width - left - right;
	const mapped = points.map((point, index) => {
		const x = left + (index / Math.max(1, points.length - 1)) * chartWidth;
		const y = top + ((max - point.temperature) / spread) * chartHeight;
		return { ...point, x, y };
	});
	const polyline = mapped.map((point) => `${point.x},${point.y}`).join(" ");

	return `
		<div class="lp-chart">
			<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
				<rect x="0" y="0" width="${width}" height="${height}" fill="#fff"></rect>
				<path d="M${left},${height - bottom} H${width - right}" stroke="#111" stroke-width="2"></path>
				<path d="M${left},${top + chartHeight * 0.3} H${width - right}" stroke="#999" stroke-width="1" stroke-dasharray="2 3"></path>
				<path d="M${left},${top + chartHeight * 0.62} H${width - right}" stroke="#999" stroke-width="1" stroke-dasharray="2 3"></path>
				<polyline points="${polyline}" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
				${mapped
					.map(
						(point) => `
							<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="#111"></circle>
							<text x="${point.x}" y="${point.y - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="#111">${escapeHtml(String(point.temperature))}°</text>
							<text x="${point.x}" y="${height - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="#111">${escapeHtml(point.label)}</text>
						`,
					)
					.join("")}
			</svg>
			<div class="lp-chart__icons">
				${mapped
					.map(
						(point) => `
							<div class="lp-chart__icon" style="left:${point.x - 14}px; top:${Math.max(0, point.y - 44)}px;">
								${iconSvg(iconKind(point.iconClass), 28)}
							</div>
						`,
					)
					.join("")}
			</div>
		</div>
	`;
}

function renderDayRow(day: LpWeatherRecipeData["days"][number], index: number) {
	const high = Number(day.high);
	const low = Number(day.low);
	const tempWidth = Math.max(18, Math.min(54, (high - low + 6) * 3));
	const offset = Math.max(0, Math.min(18, low + 8));

	return `
		<div class="lp-day-row ${index === 0 ? "lp-day-row--today" : ""}">
			<div class="lp-day-row__label">${escapeHtml(day.label)}</div>
			<div class="lp-day-row__weather">
				<div class="lp-day-row__icon">${iconSvg(iconKind(day.iconClass), 22)}</div>
				<div class="lp-day-row__low">${escapeHtml(String(day.low))}°</div>
				<div class="lp-day-row__range">
					<div class="lp-day-row__range-track"></div>
					<div class="lp-day-row__range-fill" style="left:${offset}px; width:${tempWidth}px;"></div>
				</div>
				<div class="lp-day-row__high">${escapeHtml(String(day.high))}°</div>
			</div>
		</div>
	`;
}

export function renderHtml(data: LpWeatherRecipeData) {
	const nextDays = data.days.slice(0, 6);

	const bodyHtml = `
		<section class="screen lpw-screen">
			<div class="lpw-frame">
				<div class="lpw-main">
					<section class="lpw-current">
						<div class="lpw-current__hero">
							<div class="lpw-current__icon">${iconSvg(iconKind(data.iconClass), 120)}</div>
							<div class="lpw-current__temp">${escapeHtml(String(data.currentTemp))}°</div>
							<div class="lpw-current__meta">
								<div>${escapeHtml(data.condition)}</div>
								<div>Feels ${escapeHtml(String(data.feelsLike))}°</div>
								<div>Humidity ${escapeHtml(String(data.humidity))}%</div>
								<div>Wind ${escapeHtml(String(data.windSpeed))} ${escapeHtml(data.windDirection)}</div>
							</div>
						</div>
						<div class="lpw-chart-wrap">
							<div class="lpw-sun-times">
								<div>${iconSvg("sun", 18)} ${escapeHtml(data.sunset)}</div>
								<div>${iconSvg("sun", 18)} ${escapeHtml(data.sunrise)}</div>
							</div>
							${renderHourlyChart(data)}
						</div>
					</section>
					<section class="lpw-forecast">
						${nextDays.map((day, index) => renderDayRow(day, index)).join("")}
					</section>
				</div>
				<footer class="lpw-footer">
					<div class="lpw-footer__brand">
						${iconSvg(iconKind(data.iconClass), 20)}
						<span>${escapeHtml(data.title)}</span>
					</div>
					<div class="lpw-footer__updated">Updated ${escapeHtml(data.updatedAt)}</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.lpw-screen {
				padding: 18px;
				background: #f6f1e7;
			}

			.lpw-frame {
				height: 100%;
				border: 1px solid #b9b9b9;
				border-radius: 20px;
				box-shadow: none;
				background: #f4f4f4;
				padding: 16px;
				display: grid;
				grid-template-rows: 1fr 42px;
				gap: 12px;
			}

			.lpw-main {
				display: grid;
				grid-template-columns: 1fr 226px;
				gap: 14px;
				min-height: 0;
			}

			.lpw-current {
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
				min-height: 0;
			}

			.lpw-current__hero {
				display: grid;
				grid-template-columns: 116px 124px 1fr;
				gap: 10px;
				align-items: center;
			}

			.lpw-current__temp {
				font-size: 86px;
				line-height: 0.85;
				font-weight: 300;
				letter-spacing: -0.07em;
			}

			.lpw-current__meta {
				font-size: 17px;
				line-height: 1.08;
				font-weight: 600;
			}

			.lpw-chart-wrap {
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 4px;
			}

			.lpw-sun-times {
				display: flex;
				justify-content: space-between;
				font-size: 16px;
				line-height: 1;
				font-weight: 600;
				padding: 0 14px;
			}

			.lpw-sun-times div {
				display: flex;
				align-items: center;
				gap: 5px;
			}

			.lpw-forecast {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				padding-top: 8px;
				min-width: 0;
			}

			.lp-day-row {
				display: grid;
				grid-template-columns: 82px 1fr;
				align-items: center;
				gap: 8px;
				min-height: 48px;
			}

			.lp-day-row__label {
				font-size: 14px;
				line-height: 1;
				font-weight: 500;
				white-space: nowrap;
			}

			.lp-day-row__weather {
				display: grid;
				grid-template-columns: 24px 34px 1fr 34px;
				align-items: center;
				gap: 6px;
				min-width: 0;
			}

			.lp-day-row__low,
			.lp-day-row__high {
				font-size: 18px;
				line-height: 1;
				font-weight: 700;
			}

			.lp-day-row__range {
				position: relative;
				height: 18px;
			}

			.lp-day-row__range-track {
				position: absolute;
				left: 0;
				right: 0;
				top: 0;
				bottom: 0;
				border: 2px solid #777;
				border-radius: 999px;
			}

			.lp-day-row__range-fill {
				position: absolute;
				top: 2px;
				bottom: 2px;
				border-radius: 999px;
				background: #777;
			}

			.lp-chart {
				position: relative;
				width: 412px;
				height: 198px;
				align-self: end;
			}

			.lp-chart__icons {
				position: absolute;
				inset: 0;
			}

			.lp-chart__icon {
				position: absolute;
				width: 28px;
				height: 28px;
			}

			.lpw-footer {
				border-top: 1px dotted #999;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 8px;
				font-size: 16px;
				line-height: 1;
			}

			.lpw-footer__brand {
				display: flex;
				align-items: center;
				gap: 8px;
				font-weight: 700;
			}

			.lpw-footer__updated {
				color: #666;
				font-weight: 600;
			}
		`,
	});
}

import type { SkyWatchRecipeData } from "@/app/(app)/recipes/screens/skywatch/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "skywatch";
export const title = "SkyWatch";
export const renderer = "chromium";

export { getData };

const LABEL_WIDTH = 176;
const LABEL_HEIGHT = 72;
const MAP_WIDTH = 800;
const MAP_HEIGHT = 438;

function formatTimeLabel(updatedAt: string) {
	const match = updatedAt.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
	return match ? match[1].toUpperCase() : updatedAt;
}

function labelPlacement(x: number, y: number, index: number) {
	const prefersLeft = x > 0.7;
	const prefersAbove = y > 0.72;
	const offsetX = prefersLeft ? -LABEL_WIDTH - 18 : 18;
	const offsetYBase = prefersAbove ? -LABEL_HEIGHT - 10 : -6;
	const offsetY = offsetYBase + ((index % 3) - 1) * 6;

	return {
		left: Math.max(
			8,
			Math.min(MAP_WIDTH - LABEL_WIDTH - 8, x * MAP_WIDTH + offsetX),
		),
		top: Math.max(
			8,
			Math.min(MAP_HEIGHT - LABEL_HEIGHT - 8, y * MAP_HEIGHT + offsetY),
		),
		align: prefersLeft ? "right" : "left",
	};
}

function renderPlane(
	plane: SkyWatchRecipeData["aircraft"][number],
	index: number,
) {
	const label = labelPlacement(plane.x, plane.y, index);
	const connectorStartX = plane.x * MAP_WIDTH;
	const connectorStartY = plane.y * MAP_HEIGHT;
	const connectorEndX =
		label.align === "right" ? label.left + LABEL_WIDTH : label.left;
	const connectorEndY = label.top + LABEL_HEIGHT / 2;
	const dx = connectorEndX - connectorStartX;
	const dy = connectorEndY - connectorStartY;
	const connectorWidth = Math.max(2, Math.hypot(dx, dy));

	return `
		<div class="sky-plane">
			<div class="sky-plane__connector" style="left:${connectorStartX}px; top:${connectorStartY}px; width:${connectorWidth}px; transform: rotate(${Math.atan2(dy, dx)}rad);"></div>
			<div class="sky-plane__icon" style="left:${connectorStartX - 18}px; top:${connectorStartY - 18}px; transform: rotate(${plane.heading + 45}deg); opacity:${Math.max(0.55, plane.brightness)};">
						<svg viewBox="0 0 238.45445 228.24998" width="34" height="34" aria-hidden="true">
							<path fill="#111111" fill-rule="evenodd" d="M194.67321 0 70.641958 53.625c-10.38227-6.92107-34.20058-21.27539-38.90545-23.44898-39.4400301-18.22079-36.9454001 14.73107-20.34925 24.6052 4.53917 2.70065 27.72352 17.17823 43.47345 26.37502l17.90625 133.9375 22.21875 13.15625 11.531252-120.9375 71.53125 36.6875 3.84375 39.21875 14.53125 8.625 11.09375-42.40625.125.0625 30.8125-31.53125-14.875-8-35.625 16.90625-68.28125-42.4375L217.36071 12.25 194.67321 0z"/>
						</svg>
			</div>
			<div class="sky-plane__label sky-plane__label--${label.align}" style="left:${label.left}px; top:${label.top}px;">
				<div class="sky-plane__callsign">${escapeHtml(plane.callsign)}</div>
				<div class="sky-plane__type">${escapeHtml(plane.aircraftType)}</div>
				${
					plane.routeLabel
						? `<div class="sky-plane__route">${escapeHtml(plane.routeLabel)}</div>`
						: ""
				}
				<div class="sky-plane__meta">
					<span>${escapeHtml(plane.altitudeLabel)}</span>
					<span class="sky-plane__dot">·</span>
					<span>${escapeHtml(plane.speedLabel)}</span>
				</div>
			</div>
		</div>
	`;
}

export function renderHtml(data: SkyWatchRecipeData) {
	const timestampLabel = formatTimeLabel(data.updatedAt);

	const bodyHtml = `
		<section class="screen sky-screen">
			<div class="sky-shell">
				<div class="sky-map">
					${data.map.tiles
						.map(
							(tile) => `
								<div
									class="sky-tile"
									style="left:${tile.left * (MAP_WIDTH / data.map.width)}px; top:${tile.top * (MAP_HEIGHT / data.map.height)}px; width:${tile.size * (MAP_WIDTH / data.map.width)}px; height:${tile.size * (MAP_HEIGHT / data.map.height)}px; background-image:url('${tile.src}');"
								></div>
							`,
						)
						.join("")}
					<div class="sky-map__shade"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:100px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:200px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:300px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:400px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:500px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:600px"></div>
					<div class="sky-map__grid sky-map__grid--v" style="left:700px"></div>
					<div class="sky-map__grid sky-map__grid--h" style="top:80px"></div>
					<div class="sky-map__grid sky-map__grid--h" style="top:160px"></div>
					<div class="sky-map__grid sky-map__grid--h" style="top:240px"></div>
					<div class="sky-map__grid sky-map__grid--h" style="top:320px"></div>
					<div class="sky-map__grid sky-map__grid--h" style="top:400px"></div>
					<div class="sky-ring sky-ring--1"></div>
					<div class="sky-ring sky-ring--2"></div>
					<div class="sky-ring sky-ring--3"></div>
					<div class="sky-axis sky-axis--h"></div>
					<div class="sky-axis sky-axis--v"></div>
					<div class="sky-crosshair">
						<svg viewBox="0 0 40 40" width="22" height="22" aria-hidden="true">
							<circle cx="20" cy="20" r="7.5" fill="none" stroke="#111" stroke-width="2.6"></circle>
							<path d="M20 3.5v8M20 28.5v8M3.5 20h8M28.5 20h8" stroke="#111" stroke-width="2.6" stroke-linecap="round"></path>
						</svg>
					</div>
					<div class="sky-radius">${escapeHtml(data.radiusLabel)}</div>
					${data.aircraft
						.slice(0, 9)
						.map((plane, index) => renderPlane(plane, index))
						.join("")}
				</div>
				<footer class="sky-footer">
					<div class="sky-footer__brand">
						<svg viewBox="0 0 238.45445 228.24998" width="20" height="20" aria-hidden="true">
							<path fill="#111111" fill-rule="evenodd" d="M194.67321 0 70.641958 53.625c-10.38227-6.92107-34.20058-21.27539-38.90545-23.44898-39.4400301-18.22079-36.9454001 14.73107-20.34925 24.6052 4.53917 2.70065 27.72352 17.17823 43.47345 26.37502l17.90625 133.9375 22.21875 13.15625 11.531252-120.9375 71.53125 36.6875 3.84375 39.21875 14.53125 8.625 11.09375-42.40625.125.0625 30.8125-31.53125-14.875-8-35.625 16.90625-68.28125-42.4375L217.36071 12.25 194.67321 0z"/>
						</svg>
						<div class="sky-footer__title">${escapeHtml(data.title)}</div>
					</div>
					<div class="sky-footer__meta">
						<span>${escapeHtml(data.locationLabel)}</span>
						<span class="sky-footer__dot">·</span>
						<span>${escapeHtml(timestampLabel)}</span>
					</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.sky-screen {
				background: #d1d1d1;
				color: #111;
			}

			.sky-shell {
				height: 100%;
				position: relative;
				overflow: hidden;
				background: #d1d1d1;
			}

			.sky-map {
				position: absolute;
				left: 0;
				top: 0;
				width: 800px;
				height: 438px;
				overflow: hidden;
			}

			.sky-tile {
				position: absolute;
				background-size: cover;
				background-position: center;
				opacity: 0.08;
				filter: grayscale(1) contrast(0.9) brightness(1.12);
			}

			.sky-map__shade {
				position: absolute;
				inset: 0;
				background: rgba(255,255,255,0.34);
			}

			.sky-map__grid,
			.sky-axis {
				position: absolute;
				background: rgba(0,0,0,0.08);
			}

			.sky-map__grid--v {
				top: 0;
				bottom: 0;
				width: 1px;
			}

			.sky-map__grid--h {
				left: 0;
				right: 0;
				height: 1px;
			}

			.sky-ring {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
				border-radius: 999px;
				border: 1px solid rgba(0,0,0,0.16);
			}

			.sky-ring--1 { width: 360px; height: 360px; opacity: 0.4; }
			.sky-ring--2 { width: 230px; height: 230px; opacity: 0.6; }
			.sky-ring--3 { width: 120px; height: 120px; opacity: 1; }

			.sky-axis--h {
				left: 0;
				right: 0;
				height: 1px;
				top: 219px;
				background: rgba(0,0,0,0.15);
			}

			.sky-axis--v {
				top: 0;
				bottom: 0;
				width: 1px;
				left: 400px;
				background: rgba(0,0,0,0.15);
			}

			.sky-crosshair {
				position: absolute;
				left: 389px;
				top: 208px;
				width: 22px;
				height: 22px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.sky-radius {
				position: absolute;
				left: 418px;
				top: 201px;
				font-size: 13px;
				line-height: 1;
				letter-spacing: 1.2px;
				text-transform: uppercase;
				color: rgba(0,0,0,0.82);
			}

			.sky-plane__connector {
				position: absolute;
				height: 1px;
				border-top: 1px solid rgba(0,0,0,0.14);
				transform-origin: 0 0;
			}

			.sky-plane__icon {
				position: absolute;
				width: 36px;
				height: 36px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.sky-plane__label {
				position: absolute;
				width: 176px;
				height: 72px;
				padding: 8px 10px;
				display: flex;
				flex-direction: column;
				justify-content: center;
				background: rgba(255,255,255,0.92);
				border: 1px solid rgba(0,0,0,0.18);
				box-shadow: 0 1px 0 rgba(255,255,255,0.3) inset;
			}

			.sky-plane__label--right {
				text-align: right;
			}

			.sky-plane__callsign {
				font-size: 14px;
				line-height: 1.15;
				font-weight: 800;
				letter-spacing: 0.2px;
				text-transform: uppercase;
			}

			.sky-plane__type,
			.sky-plane__route {
				margin-top: 3px;
				font-size: 11px;
				line-height: 1.15;
				text-transform: none;
				white-space: nowrap;
				overflow: hidden;
			}

			.sky-plane__type {
				opacity: 0.96;
				font-weight: 700;
			}

			.sky-plane__route {
				opacity: 0.8;
			}

			.sky-plane__meta {
				margin-top: 4px;
				font-size: 11px;
				line-height: 1.15;
				text-transform: none;
				font-weight: 700;
				display: flex;
				gap: 4px;
				justify-content: inherit;
			}

			.sky-plane__label--right .sky-plane__meta {
				justify-content: flex-end;
			}

			.sky-plane__dot,
			.sky-footer__dot {
				opacity: 0.7;
			}

			.sky-footer {
				position: absolute;
				left: 0;
				right: 0;
				bottom: 0;
				height: 42px;
				border-top: 1px solid rgba(0,0,0,0.14);
				background: rgba(255,255,255,0.5);
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 16px;
			}

			.sky-footer__brand,
			.sky-footer__meta {
				display: flex;
				align-items: center;
				gap: 10px;
			}

			.sky-footer__title,
			.sky-footer__meta {
				font-size: 16px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.5px;
			}
		`,
	});
}

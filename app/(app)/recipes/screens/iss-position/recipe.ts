import type { IssPositionRecipeData } from "@/app/(app)/recipes/screens/iss-position/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { publicAssetToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "iss-position";
export const title = "ISS Position";
export const renderer = "chromium";

export { getData };

function renderStat(label: string, value: string) {
	return `
		<article class="item iss-stat">
			<div class="meta">${escapeHtml(label)}</div>
			<div class="iss-stat__value">${escapeHtml(value)}</div>
		</article>
	`;
}

export async function renderHtml(data: IssPositionRecipeData) {
	const markerLeft = `${Math.min(94, Math.max(6, data.mapX * 100)).toFixed(2)}%`;
	const markerTop = `${Math.min(90, Math.max(10, data.mapY * 100)).toFixed(2)}%`;
	const footprintSize = `${Math.min(34, Math.max(14, data.footprintPercent * 100)).toFixed(2)}%`;
	const worldMapDataUri = await publicAssetToDataUri("/world.svg");

	const bodyHtml = `
		<section class="screen iss-screen">
			<div class="iss-shell">
				<header class="iss-header">
					<div>
						<div class="meta">${escapeHtml(data.title)}</div>
						<h1 class="title">${escapeHtml(data.subtitle)}</h1>
					</div>
					<div class="iss-header__aside">
						<div class="iss-visibility">${escapeHtml(data.visibilityLabel)}</div>
						${data.showTimestamp ? `<div class="footer">Updated ${escapeHtml(data.updatedAt)}</div>` : ""}
					</div>
				</header>
				<div class="iss-main">
					<section class="item iss-map-card">
						<div class="iss-map">
							${
								worldMapDataUri
									? `<img src="${worldMapDataUri}" alt="" class="iss-map__world" />`
									: ""
							}
							${
								data.showFootprint
									? `<div class="iss-map__footprint" style="left:${markerLeft}; top:${markerTop}; width:${footprintSize}; height:${footprintSize};"></div>`
									: ""
							}
							<div class="iss-map__marker" style="left:${markerLeft}; top:${markerTop};">
								<span>ISS</span>
							</div>
						</div>
						<div class="iss-map__coords">
							${renderStat("Latitude", data.latitudeLabel)}
							${renderStat("Longitude", data.longitudeLabel)}
						</div>
					</section>
					<section class="iss-stats">
						${renderStat("Altitude", data.altitudeLabel)}
						${renderStat("Velocity", data.velocityLabel)}
						${renderStat("Visibility", data.visibilityLabel)}
						${renderStat("Footprint", data.footprintLabel)}
						<article class="item iss-note">
							<div class="meta">Tracking note</div>
							<div class="description">${escapeHtml(
								data.note ||
									"Live orbital position with simplified ground track view.",
							)}</div>
						</article>
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.iss-screen {
				padding: 20px;
				background: #f3f1ea;
			}

			.iss-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fcfbf8 0%, #efebe2 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.iss-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
			}

			.iss-header__aside {
				display: grid;
				justify-items: end;
				gap: 6px;
				text-align: right;
				max-width: 250px;
			}

			.iss-visibility {
				font-size: 18px;
				line-height: 1;
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.06em;
			}

			.iss-main {
				display: grid;
				grid-template-columns: 360px 1fr;
				gap: 14px;
				min-height: 0;
			}

			.iss-map-card {
				background: #fff;
				gap: 12px;
			}

			.iss-map {
				position: relative;
				height: 214px;
				border: 2px solid #111;
				overflow: hidden;
				background: #f7f7f7;
			}

			.iss-map__world {
				position: absolute;
				left: 10px;
				right: 10px;
				top: 18px;
				bottom: 18px;
				width: calc(100% - 20px);
				height: calc(100% - 36px);
				object-fit: contain;
				display: block;
				opacity: 0.62;
				filter: grayscale(1) contrast(1.15);
			}

			.iss-map__footprint {
				position: absolute;
				transform: translate(-50%, -50%);
				border-radius: 999px;
				border: 2px solid #a6a6a6;
			}

			.iss-map__marker {
				position: absolute;
				transform: translate(-50%, -50%);
				width: 34px;
				height: 34px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 999px;
				border: 2px solid #111;
				background: rgba(255,255,255,0.94);
				font-size: 10px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.08em;
			}

			.iss-map__coords {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
			}

			.iss-stats {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
				min-height: 0;
			}

			.iss-stat {
				background: #fff;
				gap: 6px;
				justify-content: center;
			}

			.iss-stat__value {
				font-size: 19px;
				line-height: 1.05;
				font-weight: 800;
				word-break: break-word;
			}

			.iss-note {
				grid-column: 1 / span 2;
				background: #fff;
				gap: 10px;
			}

			.iss-note .description {
				font-size: 15px;
				line-height: 1.3;
			}
		`,
	});
}

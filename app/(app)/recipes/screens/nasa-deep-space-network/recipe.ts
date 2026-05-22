import type { DsnRecipeData } from "@/app/(app)/recipes/screens/nasa-deep-space-network/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "nasa-deep-space-network";
export const title = "NASA Deep Space Network";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

function renderCraft(
	craft: DsnRecipeData["stations"][number]["crafts"][number],
	index: number,
) {
	return `
		<div class="dsn-craft" data-index="${index}">
			<div class="dsn-craft__name">${escapeHtml(craft.name)}</div>
			<div class="dsn-craft__signal">Up: ${escapeHtml(truncateText(craft.uplink, 22))}</div>
			<div class="dsn-craft__signal">Down: ${escapeHtml(truncateText(craft.downlink, 24))}</div>
		</div>
	`;
}

function renderStation(station: DsnRecipeData["stations"][number]) {
	return `
		<article class="dsn-station">
			<div class="dsn-station__head">
				<div class="dsn-station__title">${escapeHtml(station.name)}</div>
				<div class="meta">${escapeHtml(String(station.craftCount))} craft</div>
				<div class="meta">${escapeHtml(String(station.signalCount))} signals</div>
			</div>
			<div class="dsn-station__crafts">
				${station.crafts
					.slice(0, 3)
					.map((craft, index) => renderCraft(craft, index))
					.join("")}
			</div>
		</article>
	`;
}

export function renderHtml(data: DsnRecipeData) {
	const bodyHtml = `
		<section class="screen dsn-screen">
			<div class="dsn-shell">
				<header class="dsn-header">
					<div>
						<div class="dsn-kicker">NASA</div>
						<h1 class="dsn-title">Deep Space Network</h1>
						<div class="dsn-subtitle">Three ground stations, live traffic</div>
					</div>
					<div class="dsn-header__meta">
						<div>Updated ${escapeHtml(data.updatedAt)}</div>
						<div>${escapeHtml(String(data.stations.length))} stations online</div>
					</div>
				</header>
				<section class="dsn-grid">
					${data.stations.map((station) => renderStation(station)).join("")}
				</section>
				<footer class="dsn-footer">
					<div>${escapeHtml(
						data.note || "Data source: NASA DSN Now via trmnl-dsn.",
					)}</div>
					<div>eyes.nasa.gov</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.dsn-screen {
				padding: 20px;
				background: #fff;
			}

			.dsn-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 14px;
				background: #fff;
			}

			.dsn-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
				border-bottom: 2px solid #111;
				padding-bottom: 12px;
			}

			.dsn-kicker {
				font-size: 18px;
				line-height: 1;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.3em;
			}

			.dsn-title {
				margin: 10px 0 0;
				font-size: 56px;
				line-height: 0.92;
				font-weight: 800;
				letter-spacing: -0.05em;
				max-width: 340px;
			}

			.dsn-subtitle {
				margin-top: 12px;
				font-size: 20px;
				line-height: 1.1;
				font-weight: 600;
			}

			.dsn-header__meta {
				font-size: 16px;
				line-height: 1.25;
				font-weight: 600;
				text-align: right;
				max-width: 160px;
				display: grid;
				gap: 8px;
			}

			.dsn-grid {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 14px;
				min-height: 0;
			}

			.dsn-station {
				border: 2px solid #111;
				border-radius: 18px;
				padding: 16px;
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.dsn-station__head {
				border-bottom: 2px solid #111;
				padding-bottom: 12px;
			}

			.dsn-station__title {
				font-size: 30px;
				line-height: 0.95;
				font-weight: 800;
				letter-spacing: -0.04em;
				margin-bottom: 8px;
			}

			.dsn-station__crafts {
				display: grid;
				gap: 12px;
				align-content: start;
			}

			.dsn-craft__name {
				font-size: 22px;
				line-height: 1;
				font-weight: 800;
				margin-bottom: 6px;
			}

			.dsn-craft__signal {
				font-size: 14px;
				line-height: 1.2;
				font-weight: 600;
				margin-top: 4px;
			}

			.dsn-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 12px;
				border-top: 2px solid #111;
				padding-top: 10px;
				font-size: 16px;
				line-height: 1.2;
				font-weight: 600;
			}
		`,
	});
}

import type { FlightBoardRecipeData } from "@/app/(app)/recipes/screens/flightboard/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "flightboard";
export const title = "FlightBoard";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

function renderRow(
	flight: FlightBoardRecipeData["flights"][number],
	index: number,
) {
	return `
		<div class="flight-row ${index % 2 === 0 ? "flight-row--even" : ""}">
			<div>${escapeHtml(truncateText(flight.callsign, 12))}</div>
			<div>${escapeHtml(truncateText(flight.country, 14))}</div>
			<div>${escapeHtml(flight.status)}</div>
			<div>${escapeHtml(flight.altitude)}</div>
			<div>${escapeHtml(flight.speed)}</div>
			<div>${escapeHtml(flight.distance)}</div>
		</div>
	`;
}

export function renderHtml(data: FlightBoardRecipeData) {
	const bodyHtml = `
		<section class="screen flight-screen">
			<div class="flight-shell">
				<header class="flight-header">
					<div>
						<div class="flight-kicker">FlightBoard</div>
						<h1 class="flight-code">${escapeHtml(data.airportCode)}</h1>
						<div class="flight-airport">${escapeHtml(
							truncateText(data.airportName, 56),
						)}</div>
					</div>
					<div class="flight-header__meta">
						<div>Updated ${escapeHtml(data.updatedAt)}</div>
						<div>${escapeHtml(String(data.flights.length))} nearby aircraft</div>
					</div>
				</header>
				<section class="flight-table">
					<div class="flight-table__head">
						<div>Callsign</div>
						<div>Country</div>
						<div>Status</div>
						<div>Altitude</div>
						<div>Speed</div>
						<div>Range</div>
					</div>
					${data.flights.map((flight, index) => renderRow(flight, index)).join("")}
				</section>
				<footer class="flight-footer">
					<div>${escapeHtml(
						data.note ||
							"Airport activity approximation powered by OpenSky live state vectors.",
					)}</div>
					<div>Live state vectors</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.flight-screen {
				padding: 20px;
				background: #fff;
			}

			.flight-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 14px;
				background: #fff;
			}

			.flight-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
				border-bottom: 2px solid #111;
				padding-bottom: 12px;
			}

			.flight-kicker {
				font-size: 18px;
				line-height: 1;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.3em;
			}

			.flight-code {
				margin: 10px 0 0;
				font-size: 58px;
				line-height: 0.9;
				font-weight: 800;
				letter-spacing: -0.05em;
			}

			.flight-airport {
				margin-top: 10px;
				font-size: 20px;
				line-height: 1.1;
				font-weight: 600;
			}

			.flight-header__meta {
				font-size: 16px;
				line-height: 1.25;
				font-weight: 600;
				text-align: right;
				max-width: 160px;
				display: grid;
				gap: 8px;
			}

			.flight-table {
				display: grid;
				grid-template-rows: auto repeat(${Math.max(data.flights.length, 1)}, 1fr);
				min-height: 0;
			}

			.flight-table__head,
			.flight-row {
				display: grid;
				grid-template-columns: 1.3fr 1.2fr 0.9fr 0.9fr 0.8fr 0.8fr;
				column-gap: 10px;
				align-items: center;
			}

			.flight-table__head {
				background: #111;
				color: #fff;
				padding: 10px 12px;
				font-size: 15px;
				line-height: 1;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.15em;
				border: 2px solid #111;
				border-bottom: 0;
				border-radius: 18px 18px 0 0;
			}

			.flight-row {
				padding: 12px;
				font-size: 17px;
				line-height: 1.1;
				font-weight: 600;
				border-left: 2px solid #111;
				border-right: 2px solid #111;
				border-bottom: 2px solid #111;
			}

			.flight-row--even {
				background: #faf8f4;
			}

			.flight-footer {
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

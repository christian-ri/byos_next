import type { ParcelRecipeData } from "@/app/(app)/recipes/screens/parcel/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "parcel";
export const title = "Parcel";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

function renderDelivery(delivery: ParcelRecipeData["deliveries"][number]) {
	return `
		<article class="item parcel-delivery">
			<div class="parcel-status">
				<div class="meta">Status</div>
				<div class="parcel-status__value">${escapeHtml(delivery.status)}</div>
			</div>
			<div class="parcel-copy">
				<div class="parcel-copy__title">${escapeHtml(delivery.title)}</div>
				<div class="description">${escapeHtml(truncateText(delivery.latest, 82))}</div>
			</div>
			<div class="parcel-eta">
				<div class="meta">ETA</div>
				<div class="parcel-eta__value">${escapeHtml(delivery.deliveryBy)}</div>
				<div class="footer">${escapeHtml(delivery.days)}</div>
			</div>
		</article>
	`;
}

export function renderHtml(data: ParcelRecipeData) {
	const visibleDeliveries = data.deliveries.slice(0, 5);

	const bodyHtml = `
		<section class="screen parcel-screen">
			<div class="parcel-shell">
				<header class="parcel-header">
					<div>
						<div class="meta">Parcel</div>
						<h1 class="title">Deliveries</h1>
						<div class="description">${escapeHtml(data.filterMode)} · ${escapeHtml(data.style)}</div>
					</div>
					<div class="parcel-header__aside">
						<div class="footer">Updated ${escapeHtml(data.updatedAt)}</div>
						<div class="meta">${escapeHtml(String(visibleDeliveries.length))} packages shown</div>
					</div>
				</header>
				<section class="parcel-list">
					${visibleDeliveries.map((delivery) => renderDelivery(delivery)).join("")}
				</section>
				<footer class="parcel-footer">
					<div class="description">${escapeHtml(
						data.error || data.note || "Parcel external API import.",
					)}</div>
					<div class="meta">api.parcel.app</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.parcel-screen {
				padding: 20px;
				background: #f4f2ec;
			}

			.parcel-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: #fff;
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 14px;
			}

			.parcel-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
				border-bottom: 2px solid #111;
				padding-bottom: 10px;
			}

			.parcel-header__aside {
				display: grid;
				justify-items: end;
				gap: 8px;
				text-align: right;
			}

			.parcel-list {
				display: grid;
				gap: 10px;
				min-height: 0;
			}

			.parcel-delivery {
				border: 2px solid #111;
				background: #fbfaf8;
				display: grid;
				grid-template-columns: 160px 1fr 124px;
				gap: 14px;
				align-items: center;
			}

			.parcel-status {
				padding-right: 12px;
				border-right: 2px solid #111;
				display: grid;
				gap: 6px;
			}

			.parcel-status__value,
			.parcel-eta__value {
				font-size: 24px;
				line-height: 1.05;
				font-weight: 800;
			}

			.parcel-copy {
				display: grid;
				gap: 8px;
			}

			.parcel-copy__title {
				font-size: 28px;
				line-height: 1.02;
				font-weight: 800;
				letter-spacing: -0.03em;
			}

			.parcel-eta {
				display: grid;
				justify-items: end;
				gap: 6px;
				text-align: right;
			}

			.parcel-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 12px;
				border-top: 2px solid #111;
				padding-top: 10px;
			}

			.parcel-footer .description {
				font-size: 14px;
			}
		`,
	});
}

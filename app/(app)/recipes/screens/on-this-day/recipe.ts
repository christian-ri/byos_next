import type { OnThisDayRecipeData } from "@/app/(app)/recipes/screens/on-this-day/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "on-this-day";
export const title = "On This Day";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

function renderItem(
	item: OnThisDayRecipeData["items"][number],
	index: number,
	mode: OnThisDayRecipeData["mode"],
	showYearLarge: boolean,
) {
	return `
		<article class="item otd-item ${mode === "highlight" ? "otd-item--highlight" : ""}">
			<div class="otd-item__year ${showYearLarge ? "otd-item__year--large" : ""}">${escapeHtml(item.year)}</div>
			<div class="otd-item__copy">
				<div class="otd-item__text">${escapeHtml(
					truncateText(item.text, mode === "highlight" ? 180 : 110),
				)}</div>
				<div class="meta">${escapeHtml(item.context || `Entry ${index + 1}`)}</div>
			</div>
		</article>
	`;
}

export function renderHtml(data: OnThisDayRecipeData) {
	const visibleItems = data.items.slice(0, data.mode === "top3" ? 3 : 1);

	const bodyHtml = `
		<section class="screen otd-screen">
			<div class="otd-shell">
				<header class="otd-header">
					<div>
						<div class="meta">${escapeHtml(data.title)}</div>
						<h1 class="title">${escapeHtml(data.dateLabel)}</h1>
					</div>
					<div class="otd-header__aside">
						<div class="otd-mode">${escapeHtml(
							data.mode === "top3" ? "Top 3" : "Highlight",
						)}</div>
						<div class="footer">Updated ${escapeHtml(data.updatedAt)}</div>
					</div>
				</header>
				<section class="otd-items">
					${visibleItems
						.map((item, index) =>
							renderItem(item, index, data.mode, data.showYearLarge),
						)
						.join("")}
				</section>
				<footer class="otd-footer">
					<div class="meta">${escapeHtml(
						data.note || "Historical context from today's Wikimedia feed.",
					)}</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.otd-screen {
				padding: 22px;
				background: #f3f0e8;
			}

			.otd-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fbfaf7 0%, #f0ece3 100%);
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 14px;
			}

			.otd-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
			}

			.otd-header__aside {
				display: grid;
				justify-items: end;
				gap: 8px;
				text-align: right;
			}

			.otd-mode {
				font-size: 18px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.otd-items {
				display: grid;
				grid-template-rows: repeat(${data.mode === "top3" ? 3 : 1}, 1fr);
				gap: 10px;
				min-height: 0;
			}

			.otd-item {
				background: #fff;
				display: grid;
				grid-template-columns: ${data.showYearLarge ? "118px" : "82px"} 1fr;
				gap: 16px;
				align-items: start;
			}

			.otd-item--highlight {
				padding-top: 18px;
				padding-bottom: 18px;
			}

			.otd-item__year {
				font-size: ${data.showYearLarge ? "34px" : "22px"};
				line-height: 0.95;
				font-weight: 800;
				letter-spacing: -0.05em;
			}

			.otd-item__year--large {
				font-size: ${data.mode === "highlight" ? "44px" : "36px"};
			}

			.otd-item__copy {
				display: grid;
				gap: 10px;
			}

			.otd-item__text {
				font-size: ${data.mode === "highlight" ? "20px" : "17px"};
				line-height: 1.22;
				font-weight: 700;
			}

			.otd-footer {
				border-top: 2px solid #111;
				padding-top: 10px;
			}
		`,
	});
}

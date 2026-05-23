import type { VercelOverviewRecipeData } from "@/app/(app)/recipes/screens/vercel-overview/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "vercel-overview";
export const title = "Vercel Overview";
export const renderer = "chromium";

export { getData };

function shorten(value: string, max: number) {
	return value.length > max
		? `${value.slice(0, Math.max(1, max - 3))}...`
		: value;
}

function statusFill(status: VercelOverviewRecipeData["globalStatus"]) {
	if (status === "error") return "#111";
	if (status === "warning") return "#888";
	return "#fff";
}

function metricCard(metric: VercelOverviewRecipeData["metrics"][number]) {
	return `<div class="vercel-metric-card"><div class="vercel-metric-card__label">${escapeHtml(metric.label)}</div><div class="vercel-metric-card__value">${escapeHtml(metric.value)}</div><div class="vercel-metric-card__secondary">${escapeHtml(metric.secondary || "")}</div></div>`;
}

export function renderHtml(data: VercelOverviewRecipeData) {
	const bodyHtml = `
		<section class="screen vercel-screen">
			<div class="vercel-shell">
				<header class="vercel-header">
					<div class="vercel-header__brand"><div class="vercel-mark"></div><h1 class="vercel-title">${escapeHtml(data.title)}</h1></div>
					<div class="vercel-header__updated">Last updated ${escapeHtml(data.updatedAt)}</div>
					<div class="vercel-header__status"><div class="vercel-header__status-dot" style="background:${statusFill(data.globalStatus)}"></div><div class="description">${escapeHtml(data.globalStatusLabel)}</div></div>
				</header>
				<section class="vercel-kpis">${data.metrics.map((metric) => metricCard(metric)).join("")}</section>
				<section class="vercel-main">
					<div class="vercel-panel vercel-panel--deployments">
						<div class="vercel-panel__title">Latest Deployments</div>
						<div class="vercel-table vercel-table--deployments vercel-table__head"><div>Project</div><div>Branch</div><div>Status</div><div>Time</div><div>Dur.</div></div>
						${data.latestDeployments
							.map(
								(row, index, items) =>
									`<div class="vercel-table vercel-table--deployments vercel-table__row ${index === items.length - 1 ? "vercel-table__row--last" : ""}"><div>${escapeHtml(shorten(row.project, 12))}</div><div>${escapeHtml(shorten(row.branch, 9))}</div><div>${escapeHtml(shorten(row.status, 9))}</div><div>${escapeHtml(row.time)}</div><div>${escapeHtml(shorten(row.duration, 5))}</div></div>`,
							)
							.join("")}
					</div>
					<div class="vercel-panel vercel-panel--production">
						<div class="vercel-panel__title">Current Production</div>
						<div class="vercel-production-list">
							${data.currentProduction
								.slice(0, 3)
								.map(
									(row, index, items) =>
										`<div class="vercel-production-row ${index === items.length - 1 ? "vercel-production-row--last" : ""}"><div class="vercel-production-row__main"><div class="description"><strong>${escapeHtml(shorten(row.project, 18))}</strong></div><div class="footer">${escapeHtml(shorten(row.domain, 44))}</div></div><div class="vercel-production-row__side"><div class="description">${escapeHtml(shorten(row.age, 8))}</div><div class="footer">${escapeHtml(shorten(row.sha, 10))}</div></div></div>`,
								)
								.join("")}
							${data.note && data.currentProduction.length === 0 ? `<div class="footer">${escapeHtml(data.note)}</div>` : ""}
						</div>
					</div>
				</section>
				<section class="vercel-footer-cards">
					${data.footer
						.map(
							(metric, index) =>
								`<div class="vercel-footer-card ${index < data.footer.length - 1 ? "vercel-footer-card--divider" : ""}"><div class="vercel-footer-card__label">${escapeHtml(metric.label)}</div><div class="vercel-footer-card__value">${escapeHtml(metric.value)}</div></div>`,
						)
						.join("")}
				</section>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.vercel-screen { padding: 10px; background: #f4f2ef; }
			.vercel-shell { height: 100%; display: grid; grid-template-rows: 46px auto 1fr 58px; gap: 8px; }
			.vercel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; }
			.vercel-header__brand, .vercel-header__status { display: flex; align-items: center; gap: 10px; }
			.vercel-header__brand { width: 250px; }
			.vercel-header__updated { width: 200px; text-align: center; font-size: 16px; color: #444; line-height: 1.15; }
			.vercel-header__status { width: 240px; justify-content: flex-end; }
			.vercel-mark { width: 28px; height: 24px; background: #111; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
			.vercel-title { margin: 0; font-size: 28px; line-height: 1; font-weight: 800; }
			.vercel-header__status-dot { width: 18px; height: 18px; border-radius: 9px; border: 2px solid #111; }
			.vercel-kpis { display: flex; gap: 10px; }
			.vercel-metric-card { width: 118px; height: 78px; border: 2px solid #111; border-radius: 12px; background: #fff; padding: 8px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
			.vercel-metric-card__label { font-size: 15px; line-height: 1; font-weight: 700; }
			.vercel-metric-card__value { font-size: 30px; line-height: 0.9; font-weight: 800; }
			.vercel-metric-card__secondary { font-size: 14px; line-height: 1.05; color: #444; }
			.vercel-main { display: flex; gap: 12px; }
			.vercel-panel { height: 206px; border: 2px solid #111; border-radius: 12px; background: #fff; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; }
			.vercel-panel--deployments { width: 474px; }
			.vercel-panel--production { width: 280px; }
			.vercel-panel__title { font-size: 20px; line-height: 1; font-weight: 700; margin-bottom: 8px; }
			.vercel-table { display: grid; align-items: center; }
			.vercel-table--deployments { grid-template-columns: 132px 86px 104px 64px 56px; }
			.vercel-table__head { padding-bottom: 6px; border-bottom: 2px solid #111; font-size: 16px; line-height: 1; font-weight: 700; }
			.vercel-table__row { height: 24px; border-bottom: 1px solid #bdbdbd; font-size: 15px; line-height: 1; }
			.vercel-table__row--last { border-bottom: none; }
			.vercel-production-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
			.vercel-production-row { display: flex; justify-content: space-between; gap: 10px; padding-bottom: 6px; border-bottom: 1px solid #bdbdbd; }
			.vercel-production-row--last { border-bottom: none; }
			.vercel-production-row__main { width: 168px; display: grid; gap: 3px; min-width: 0; }
			.vercel-production-row__main .footer { font-size: 12px; line-height: 1.15; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
			.vercel-production-row__side { width: 72px; display: grid; justify-items: end; gap: 3px; align-content: start; }
			.vercel-production-row__side .footer { font-size: 12px; line-height: 1.1; }
			.vercel-production-row__side .description { font-size: 16px; line-height: 1; }
			.vercel-footer-cards { height: 58px; border: 2px solid #111; border-radius: 12px; background: #fff; display: flex; align-items: center; }
			.vercel-footer-card { width: 187px; height: 60px; padding: 0 12px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
			.vercel-footer-card--divider { border-right: 2px solid #111; }
			.vercel-footer-card__label { font-size: 14px; line-height: 1; color: #444; }
			.vercel-footer-card__value { font-size: 24px; line-height: 0.95; font-weight: 800; }
			.vercel-metric-card:nth-child(5) .vercel-metric-card__value { font-size: 24px; }
			.vercel-metric-card:nth-child(5) .vercel-metric-card__secondary { font-size: 12px; }
		`,
	});
}

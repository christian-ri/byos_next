import { githubMonitorDisplayStrings } from "@/lib/github-monitor/service";
import type { GitHubMonitorData } from "@/lib/github-monitor/types";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData from "./getData";

export const id = "github-monitor";
export const title = "GitHub Monitor";
export const renderer = "chromium";

export { getData };

function gitHubLogoSvg() {
	return `
		<svg width="28" height="28" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)" fill="#111"/>
		</svg>
	`;
}

function shorten(value: string, max: number) {
	return value.length > max
		? `${value.slice(0, Math.max(1, max - 3))}...`
		: value;
}

function compactReleaseLabel(value: string | null) {
	if (!value) return "n/a";
	const parts = value.trim().split(/\s+/);
	return shorten(parts[parts.length - 1] || value, 12);
}

function statusFill(level: GitHubMonitorData["status"]["level"]) {
	if (level === "error") return "#111";
	if (level === "warning") return "#888";
	return "#fff";
}

function metricCards(data: GitHubMonitorData) {
	return [
		{
			label: "REPOS",
			value: String(data.metrics.repositories),
			secondary: data.meta.owner,
		},
		{
			label: "PRS",
			value: String(data.metrics.openPullRequests),
			secondary: "offen",
		},
		{
			label: "ISSUES",
			value: String(data.metrics.openIssues),
			secondary: "offen",
		},
		{
			label: "ACTIONS",
			value:
				data.metrics.actionsSuccessRate7d === null
					? "n/a"
					: `${data.metrics.actionsSuccessRate7d}%`,
			secondary: "7 Tage",
		},
		{
			label: "SICHERHEIT",
			value:
				data.metrics.securityAlerts === null
					? "n/a"
					: String(data.metrics.securityAlerts),
			secondary:
				data.metrics.criticalSecurityAlerts === null
					? "n/a"
					: `${data.metrics.criticalSecurityAlerts} kritisch`,
		},
		{
			label: "LETZTER COMMIT",
			value: data.metrics.latestCommitAge || "n/a",
			secondary: "aktuell",
		},
	];
}

function footerCards(data: GitHubMonitorData) {
	return [
		{
			label: "AKTIVE BRANCHES",
			value:
				data.footer.activeBranches === null
					? "n/a"
					: String(data.footer.activeBranches),
			secondary: data.meta.selectedRepositories.length > 1 ? "gesamt" : "repo",
		},
		{
			label: "RELEASES",
			value: String(data.footer.releases30d),
			secondary: compactReleaseLabel(data.footer.latestRelease),
		},
		{
			label: "MITARBEITER",
			value:
				data.footer.contributors === null
					? "n/a"
					: String(data.footer.contributors),
			secondary: data.meta.owner,
		},
		{
			label: "COMMITS",
			value:
				data.footer.commits7d === null ? "n/a" : String(data.footer.commits7d),
			secondary: "7 Tage",
		},
		{
			label: "SECRETS",
			value:
				data.footer.secretScanningAlerts === null
					? "n/a"
					: String(data.footer.secretScanningAlerts),
			secondary: data.status.label,
		},
	];
}

function renderMetricCard(card: {
	label: string;
	value: string;
	secondary: string;
}) {
	return `
		<div class="gh-metric-card">
			<div class="gh-metric-card__label">${escapeHtml(card.label)}</div>
			<div class="gh-metric-card__value">${escapeHtml(card.value)}</div>
			<div class="gh-metric-card__secondary">${escapeHtml(card.secondary)}</div>
		</div>
	`;
}

export function renderHtml(data: GitHubMonitorData) {
	const display = githubMonitorDisplayStrings(data, data.meta.timezone);
	const kpis = metricCards(data);
	const footer = footerCards(data);

	const bodyHtml = `
		<section class="screen gh-screen">
			<div class="gh-shell">
				<header class="gh-header">
					<div class="gh-header__brand">
						<div class="gh-logo">${gitHubLogoSvg()}</div>
						<h1 class="gh-title">GitHub</h1>
					</div>
					<div class="gh-header__time">
						<div class="gh-time">${escapeHtml(display.currentTime)}</div>
						<div class="footer">${escapeHtml(display.updatedLabel)}</div>
					</div>
					<div class="gh-header__status">
						<div class="gh-header__status-dot" style="background:${statusFill(data.status.level)}"></div>
						<div class="description">${escapeHtml(data.status.label)}</div>
					</div>
				</header>
				<section class="gh-kpis">${kpis.map((card) => renderMetricCard(card)).join("")}</section>
				<section class="gh-main">
					<div class="gh-panel gh-workflows">
						<div class="gh-panel__title">Aktuelle Workflows</div>
						<div class="gh-table gh-table--workflow gh-table__head"><div>Repo</div><div>Workflow</div><div>Status</div><div>Zweig</div><div>Dauer</div><div>Alt</div></div>
						${data.workflowRuns
							.slice(0, 5)
							.map(
								(run, index, items) => `
									<div class="gh-table gh-table--workflow gh-table__row ${index === items.length - 1 ? "gh-table__row--last" : ""}">
										<div>${escapeHtml(shorten(run.repository, 12))}</div>
										<div>${escapeHtml(shorten(run.workflow, 12))}</div>
										<div>${escapeHtml(run.status)}</div>
										<div>${escapeHtml(run.branch)}</div>
										<div>${escapeHtml(run.duration || "n/a")}</div>
										<div>${escapeHtml(run.age)}</div>
									</div>`,
							)
							.join("")}
					</div>
					<div class="gh-panel gh-health">
						<div class="gh-panel__title">Repo Health</div>
						<div class="gh-table gh-table--health gh-table__head"><div>Repo</div><div>PR</div><div>Iss</div><div>Last</div><div>Stat</div></div>
						${data.repositoryHealth
							.slice(0, 6)
							.map(
								(repo, index, items) => `
									<div class="gh-table gh-table--health gh-table__row ${index === items.length - 1 ? "gh-table__row--last" : ""}">
										<div>${escapeHtml(shorten(repo.repository, 12))}</div>
										<div>${escapeHtml(String(repo.openPullRequests))}</div>
										<div>${escapeHtml(String(repo.openIssues))}</div>
										<div>${escapeHtml(repo.latestCommitAge || "n/a")}</div>
										<div>${escapeHtml(repo.status)}</div>
									</div>`,
							)
							.join("")}
					</div>
				</section>
				<section class="gh-footer-cards">${footer.map((card) => renderMetricCard(card)).join("")}</section>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.gh-screen { padding: 14px; background: #f4f2ef; }
			.gh-shell { height: 100%; display: grid; grid-template-rows: auto auto 1fr auto; gap: 8px; color: #111; }
			.gh-header { height: 54px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 8px; }
			.gh-header__brand, .gh-header__status { width: 230px; display: flex; align-items: center; gap: 10px; }
			.gh-header__time { width: 240px; display: grid; justify-items: center; gap: 2px; }
			.gh-logo { width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
			.gh-title { margin: 0; font-size: 34px; line-height: 1; font-weight: 800; }
			.gh-time { font-size: 36px; line-height: 0.95; font-weight: 800; }
			.gh-header__status { justify-content: flex-end; }
			.gh-header__status-dot { width: 18px; height: 18px; border-radius: 9px; border: 2px solid #111; }
			.gh-kpis, .gh-footer-cards { display: flex; gap: 8px; }
			.gh-metric-card { width: 122px; height: 92px; border: 2px solid #111; border-radius: 6px; background: #fff; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
			.gh-footer-cards .gh-metric-card { width: 149px; height: 78px; }
			.gh-footer-cards .gh-metric-card:last-child { width: 148px; }
			.gh-metric-card__label { font-size: 14px; line-height: 1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
			.gh-metric-card__value { font-size: 36px; line-height: 0.9; font-weight: 800; }
			.gh-footer-cards .gh-metric-card__value { font-size: 30px; }
			.gh-metric-card__secondary { font-size: 13px; line-height: 1.05; color: #444; }
			.gh-main { display: flex; gap: 8px; }
			.gh-panel { height: 204px; border: 2px solid #111; border-radius: 6px; background: #fff; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; }
			.gh-workflows { width: 474px; }
			.gh-health { width: 290px; }
			.gh-panel__title { font-size: 22px; line-height: 1; font-weight: 700; margin-bottom: 8px; }
			.gh-table { display: grid; align-items: center; }
			.gh-table--workflow { grid-template-columns: 102px 98px 62px 68px 64px 34px; }
			.gh-table--health { grid-template-columns: 112px 26px 30px 42px 44px; }
			.gh-table__head { padding-bottom: 6px; border-bottom: 2px solid #111; font-size: 16px; line-height: 1; font-weight: 700; }
			.gh-table__row { height: 24px; border-bottom: 1px solid #bdbdbd; font-size: 16px; line-height: 1; }
			.gh-table--health.gh-table__row { height: 20px; }
			.gh-table__row--last { border-bottom: none; }
		`,
	});
}

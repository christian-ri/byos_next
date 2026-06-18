import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData, {
	type WorldCup2026Data,
	type WorldCupGroup,
	type WorldCupMatch,
	type WorldCupStanding,
} from "./getData";

export const id = "fifa-world-cup-2026";
export const title = "FIFA World Cup 2026";
export const renderer = "chromium";

export { getData };

function trophyIcon() {
	return `<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6h14v8c0 7-3 12-7 14-4-2-7-7-7-14V6Z"></path><path d="M17 10H8c0 8 3 13 10 14"></path><path d="M31 10h9c0 8-3 13-10 14"></path><path d="M24 28v8"></path><path d="M16 42h16"></path><path d="M20 36h8"></path></svg>`;
}

function shortName(name: string, max = 18) {
	return name.length > max ? `${name.slice(0, max - 1)}.` : name;
}

function signed(value: number) {
	return value > 0 ? `+${value}` : String(value);
}

function renderStandingRow(team: WorldCupStanding, index: number) {
	return `
		<div class="wc-team-row ${index < 2 ? "wc-team-row--qualify" : ""}">
			<div class="wc-team-rank">${team.rank}</div>
			<div class="wc-team-code">${escapeHtml(team.code)}</div>
			<div class="wc-team-mp">${team.mp}</div>
			<div class="wc-team-gd">${escapeHtml(signed(team.gd))}</div>
			<div class="wc-team-pts">${team.pts}</div>
		</div>
	`;
}

function renderGroup(group: WorldCupGroup) {
	return `
		<section class="wc-group">
			<div class="wc-group__head">
				<div class="wc-group__label">GROUP ${escapeHtml(group.group)}</div>
				<div class="wc-group__cols"><span>P</span><span>GD</span><span>PTS</span></div>
			</div>
			<div class="wc-group__teams">
				${group.teams.map((team, index) => renderStandingRow(team, index)).join("")}
			</div>
		</section>
	`;
}

function renderMatchCard(
	label: string,
	match: WorldCupMatch,
	variant: "next" | "focus",
) {
	const liveClass = match.isLive ? "wc-match--live" : "";
	return `
		<section class="wc-match wc-match--${variant} ${liveClass}">
			<div class="wc-match__top">
				<div>
					<div class="wc-match__eyebrow">${escapeHtml(label)}</div>
					<div class="wc-match__stage">${escapeHtml(match.stage)}</div>
				</div>
				<div class="wc-match__status">${escapeHtml(match.statusLabel)}</div>
			</div>
			<div class="wc-scoreline">
				<div class="wc-side wc-side--home">
					<div class="wc-side__code">${escapeHtml(match.homeCode)}</div>
					<div class="wc-side__name">${escapeHtml(shortName(match.homeName))}</div>
				</div>
				<div class="wc-score">${escapeHtml(match.scoreLabel)}</div>
				<div class="wc-side wc-side--away">
					<div class="wc-side__code">${escapeHtml(match.awayCode)}</div>
					<div class="wc-side__name">${escapeHtml(shortName(match.awayName))}</div>
				</div>
			</div>
			<div class="wc-match__meta">
				<span>${escapeHtml(match.dateLabel)}</span>
				<span>${escapeHtml(match.timeLabel)}</span>
				<span>M${escapeHtml(match.id)}</span>
			</div>
		</section>
	`;
}

export function renderHtml(data: WorldCup2026Data) {
	const bodyHtml = `
		<section class="screen wc-screen">
			<div class="wc-shell">
				<header class="wc-header">
					<div class="wc-brand">
						<div class="wc-brand__icon">${trophyIcon()}</div>
						<div>
							<h1>${escapeHtml(data.title)}</h1>
							<div class="wc-subtitle">${escapeHtml(data.subtitle)}</div>
						</div>
					</div>
					<div class="wc-header__center">
						<div class="wc-pill">12 GROUPS</div>
						<div class="wc-pill">48 TEAMS</div>
						<div class="wc-pill">104 MATCHES</div>
					</div>
					<div class="wc-header__right">
						<div class="wc-updated">UPDATED</div>
						<div class="wc-updated__time">${escapeHtml(data.updatedAt)}</div>
					</div>
				</header>
				<main class="wc-main">
					<section class="wc-groups">
						${data.groups.map(renderGroup).join("")}
					</section>
					<aside class="wc-matches">
						${renderMatchCard(data.focusLabel.toUpperCase(), data.focusMatch, "focus")}
						${renderMatchCard("NEXT MATCH", data.nextMatch, "next")}
					</aside>
				</main>
				<footer class="wc-footer">
					<div>FIFA WORLD CUP 2026</div>
					<div>GROUP STANDINGS: RANKED BY POINTS, GOAL DIFFERENCE</div>
					<div>WORLD CUP WITH LOVE</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.wc-screen {
				background: #fff;
				color: #111;
				font-family: "IBM Plex Sans Condensed", "Aptos Narrow", "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
			}

			.wc-shell {
				width: 800px;
				height: 480px;
				padding: 14px 16px 12px;
				display: grid;
				grid-template-rows: 50px 1fr 18px;
				gap: 8px;
				overflow: hidden;
			}

			.wc-header {
				display: grid;
				grid-template-columns: 360px 1fr 140px;
				align-items: center;
				border-bottom: 2px solid #111;
				padding-bottom: 8px;
			}

			.wc-brand {
				display: flex;
				align-items: center;
				gap: 9px;
			}

			.wc-brand__icon {
				width: 34px;
				height: 34px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.wc-brand h1 {
				margin: 0;
				font-size: 24px;
				line-height: 0.95;
				font-weight: 800;
				letter-spacing: 0;
				white-space: nowrap;
			}

			.wc-subtitle,
			.wc-updated,
			.wc-footer,
			.wc-pill,
			.wc-match__eyebrow,
			.wc-match__status {
				font-size: 10px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.wc-header__center {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 5px;
			}

			.wc-pill {
				border: 1px solid #111;
				padding: 5px 6px 4px;
				height: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				white-space: nowrap;
			}

			.wc-header__right {
				display: grid;
				justify-items: end;
				gap: 4px;
			}

			.wc-updated__time {
				font-size: 15px;
				line-height: 1;
				font-weight: 800;
			}

			.wc-main {
				min-height: 0;
				display: grid;
				grid-template-columns: 540px 218px;
				gap: 10px;
			}

			.wc-groups {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				grid-template-rows: repeat(4, 1fr);
				gap: 6px;
				min-height: 0;
			}

			.wc-group {
				border: 2px solid #111;
				border-radius: 6px;
				background: #fff;
				overflow: hidden;
				display: grid;
				grid-template-rows: 22px 1fr;
			}

			.wc-group__head {
				display: grid;
				grid-template-columns: 1fr 66px;
				align-items: center;
				background: #111;
				color: #fff;
				padding: 0 6px;
			}

			.wc-group__label {
				font-size: 14px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.04em;
			}

			.wc-group__cols {
				display: grid;
				grid-template-columns: 18px 22px 26px;
				text-align: right;
				font-size: 9px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.03em;
			}

			.wc-group__teams {
				display: grid;
				grid-template-rows: repeat(4, 1fr);
			}

			.wc-team-row {
				display: grid;
				grid-template-columns: 15px 1fr 18px 22px 26px;
				align-items: center;
				border-bottom: 1px solid #c8c8c8;
				padding: 0 6px 0 5px;
				min-height: 0;
				font-size: 14px;
				line-height: 1;
				font-weight: 700;
			}

			.wc-team-row:last-child {
				border-bottom: 0;
			}

			.wc-team-row--qualify .wc-team-rank {
				background: #111;
				color: #fff;
			}

			.wc-team-rank {
				width: 12px;
				height: 12px;
				border: 1px solid #111;
				border-radius: 6px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 8px;
				font-weight: 800;
			}

			.wc-team-code {
				font-size: 15px;
				font-weight: 900;
				letter-spacing: 0.02em;
			}

			.wc-team-mp,
			.wc-team-gd,
			.wc-team-pts {
				text-align: right;
				font-variant-numeric: tabular-nums;
			}

			.wc-team-pts {
				font-weight: 900;
			}

			.wc-matches {
				display: grid;
				grid-template-rows: repeat(2, 1fr);
				gap: 7px;
				min-height: 0;
			}

			.wc-match {
				border: 2px solid #111;
				border-radius: 6px;
				background: #fff;
				padding: 10px;
				overflow: hidden;
				display: grid;
				grid-template-rows: auto 1fr auto;
			}

			.wc-match--live {
				background: #111;
				color: #fff;
			}

			.wc-match__top {
				display: flex;
				align-items: flex-start;
				justify-content: space-between;
				gap: 8px;
				border-bottom: 2px solid currentColor;
				padding-bottom: 8px;
				margin-bottom: 10px;
			}

			.wc-match__stage {
				margin-top: 4px;
				font-size: 21px;
				line-height: 1;
				font-weight: 900;
			}

			.wc-match__status {
				border: 1px solid currentColor;
				padding: 4px 5px;
				line-height: 1;
				font-weight: 900;
				text-transform: uppercase;
				white-space: nowrap;
			}

			.wc-scoreline {
				display: grid;
				grid-template-columns: 1fr 64px 1fr;
				align-items: center;
				gap: 5px;
				min-height: 92px;
			}

			.wc-side {
				min-width: 0;
			}

			.wc-side--away {
				text-align: right;
			}

			.wc-side__code {
				font-size: 31px;
				line-height: 0.95;
				font-weight: 900;
				letter-spacing: 0.02em;
			}

			.wc-side__name {
				margin-top: 5px;
				font-size: 13px;
				line-height: 1.05;
				font-weight: 700;
			}

			.wc-score {
				height: 50px;
				border: 2px solid currentColor;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 23px;
				line-height: 1;
				font-weight: 900;
				font-variant-numeric: tabular-nums;
			}

			.wc-match__meta {
				display: grid;
				grid-template-columns: 1fr 1fr 1fr;
				gap: 4px;
				border-top: 1px solid currentColor;
				padding-top: 7px;
				font-size: 12px;
				line-height: 1;
				font-weight: 800;
				text-transform: uppercase;
			}

			.wc-match__meta span:nth-child(2) {
				text-align: center;
			}

			.wc-match__meta span:nth-child(3) {
				text-align: right;
			}

			.wc-footer {
				display: grid;
				grid-template-columns: 1fr 1.4fr 1fr;
				align-items: center;
				border-top: 1px solid #111;
				padding-top: 6px;
			}

			.wc-footer div:nth-child(2) {
				text-align: center;
			}

			.wc-footer div:nth-child(3) {
				text-align: right;
			}
		`,
	});
}

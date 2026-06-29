import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData, {
	type BracketMatch,
	type WorldCupBracketData,
} from "./getData";

export const id = "fifa-world-cup-2026-bracket";
export const title = "FIFA World Cup 2026 Bracket";
export const renderer = "chromium";

export { getData };

type Box = {
	x: number;
	y: number;
	w: number;
	h: number;
};

type Side = "left" | "right";

const MAIN_WIDTH = 800;
const MAIN_HEIGHT = 340;

const BOXES = {
	r32: { w: 104, h: 30 },
	r16: { w: 78, h: 26 },
	qf: { w: 56, h: 24 },
	sf: { w: 156, h: 36 },
	final: { w: 118, h: 28 },
	third: { w: 118, h: 28 },
} as const;

function centerY(box: Box) {
	return box.y + box.h / 2;
}

function centerX(box: Box) {
	return box.x + box.w / 2;
}

function buildBracketGeometry() {
	const leftR32 = [46, 82, 118, 154, 190, 226, 262, 298].map((y) => ({
		x: 18,
		y,
		w: BOXES.r32.w,
		h: BOXES.r32.h,
	}));
	const rightR32 = leftR32.map((box) => ({
		...box,
		x: 678,
	}));

	const leftR16 = [66, 138, 210, 282].map((y) => ({
		x: 150,
		y,
		w: BOXES.r16.w,
		h: BOXES.r16.h,
	}));
	const rightR16 = leftR16.map((box) => ({
		...box,
		x: 572,
	}));

	const leftQf = [103, 247].map((y) => ({
		x: 254,
		y,
		w: BOXES.qf.w,
		h: BOXES.qf.h,
	}));
	const rightQf = leftQf.map((box) => ({
		...box,
		x: 490,
	}));

	const semiFinals = {
		x: 322,
		y: 144,
		w: BOXES.sf.w,
		h: BOXES.sf.h,
	};

	const final = {
		x: 341,
		y: 208,
		w: BOXES.final.w,
		h: BOXES.final.h,
	};

	const third = {
		x: 341,
		y: 282,
		w: BOXES.third.w,
		h: BOXES.third.h,
	};

	return { leftR32, rightR32, leftR16, rightR16, leftQf, rightQf, semiFinals, final, third };
}

function trophyIcon(size = 18) {
	return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter"><path d="M8 3h8v4c0 4-1.8 6.9-4 8-2.2-1.1-4-4-4-8V3Z"></path><path d="M8 5H4v2c0 2.8 1.6 4.9 4 5.7"></path><path d="M16 5h4v2c0 2.8-1.6 4.9-4 5.7"></path><path d="M12 15v4"></path><path d="M8 22h8"></path><path d="M9.5 19.5h5"></path></svg>`;
}

function calendarIcon(size = 16) {
	return `<svg viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter"><rect x="2.5" y="4.5" width="15" height="13" rx="1"></rect><path d="M6 2.5v4M14 2.5v4M2.5 8.5h15"></path></svg>`;
}

function pinIcon(size = 16) {
	return `<svg viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter"><path d="M10 17c3.6-4.2 5.4-7 5.4-9.2A5.4 5.4 0 1 0 4.6 7.8C4.6 10 6.4 12.8 10 17Z"></path><circle cx="10" cy="7.8" r="1.8"></circle></svg>`;
}

function connectorBetween(from: Box, to: Box, side: Side) {
	const startX = side === "left" ? from.x + from.w : from.x;
	const endX = side === "left" ? to.x : to.x + to.w;
	const elbowX = side === "left" ? startX + 12 : startX - 12;
	return `M ${startX} ${centerY(from)} L ${elbowX} ${centerY(from)} L ${elbowX} ${centerY(to)} L ${endX} ${centerY(to)}`;
}

function connectorToPoint(from: Box, targetX: number, targetY: number, side: Side) {
	const startX = side === "left" ? from.x + from.w : from.x;
	const elbowX = side === "left" ? startX + 12 : startX - 12;
	return `M ${startX} ${centerY(from)} L ${elbowX} ${centerY(from)} L ${elbowX} ${targetY} L ${targetX} ${targetY}`;
}

function connectorVertical(fromX: number, fromY: number, toY: number) {
	return `M ${fromX} ${fromY} L ${fromX} ${toY}`;
}

function fitText(value: string, fontSize: number, maxWidth: number) {
	const estimated = value.length * fontSize * 0.58;
	if (estimated <= maxWidth) {
		return { textLength: "", adjust: "" };
	}
	return {
		textLength: ` textLength="${maxWidth}"`,
		adjust: ` lengthAdjust="spacingAndGlyphs"`,
	};
}

function svgText(
	value: string,
	x: number,
	y: number,
	fontSize: number,
	maxWidth: number,
	weight: number,
	anchor: "start" | "middle" | "end" = "start",
) {
	const { textLength, adjust } = fitText(value, fontSize, maxWidth);
	return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="hanging"${textLength}${adjust}>${escapeHtml(value)}</text>`;
}

function compactMatchLabel(match: BracketMatch) {
	return match.compactLabel || `${match.home.pathLabel} / ${match.away.pathLabel}`;
}

function renderDetailedMatchCard(match: BracketMatch, box: Box, highlightMatchId: string) {
	const isHighlight = match.id === highlightMatchId;
	const borderWidth = isHighlight ? 2 : 1;
	const scoreX = box.x + box.w - 8;
	const homeFont = match.home.name.length > 22 ? 6.2 : 6.8;
	const awayFont = match.away.name.length > 22 ? 6.2 : 6.8;
	return `
		<g class="wc-card wc-card--detail">
			<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="4" ry="4" fill="#fff" stroke="#111" stroke-width="${borderWidth}" />
			${svgText(match.home.seedLabel || match.home.pathLabel, box.x + 8, box.y + 5, 6.4, 18, 700)}
			${svgText(match.home.name, box.x + 24, box.y + 5, homeFont, box.w - 38, 700)}
			${svgText(match.home.score, scoreX, box.y + 5, 6.8, 8, 700, "end")}
			<line x1="${box.x + 6}" y1="${box.y + 15}" x2="${box.x + box.w - 6}" y2="${box.y + 15}" stroke="#111" stroke-width="1" stroke-dasharray="1.2 1.8" />
			${svgText(match.away.seedLabel || match.away.pathLabel, box.x + 8, box.y + 18, 6.4, 18, 700)}
			${svgText(match.away.name, box.x + 24, box.y + 18, awayFont, box.w - 38, 700)}
			${svgText(match.away.score, scoreX, box.y + 18, 6.8, 8, 700, "end")}
		</g>
	`;
}

function renderCompactMatchCard(match: BracketMatch, box: Box, highlightMatchId: string) {
	const isHighlight = match.id === highlightMatchId;
	const label = compactMatchLabel(match);
	return `
		<g class="wc-card wc-card--compact">
			<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="4" ry="4" fill="#fff" stroke="#111" stroke-width="${isHighlight ? 2 : 1}" />
			${svgText(label, centerX(box), box.y + 8, 7.8, box.w - 12, 700, "middle")}
		</g>
	`;
}

function renderBracketColumn(
	label: string,
	matches: BracketMatch[],
	boxes: Box[],
	mode: "detail" | "compact",
	align: "left" | "center" | "right",
	highlightMatchId: string,
) {
	const labelX =
		align === "left"
			? boxes[0].x
			: align === "right"
				? boxes[0].x + boxes[0].w
				: centerX(boxes[0]);
	const labelAnchor =
		align === "left" ? "start" : align === "right" ? "end" : "middle";
	return `
		<g class="wc-column" fill="#111">
			${svgText(label, labelX, 18, 7.8, mode === "detail" ? 96 : 80, 700, labelAnchor)}
			${matches
				.map((match, index) =>
					mode === "detail"
						? renderDetailedMatchCard(match, boxes[index], highlightMatchId)
						: renderCompactMatchCard(match, boxes[index], highlightMatchId),
				)
				.join("")}
		</g>
	`;
}

function renderCenterStage(
	data: WorldCupBracketData,
	semiBox: Box,
	finalBox: Box,
	thirdBox: Box,
) {
	const leftSemiLabel = compactMatchLabel(data.left.semiFinal);
	const rightSemiLabel = compactMatchLabel(data.right.semiFinal);
	const finalLabel = compactMatchLabel(data.final);
	const thirdLabel = compactMatchLabel(data.thirdPlace);

	return `
		<g class="wc-center-stage" fill="#111">
			${svgText("SEMI FINALS", centerX(semiBox), 124, 7.8, 86, 700, "middle")}
			<rect x="${semiBox.x}" y="${semiBox.y}" width="${semiBox.w}" height="${semiBox.h}" rx="4" ry="4" fill="#fff" stroke="#111" stroke-width="1" />
			<line x1="${centerX(semiBox)}" y1="${semiBox.y + 6}" x2="${centerX(semiBox)}" y2="${semiBox.y + semiBox.h - 6}" stroke="#111" stroke-width="1" />
			${svgText(leftSemiLabel, semiBox.x + 10, semiBox.y + 12, 7.8, semiBox.w / 2 - 18, 700)}
			${svgText(rightSemiLabel, semiBox.x + semiBox.w - 10, semiBox.y + 12, 7.8, semiBox.w / 2 - 18, 700, "end")}
			${svgText("FINAL", centerX(finalBox), 191, 7.8, 40, 700, "middle")}
			<rect x="${finalBox.x}" y="${finalBox.y}" width="${finalBox.w}" height="${finalBox.h}" rx="4" ry="4" fill="#fff" stroke="#111" stroke-width="1" />
			${svgText(finalLabel, centerX(finalBox), finalBox.y + 8, 7.8, finalBox.w - 14, 700, "middle")}
			<g transform="translate(${centerX(finalBox) - 9}, 244)">${trophyIcon(18)}</g>
			<line x1="${centerX(finalBox) - 52}" y1="268" x2="${centerX(finalBox) + 52}" y2="268" stroke="#111" stroke-width="1" stroke-dasharray="1.2 1.8" />
			${svgText("3RD PLACE", centerX(thirdBox), 273, 7.8, 58, 700, "middle")}
			<rect x="${thirdBox.x}" y="${thirdBox.y}" width="${thirdBox.w}" height="${thirdBox.h}" rx="4" ry="4" fill="#fff" stroke="#111" stroke-width="1" />
			${svgText(thirdLabel, centerX(thirdBox), thirdBox.y + 8, 7.8, thirdBox.w - 14, 700, "middle")}
		</g>
	`;
}

function renderConnector(paths: string[]) {
	return `<g class="wc-connectors" fill="none" stroke="#111" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter">${paths.map((path) => `<path d="${path}" />`).join("")}</g>`;
}

function renderBracket(data: WorldCupBracketData) {
	const { leftR32, rightR32, leftR16, rightR16, leftQf, rightQf, semiFinals, final, third } =
		buildBracketGeometry();

	const connectorPaths = [
		connectorBetween(leftR32[0], leftR16[0], "left"),
		connectorBetween(leftR32[1], leftR16[0], "left"),
		connectorBetween(leftR32[2], leftR16[1], "left"),
		connectorBetween(leftR32[3], leftR16[1], "left"),
		connectorBetween(leftR32[4], leftR16[2], "left"),
		connectorBetween(leftR32[5], leftR16[2], "left"),
		connectorBetween(leftR32[6], leftR16[3], "left"),
		connectorBetween(leftR32[7], leftR16[3], "left"),
		connectorBetween(rightR32[0], rightR16[0], "right"),
		connectorBetween(rightR32[1], rightR16[0], "right"),
		connectorBetween(rightR32[2], rightR16[1], "right"),
		connectorBetween(rightR32[3], rightR16[1], "right"),
		connectorBetween(rightR32[4], rightR16[2], "right"),
		connectorBetween(rightR32[5], rightR16[2], "right"),
		connectorBetween(rightR32[6], rightR16[3], "right"),
		connectorBetween(rightR32[7], rightR16[3], "right"),
		connectorBetween(leftR16[0], leftQf[0], "left"),
		connectorBetween(leftR16[1], leftQf[0], "left"),
		connectorBetween(leftR16[2], leftQf[1], "left"),
		connectorBetween(leftR16[3], leftQf[1], "left"),
		connectorBetween(rightR16[0], rightQf[0], "right"),
		connectorBetween(rightR16[1], rightQf[0], "right"),
		connectorBetween(rightR16[2], rightQf[1], "right"),
		connectorBetween(rightR16[3], rightQf[1], "right"),
		connectorToPoint(leftQf[0], semiFinals.x, semiFinals.y + 10, "left"),
		connectorToPoint(leftQf[1], semiFinals.x, semiFinals.y + semiFinals.h - 10, "left"),
		connectorToPoint(rightQf[0], semiFinals.x + semiFinals.w, semiFinals.y + 10, "right"),
		connectorToPoint(rightQf[1], semiFinals.x + semiFinals.w, semiFinals.y + semiFinals.h - 10, "right"),
		connectorVertical(centerX(semiFinals), semiFinals.y + semiFinals.h, final.y),
	];

	return `
		<section class="wc-bracket" aria-label="Bracket">
			<svg viewBox="0 0 ${MAIN_WIDTH} ${MAIN_HEIGHT}" width="${MAIN_WIDTH}" height="${MAIN_HEIGHT}" class="wc-bracket__svg" aria-hidden="true" shape-rendering="crispEdges">
				${renderConnector(connectorPaths)}
				${renderBracketColumn("ROUND OF 32", data.left.roundOf32, leftR32, "detail", "left", data.highlightMatchId)}
				${renderBracketColumn("ROUND OF 16", data.left.roundOf16, leftR16, "compact", "left", data.highlightMatchId)}
				${renderBracketColumn("QUARTER FINALS", data.left.quarterFinals, leftQf, "compact", "center", data.highlightMatchId)}
				${renderBracketColumn("QUARTER FINALS", data.right.quarterFinals, rightQf, "compact", "center", data.highlightMatchId)}
				${renderBracketColumn("ROUND OF 16", data.right.roundOf16, rightR16, "compact", "right", data.highlightMatchId)}
				${renderBracketColumn("ROUND OF 32", data.right.roundOf32, rightR32, "detail", "right", data.highlightMatchId)}
				${renderCenterStage(data, semiFinals, final, third)}
			</svg>
		</section>
	`;
}

function renderHeader(data: WorldCupBracketData) {
	return `
		<header class="wc-header">
			<div class="wc-header__left">
				<div class="wc-header__icon">${trophyIcon(22)}</div>
				<div>
					<div class="wc-header__title">FIFA WORLD CUP 2026</div>
					<div class="wc-header__subtitle">KNOCKOUT STAGE</div>
				</div>
			</div>
			<div class="wc-header__center">
				<div class="wc-pill">31 MATCHES</div>
				<div class="wc-pill">ROAD TO FINAL</div>
				<div class="wc-pill">LIVE</div>
			</div>
			<div class="wc-header__right">
				<div class="wc-header__updated-time">${escapeHtml(data.updatedAt)}</div>
				<div class="wc-header__updated-label">UPDATED</div>
			</div>
		</header>
	`;
}

function renderNextMatchPanel(match: BracketMatch) {
	return `
		<footer class="wc-next-panel">
			<div class="wc-next-panel__left">
				<div class="wc-next-panel__kicker">NEXT MATCH</div>
				<div class="wc-next-panel__title">${escapeHtml(`${match.home.name} vs ${match.away.name}`)}</div>
				<div class="wc-next-panel__stage">${escapeHtml(match.stageLabel.toUpperCase())}</div>
			</div>
			<div class="wc-next-panel__right">
				<div class="wc-next-panel__divider"></div>
				<div class="wc-next-panel__details">
					<div class="wc-next-panel__detail-row">
						<span class="wc-next-panel__detail-icon">${calendarIcon(16)}</span>
						<span>${escapeHtml(`${match.dateLabel.toUpperCase()}, ${match.timeLabel}`)}</span>
					</div>
					<div class="wc-next-panel__detail-row">
						<span class="wc-next-panel__detail-icon">${pinIcon(16)}</span>
						<span>${escapeHtml(match.venueFull.toUpperCase())}</span>
					</div>
					<div class="wc-next-panel__detail-sub">${escapeHtml(match.locationLabel.toUpperCase())}</div>
				</div>
			</div>
		</footer>
	`;
}

export function renderHtml(data: WorldCupBracketData) {
	const bodyHtml = `
		<section class="screen wc-screen">
			${renderHeader(data)}
			${renderBracket(data)}
			${renderNextMatchPanel(data.nextMatch)}
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.wc-screen {
				--space-4: 4px;
				--space-8: 8px;
				--border-color: #111;
				--font-size-xs: 10px;
				--font-size-sm: 12px;
				--font-size-md: 14px;
				--font-size-lg: 20px;
				--header-height: 56px;
				--main-height: 340px;
				--panel-height: 84px;
				width: 800px;
				height: 480px;
				box-sizing: border-box;
				border: 1px solid var(--border-color);
				background: #fff;
				color: #111;
				display: grid;
				grid-template-rows: var(--header-height) var(--main-height) var(--panel-height);
				font-family: "IBM Plex Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
				text-rendering: geometricPrecision;
				-webkit-font-smoothing: none;
			}

			.wc-header {
				height: 56px;
				padding: 8px 12px;
				border-bottom: 1px solid var(--border-color);
				display: grid;
				grid-template-columns: 320px 1fr 158px;
				align-items: center;
				box-sizing: border-box;
			}

			.wc-header__left {
				display: flex;
				align-items: flex-start;
				gap: 8px;
			}

			.wc-header__icon {
				width: 24px;
				height: 24px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				margin-top: 2px;
			}

			.wc-header__title {
				font-size: 20px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.06em;
				text-transform: uppercase;
			}

			.wc-header__subtitle,
			.wc-header__updated-label,
			.wc-next-panel__kicker,
			.wc-next-panel__stage,
			.wc-pill {
				font-size: 10px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.wc-header__subtitle {
				margin-top: 4px;
			}

			.wc-header__center {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 12px;
			}

			.wc-pill {
				height: 26px;
				padding: 0 16px;
				border: 1px solid var(--border-color);
				display: flex;
				align-items: center;
				justify-content: center;
				white-space: nowrap;
				box-sizing: border-box;
			}

			.wc-header__right {
				display: grid;
				justify-items: end;
				gap: 5px;
			}

			.wc-header__updated-time {
				font-size: 12px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.04em;
				text-transform: uppercase;
			}

			.wc-bracket {
				height: 340px;
				overflow: hidden;
			}

			.wc-bracket__svg {
				display: block;
				width: 800px;
				height: 340px;
				background: #fff;
			}

			.wc-next-panel {
				height: 84px;
				border-top: 1px solid var(--border-color);
				display: grid;
				grid-template-columns: 1fr 272px;
				box-sizing: border-box;
				padding: 10px 12px;
				align-items: stretch;
			}

			.wc-next-panel__left {
				padding-left: 18px;
				border-left: 1px solid var(--border-color);
				display: grid;
				align-content: center;
				gap: 7px;
			}

			.wc-next-panel__title {
				font-size: 18px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.01em;
			}

			.wc-next-panel__right {
				display: grid;
				grid-template-columns: 12px 1fr;
				column-gap: 14px;
				align-items: center;
				padding-left: 10px;
			}

			.wc-next-panel__divider {
				height: 58px;
				border-left: 1px dotted var(--border-color);
				justify-self: center;
			}

			.wc-next-panel__details {
				display: grid;
				gap: 7px;
				align-content: center;
			}

			.wc-next-panel__detail-row {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 11px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.05em;
				text-transform: uppercase;
			}

			.wc-next-panel__detail-sub {
				padding-left: 26px;
				font-size: 11px;
				line-height: 1;
				font-weight: 700;
				letter-spacing: 0.05em;
				text-transform: uppercase;
			}

			.wc-next-panel__detail-icon {
				width: 16px;
				height: 16px;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}
		`,
	});
}

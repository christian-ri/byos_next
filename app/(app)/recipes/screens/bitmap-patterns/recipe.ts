import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

export const id = "bitmap-patterns";
export const title = "Bitmap Patterns";
export const renderer = "chromium";

const PATTERNS = [
	{ label: "0%", density: 0 },
	{ label: "12.5%", density: 1 },
	{ label: "25%", density: 2 },
	{ label: "37.5%", density: 3 },
	{ label: "50%", density: 4 },
	{ label: "62.5%", density: 5 },
	{ label: "75%", density: 6 },
	{ label: "87.5%", density: 7 },
];

const BAYER_8X8 = [
	[0, 48, 12, 60, 3, 51, 15, 63],
	[32, 16, 44, 28, 35, 19, 47, 31],
	[8, 56, 4, 52, 11, 59, 7, 55],
	[40, 24, 36, 20, 43, 27, 39, 23],
	[2, 50, 14, 62, 1, 49, 13, 61],
	[34, 18, 46, 30, 33, 17, 45, 29],
	[10, 58, 6, 54, 9, 57, 5, 53],
	[42, 26, 38, 22, 41, 25, 37, 21],
];

function renderPatternSvg(density: number, size = 72) {
	const cell = Math.floor(size / 8);
	const threshold = density * 8;
	const cells = BAYER_8X8.flatMap((row, rowIndex) =>
		row
			.map((value, colIndex) =>
				value < threshold
					? `<rect x="${colIndex * cell}" y="${rowIndex * cell}" width="${cell}" height="${cell}" fill="#111"></rect>`
					: "",
			)
			.filter(Boolean),
	).join("");

	return `
		<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
			<rect x="0" y="0" width="${size}" height="${size}" fill="#fff"></rect>
			${cells}
			<rect x="1" y="1" width="${size - 2}" height="${size - 2}" fill="none" stroke="#111" stroke-width="2"></rect>
		</svg>
	`;
}

function renderGradientSvg(label: string, stops: number[], size = 72) {
	const cell = Math.floor(size / 8);
	const columns = stops.length;
	const columnWidth = size / columns;
	const bands = stops
		.map((density, index) => {
			const threshold = density * 8;
			const xOffset = index * columnWidth;
			const cells = BAYER_8X8.flatMap((row, rowIndex) =>
				row
					.map((value, colIndex) => {
						if (value >= threshold) return "";
						const x = xOffset + colIndex * (columnWidth / 8);
						const y = rowIndex * cell;
						return `<rect x="${x}" y="${y}" width="${columnWidth / 8}" height="${cell}" fill="#111"></rect>`;
					})
					.filter(Boolean),
			).join("");
			return cells;
		})
		.join("");

	return `
		<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
			<rect x="0" y="0" width="${size}" height="${size}" fill="#fff"></rect>
			${bands}
			<rect x="1" y="1" width="${size - 2}" height="${size - 2}" fill="none" stroke="#111" stroke-width="2"></rect>
			<text x="${size / 2}" y="${size - 8}" text-anchor="middle" font-size="8" font-family="Arial" font-weight="700" fill="#111">${escapeHtml(label)}</text>
		</svg>
	`;
}

export function renderHtml() {
	const bodyHtml = `
		<section class="screen patterns-screen">
			<div class="patterns-shell">
				<section class="item patterns-hero">
					<div class="meta">Renderer-stable bitmap patterns</div>
					<h1 class="title">Deterministic 8x8 Bayer swatches</h1>
					<p class="description">
						These swatches simulate gradients and 25/50/75% opacity with fixed Bayer patterns,
						so browser preview, Chromium PNG, and bitmap output share the same integer geometry.
					</p>
				</section>
				<div class="patterns-grid">
					${PATTERNS.map(
						(pattern) => `
							<section class="patterns-card">
								<div class="patterns-card__copy">
									<div class="value">${escapeHtml(pattern.label)}</div>
									<div class="meta">${escapeHtml(pattern.density * 8)}/64 black pixels</div>
								</div>
								<div class="patterns-card__swatch">
									${renderPatternSvg(pattern.density)}
								</div>
							</section>
						`,
					).join("")}
				</div>
				<div class="patterns-gradient-grid">
					<section class="patterns-card patterns-card--gradient">
						<div class="patterns-card__copy">
							<div class="value">25%</div>
							<div class="meta">Soft fill ramp</div>
						</div>
						<div class="patterns-card__swatch">${renderGradientSvg("25%", [0, 1, 2, 2])}</div>
					</section>
					<section class="patterns-card patterns-card--gradient">
						<div class="patterns-card__copy">
							<div class="value">50%</div>
							<div class="meta">Midtone ramp</div>
						</div>
						<div class="patterns-card__swatch">${renderGradientSvg("50%", [2, 3, 4, 5])}</div>
					</section>
					<section class="patterns-card patterns-card--gradient">
						<div class="patterns-card__copy">
							<div class="value">75%</div>
							<div class="meta">Heavy fill ramp</div>
						</div>
						<div class="patterns-card__swatch">${renderGradientSvg("75%", [4, 5, 6, 7])}</div>
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.patterns-screen {
				padding: 20px;
				background: #f3f1ee;
			}

			.patterns-shell {
				height: 100%;
				display: grid;
				grid-template-rows: auto auto 1fr;
				gap: 14px;
			}

			.patterns-hero {
				background: #fff;
				border-radius: 18px;
				gap: 8px;
			}

			.patterns-grid {
				display: grid;
				grid-template-columns: repeat(4, minmax(0, 1fr));
				gap: 12px;
			}

			.patterns-gradient-grid {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 12px;
			}

			.patterns-card {
				background: #fff;
				border: 2px solid #111;
				border-radius: 14px;
				padding: 12px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 12px;
			}

			.patterns-card__copy {
				display: grid;
				gap: 6px;
			}

			.patterns-card__copy .value {
				font-size: 20px;
			}

			.patterns-card__swatch {
				flex-shrink: 0;
				display: flex;
			}

			.patterns-card--gradient .patterns-card__swatch {
				margin-left: auto;
			}
		`,
	});
}

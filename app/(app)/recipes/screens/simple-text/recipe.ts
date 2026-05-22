import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

export const id = "simple-text";
export const title = "Simple Text";
export const renderer = "chromium";

export function renderHtml() {
	const bodyHtml = `
		<section class="screen simple-text-screen">
			<div class="simple-text-shell">
				<header class="simple-text-header">
					<div class="meta">Pixel Perfect sample</div>
					<h1 class="title">Simple Text</h1>
					<p class="description">This screen follows the Pixel Perfect direction: one HTML/CSS render path for Chromium PNG capture and TRMNL bitmap output.</p>
				</header>
				<section class="simple-text-grid">
					<article class="item simple-text-card">
						<div class="meta">Headline</div>
						<div class="simple-text-display">${escapeHtml("HELLO TRMNL")}</div>
						<div class="footer">Crisp, high-contrast, fixed layout</div>
					</article>
					<article class="item simple-text-card">
						<div class="meta">Body copy</div>
						<div class="content">
							<p class="description">The Chromium renderer treats HTML and CSS as the canonical truth.</p>
							<p class="description">Use bold labels, strong keylines, bitmap-safe spacing, and a small set of display treatments.</p>
						</div>
					</article>
				</section>
				<section class="simple-text-samples">
					<div class="simple-text-sample simple-text-sample--mono">
						<div class="meta">Bitmap label</div>
						<div class="simple-text-sample__value">PX-800X480</div>
					</div>
					<div class="simple-text-sample simple-text-sample--serif">
						<div class="meta">Editorial</div>
						<div class="simple-text-sample__value">Readable body for Pixel Perfect cards.</div>
					</div>
					<div class="simple-text-sample simple-text-sample--display">
						<div class="meta">Status</div>
						<div class="simple-text-sample__value">ONE TRUE RENDER</div>
					</div>
				</section>
				<footer class="simple-text-footer">
					<div class="simple-text-keyline"></div>
					<div class="footer">800 x 480 fixed snapshot • inspired by Pixel Perfect examples</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.simple-text-screen {
				padding: 28px;
				border: 2px solid #111;
			}

			.simple-text-shell {
				height: 100%;
				display: grid;
				grid-template-rows: auto auto 1fr auto;
				gap: 18px;
			}

			.simple-text-header {
				display: grid;
				gap: 10px;
			}

			.simple-text-header .description {
				max-width: 580px;
				font-size: 19px;
			}

			.simple-text-grid {
				display: grid;
				grid-template-columns: 1.05fr 1fr;
				gap: 18px;
			}

			.simple-text-samples {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 14px;
			}

			.simple-text-card {
				justify-content: space-between;
			}

			.simple-text-display {
				font-size: 58px;
				line-height: 0.94;
				font-weight: 800;
				letter-spacing: -0.05em;
				text-transform: uppercase;
			}

			.simple-text-sample {
				border: 2px solid #111;
				padding: 12px;
				display: grid;
				gap: 8px;
			}

			.simple-text-sample--mono .simple-text-sample__value {
				font-family: "Courier New", monospace;
				font-size: 26px;
				font-weight: 800;
				letter-spacing: 0.08em;
			}

			.simple-text-sample--serif .simple-text-sample__value {
				font-family: Georgia, serif;
				font-size: 26px;
				line-height: 1.12;
				font-weight: 700;
			}

			.simple-text-sample--display .simple-text-sample__value {
				font-size: 30px;
				line-height: 0.96;
				font-weight: 800;
				letter-spacing: -0.04em;
				text-transform: uppercase;
			}

			.simple-text-footer {
				display: grid;
				gap: 10px;
			}

			.simple-text-keyline {
				height: 2px;
				background: #111;
			}
		`,
	});
}

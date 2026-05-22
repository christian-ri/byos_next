import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

export const id = "responsive-example";
export const title = "Responsive Example";
export const renderer = "chromium";

type ResponsiveExampleData = {
	width?: number;
	height?: number;
};

export function renderHtml(data: ResponsiveExampleData) {
	const width = data.width || 800;
	const height = data.height || 480;

	const bodyHtml = `
		<section class="screen responsive-screen">
			<div class="responsive-shell">
				<header class="responsive-header">
					<div class="meta">Layout test</div>
					<h1 class="title">Responsive Example</h1>
				</header>
				<div class="responsive-panels">
					<section class="responsive-panel responsive-panel--left">
						<div class="title title--small">Left panel</div>
						<div class="description">Fixed snapshot layouts can still use compositional panel systems.</div>
					</section>
					<section class="responsive-panel responsive-panel--right">
						<div class="title title--small">Right panel</div>
						<div class="description">Browser preview, Chromium PNG and bitmap output now share one source.</div>
					</section>
				</div>
				<footer class="responsive-footer">
					<div class="footer">Footer</div>
					<div class="meta">${escapeHtml(`${width}x${height}`)}</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.responsive-screen {
				padding: 18px;
				background: #fff;
			}

			.responsive-shell {
				height: 100%;
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 10px;
			}

			.responsive-header {
				border: 2px solid #111;
				background: #111;
				color: #fff;
				padding: 18px 20px;
				display: grid;
				gap: 6px;
			}

			.responsive-header .meta,
			.responsive-header .title {
				color: #fff;
			}

			.responsive-panels {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
			}

			.responsive-panel {
				border: 2px solid #111;
				padding: 18px;
				display: grid;
				align-content: center;
				gap: 10px;
				color: #fff;
			}

			.responsive-panel--left {
				background: #4b4b4b;
			}

			.responsive-panel--right {
				background: #898989;
				color: #111;
			}

			.responsive-panel--right .title,
			.responsive-panel--right .description {
				color: #111;
			}

			.responsive-footer {
				border: 2px solid #111;
				background: #d8d8d8;
				padding: 16px 18px;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
		`,
	});
}

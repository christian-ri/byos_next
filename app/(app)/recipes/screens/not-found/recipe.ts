import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

export const id = "not-found";
export const title = "Not Found Recipe";
export const renderer = "chromium";

export function renderHtml(data: {
	slug?: string;
	reason?: string;
	detail?: string;
}) {
	const bodyHtml = `
		<section class="screen not-found-screen">
			<div class="not-found-shell">
				<div class="not-found-title">Screen Not Found</div>
				${
					data.slug
						? `<div class="not-found-subtitle">Could not find screen: ${escapeHtml(
								data.slug,
							)}</div>`
						: ""
				}
				${
					data.reason
						? `<div class="not-found-reason">
								<div class="meta">Last refresh failed</div>
								<div class="description">${escapeHtml(data.reason)}</div>
							</div>`
						: ""
				}
				${
					data.detail
						? `<div class="not-found-detail">${escapeHtml(data.detail)}</div>`
						: ""
				}
				<div class="not-found-footer">Check the BYOS device identity and refresh configuration.</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.not-found-screen {
				padding: 24px;
				background: #fff;
			}

			.not-found-shell {
				height: 100%;
				display: grid;
				align-content: center;
				justify-items: center;
				gap: 18px;
				text-align: center;
				color: #111;
			}

			.not-found-title {
				font-size: 48px;
				line-height: 1;
				font-weight: 800;
			}

			.not-found-subtitle,
			.not-found-footer {
				font-size: 22px;
				line-height: 1.2;
				font-weight: 600;
			}

			.not-found-reason {
				width: 100%;
				max-width: 720px;
				border: 2px solid #111;
				padding: 12px 16px;
				display: grid;
				gap: 8px;
			}

			.not-found-detail {
				max-width: 720px;
				font-size: 16px;
				line-height: 1.3;
				word-break: break-word;
			}
		`,
	});
}

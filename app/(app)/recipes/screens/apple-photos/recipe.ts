import type { ApplePhotosRecipeData } from "@/app/(app)/recipes/screens/apple-photos/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import {
	fetchImageUrlToDataUri,
	publicAssetToDataUri,
} from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "apple-photos";
export const title = "Apple Photos";
export const renderer = "chromium";

export { getData };

async function imageToDataUri(imageUrl: string) {
	if (!imageUrl) return null;

	try {
		const parsed = new URL(imageUrl);
		if (parsed.hostname.includes("byos-nextjs.vercel.app")) {
			return publicAssetToDataUri(parsed.pathname);
		}
		return fetchImageUrlToDataUri(imageUrl, [parsed.hostname]);
	} catch {
		return publicAssetToDataUri(imageUrl);
	}
}

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

export async function renderHtml(data: ApplePhotosRecipeData) {
	const imageDataUri = await imageToDataUri(data.imageUrl);

	const bodyHtml = `
		<section class="screen apple-photos-screen">
			<div class="apple-photos-shell">
				${
					imageDataUri
						? `<img src="${imageDataUri}" alt="${escapeHtml(data.caption || data.title)}" class="apple-photos-image" />`
						: `<div class="apple-photos-image apple-photos-image--fallback"></div>`
				}
				${
					data.showTimestamp
						? `<div class="apple-photos-clock">
								<div class="apple-photos-clock__row">
									<div class="apple-photos-clock__icon">◷</div>
									<div class="apple-photos-clock__copy">
										<div class="description">${escapeHtml(data.title)}</div>
										${
											data.currentTime
												? `<div class="apple-photos-clock__time">${escapeHtml(data.currentTime)}</div>`
												: ""
										}
										<div class="footer">${escapeHtml(data.timeZoneLabel || "")}</div>
									</div>
								</div>
							</div>`
						: ""
				}
				<div class="apple-photos-meta">
					<div class="apple-photos-meta__row">
						<div class="apple-photos-meta__icon">▣</div>
						<div class="apple-photos-meta__copy">
							${
								data.note
									? `<div class="description">${escapeHtml(
											truncateText(data.note, 32),
										)}</div>`
									: ""
							}
							${
								data.showCaption && data.caption.trim()
									? `<div class="footer">${escapeHtml(
											truncateText(data.caption, 30),
										)}</div>`
									: ""
							}
						</div>
					</div>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.apple-photos-screen {
				position: relative;
				background: #000;
			}

			.apple-photos-shell,
			.apple-photos-image {
				width: 100%;
				height: 100%;
			}

			.apple-photos-shell {
				position: relative;
				overflow: hidden;
			}

			.apple-photos-image {
				display: block;
				object-fit: ${data.fitMode};
			}

			.apple-photos-image--fallback {
				background:
					linear-gradient(180deg, rgba(255,255,255,0.14), rgba(0,0,0,0.18)),
					radial-gradient(circle at top left, #dcdcdc, #5a5a5a 58%, #111 100%);
			}

			.apple-photos-clock,
			.apple-photos-meta {
				position: absolute;
				bottom: 0;
				padding: 16px;
			}

			.apple-photos-clock {
				left: 0;
			}

			.apple-photos-meta {
				right: 0;
			}

			.apple-photos-clock__row,
			.apple-photos-meta__row {
				border: 2px solid #111;
				border-radius: 16px;
				background: rgba(17, 17, 17, 0.78);
				color: #fff;
				padding: 14px;
				display: flex;
				gap: 12px;
			}

			.apple-photos-clock__row {
				min-width: 158px;
				max-width: 176px;
			}

			.apple-photos-meta__row {
				min-width: 124px;
				max-width: 144px;
				justify-content: flex-end;
				text-align: right;
				padding: 12px 12px 10px;
			}

			.apple-photos-clock__icon,
			.apple-photos-meta__icon {
				font-size: 20px;
				line-height: 1;
				font-weight: 700;
				flex-shrink: 0;
			}

			.apple-photos-clock__copy {
				display: grid;
				gap: 4px;
			}

			.apple-photos-clock__time {
				font-size: 27px;
				line-height: 0.95;
				font-weight: 800;
				letter-spacing: -0.04em;
			}

			.apple-photos-meta__copy {
				display: grid;
				gap: 4px;
				width: 100%;
			}

			.apple-photos-clock .description,
			.apple-photos-meta .description,
			.apple-photos-meta .footer,
			.apple-photos-clock .footer {
				color: #fff;
			}

			.apple-photos-meta .description {
				font-size: 16px;
				line-height: 1.2;
			}

			.apple-photos-meta .footer {
				font-size: 13px;
				line-height: 1.15;
				opacity: 0.88;
			}
		`,
	});
}

import type { NasaImageOfDayRecipeData } from "@/app/(app)/recipes/screens/nasa-image-of-the-day/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "nasa-image-of-the-day";
export const title = "NASA Image of the Day";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

export async function renderHtml(data: NasaImageOfDayRecipeData) {
	let imageDataUri: string | null = null;
	try {
		const parsed = new URL(data.imageUrl);
		imageDataUri = await fetchImageUrlToDataUri(data.imageUrl, [
			parsed.hostname,
		]);
	} catch {
		imageDataUri = null;
	}

	const bodyHtml = `
		<section class="screen nasa-screen">
			<div class="nasa-shell">
				${
					imageDataUri
						? `<img src="${imageDataUri}" alt="${escapeHtml(data.title)}" class="nasa-image" />`
						: `<div class="nasa-image nasa-image--fallback"></div>`
				}
				<div class="nasa-top">
					<div class="nasa-title-card">
						<div class="nasa-title">${escapeHtml(truncateText(data.title, 34))}</div>
						<div class="footer">${escapeHtml(data.date)}</div>
					</div>
					<div class="nasa-updated">Updated ${escapeHtml(data.updatedAt)}</div>
				</div>
				<div class="nasa-bottom">
					<div class="nasa-caption">${escapeHtml(truncateText(data.caption, 220))}</div>
					${data.note ? `<div class="nasa-note">${escapeHtml(data.note)}</div>` : ""}
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.nasa-screen { background: #000; color: #fff; }
			.nasa-shell, .nasa-image { width: 100%; height: 100%; }
			.nasa-shell { position: relative; overflow: hidden; background: #000; }
			.nasa-image { position: absolute; inset: 0; display: block; object-fit: cover; }
			.nasa-image--fallback { background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.22)), radial-gradient(circle at top left, #cfd5e1, #404b63 58%, #05070d 100%); }
			.nasa-top, .nasa-bottom { position: absolute; left: 0; right: 0; padding: 16px; display: flex; justify-content: space-between; gap: 12px; }
			.nasa-top { top: 0; align-items: start; }
			.nasa-bottom { bottom: 0; flex-direction: column; }
			.nasa-title-card, .nasa-updated, .nasa-bottom { background: rgba(0,0,0,0.68); border-radius: 16px; color: #fff; }
			.nasa-title-card { padding: 10px 14px; max-width: 330px; }
			.nasa-title { font-size: 24px; line-height: 1.02; font-weight: 800; }
			.nasa-updated { padding: 10px 14px; font-size: 11px; line-height: 1.2; font-weight: 600; text-align: right; }
			.nasa-bottom { padding: 12px 14px; max-width: 540px; }
			.nasa-caption { font-size: 14px; line-height: 1.3; font-weight: 600; }
			.nasa-note { margin-top: 8px; font-size: 12px; line-height: 1.2; color: #d8d8d8; }
			.nasa-title-card .footer { color: #d8d8d8; margin-top: 8px; }
		`,
	});
}

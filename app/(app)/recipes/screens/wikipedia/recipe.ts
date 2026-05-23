import type { WikipediaData } from "@/app/(app)/recipes/screens/wikipedia/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "wikipedia";
export const title = "Wikipedia Article";
export const renderer = "chromium";

export { getData };

function stripHtml(value?: string) {
	return (value || "")
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

export async function renderHtml(data: WikipediaData) {
	const safeTitle =
		stripHtml(data.displaytitle) ||
		stripHtml(data.title) ||
		"Wikipedia Article";
	const safeDescription = stripHtml(data.description);
	const safeExtract = truncateText(
		stripHtml(data.extract) || "Article content is unavailable.",
		980,
	);
	const hasValidThumbnail =
		typeof data.thumbnail?.source === "string" &&
		data.thumbnail.source.startsWith("https://");
	const thumbDataUri =
		hasValidThumbnail && data.thumbnail?.source
			? await (() => {
					try {
						const parsed = new URL(data.thumbnail.source || "");
						return fetchImageUrlToDataUri(data.thumbnail.source || "", [
							parsed.hostname,
						]);
					} catch {
						return null;
					}
				})()
			: null;

	const bodyHtml = `
		<section class="screen wiki-screen">
			<div class="wiki-shell">
				<header class="wiki-header">
					<div class="wiki-header__copy">
						<div class="meta wiki-header__meta">Wikipedia</div>
						<h1 class="title">${escapeHtml(safeTitle)}</h1>
						${safeDescription ? `<div class="wiki-description">${escapeHtml(safeDescription)}</div>` : ""}
					</div>
				</header>
				<div class="wiki-main">
					<article class="item wiki-article">
						<div class="wiki-extract">${escapeHtml(safeExtract)}</div>
					</article>
					<aside class="wiki-aside">
						${
							thumbDataUri
								? `<div class="wiki-thumb"><img src="${thumbDataUri}" alt="${escapeHtml(safeTitle)}" /></div>`
								: `<div class="wiki-thumb wiki-thumb--empty"></div>`
						}
					</aside>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.wiki-screen {
				padding: 24px;
				background: #f5f2ec;
			}

			.wiki-shell {
				height: 100%;
				padding: 10px 12px 12px;
				background: linear-gradient(180deg, #faf9f5 0%, #f0ede6 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 10px;
			}

			.wiki-header {
				display: block;
			}

			.wiki-header__copy {
				min-width: 0;
			}

			.wiki-header__meta {
				margin-bottom: 6px;
			}

			.wiki-description {
				margin-top: 6px;
				font-size: 15px;
				line-height: 1.26;
				font-weight: 600;
				max-width: 640px;
			}

			.wiki-header .title {
				font-size: 34px;
				line-height: 1.02;
				letter-spacing: -0.04em;
			}

			.wiki-main {
				display: grid;
				grid-template-columns: 1fr 316px;
				gap: 12px;
				min-height: 0;
			}

			.wiki-article {
				background: rgba(255,255,255,0.76);
				gap: 8px;
				min-height: 0;
				border: none;
				box-shadow: none;
			}

			.wiki-article.item {
				border: none;
			}

			.wiki-extract {
				font-size: 17px;
				line-height: 1.32;
				font-weight: 500;
				display: -webkit-box;
				-webkit-line-clamp: 15;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}

			.wiki-aside {
				display: block;
				min-height: 0;
			}

			.wiki-thumb {
				background: rgba(255,255,255,0.58);
				padding: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
				height: 100%;
				border: none;
			}

			.wiki-thumb img {
				width: 100%;
				height: 100%;
				object-fit: contain;
				display: block;
				filter: grayscale(1) contrast(1.08);
			}

			.wiki-thumb--empty {
				background: transparent;
			}
		`,
	});
}

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
	const safeUrl =
		data.fullurl ||
		data.content_urls?.desktop?.page ||
		"https://de.wikipedia.org";
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
						<h1 class="title">${escapeHtml(safeTitle)}</h1>
						${safeDescription ? `<div class="wiki-description">${escapeHtml(safeDescription)}</div>` : ""}
					</div>
					<div class="meta wiki-header__meta">Wikipedia article</div>
				</header>
				<div class="wiki-main">
					<article class="item wiki-article">
						<div class="title title--small">Summary</div>
						<div class="wiki-extract">${escapeHtml(safeExtract)}</div>
					</article>
					<aside class="wiki-aside">
						${
							thumbDataUri
								? `<div class="wiki-thumb"><img src="${thumbDataUri}" alt="${escapeHtml(safeTitle)}" /></div>`
								: `<div class="wiki-thumb wiki-thumb--empty"><div class="title title--small">No image</div></div>`
						}
						<div class="item wiki-meta-card">
							<div class="meta">Artikel</div>
							<div class="wiki-url">${escapeHtml(safeUrl)}</div>
							<div class="footer">${escapeHtml(data.pagelanguage === "de" ? "Deutsch bevorzugt" : "Random encyclopedia snapshot")}</div>
						</div>
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
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #faf9f5 0%, #f0ede6 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.wiki-header {
				display: flex;
				justify-content: space-between;
				align-items: end;
				gap: 18px;
			}

			.wiki-header__copy {
				flex: 1;
				min-width: 0;
			}

			.wiki-header__meta {
				padding-bottom: 8px;
				text-align: right;
				flex-shrink: 0;
			}

			.wiki-description {
				margin-top: 8px;
				font-size: 17px;
				line-height: 1.35;
				font-weight: 600;
				max-width: 590px;
			}

			.wiki-main {
				display: grid;
				grid-template-columns: 1.08fr 260px;
				gap: 14px;
				min-height: 0;
			}

			.wiki-article {
				background: #fff;
				gap: 12px;
				min-height: 0;
			}

			.wiki-extract {
				font-size: 18px;
				line-height: 1.36;
				font-weight: 500;
				display: -webkit-box;
				-webkit-line-clamp: 13;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}

			.wiki-aside {
				display: grid;
				grid-template-rows: 1fr auto;
				gap: 14px;
				min-height: 0;
			}

			.wiki-thumb {
				border: 2px solid #111;
				background: #fff;
				padding: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
			}

			.wiki-thumb img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
				filter: grayscale(1) contrast(1.08);
			}

			.wiki-thumb--empty {
				background: repeating-linear-gradient(45deg, #f7f4ee, #f7f4ee 8px, #efebe2 8px, #efebe2 16px);
			}

			.wiki-meta-card {
				background: #fff;
				gap: 10px;
			}

			.wiki-url {
				font-size: 13px;
				line-height: 1.3;
				font-weight: 600;
				word-break: break-word;
			}
		`,
	});
}

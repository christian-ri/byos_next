import type { MuseumPieceRecipeData } from "@/app/(app)/recipes/screens/museum-piece-of-the-day/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "museum-piece-of-the-day";
export const title = "Museum Piece of the Day";
export const renderer = "chromium";

export { getData };

function truncateText(value: string, maxLength: number) {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength).trim()}...`;
}

export async function renderHtml(data: MuseumPieceRecipeData) {
	const imageDataUri = data.imageUrl
		? await fetchImageUrlToDataUri(data.imageUrl, ["images.metmuseum.org"])
		: null;

	const bodyHtml = `
		<section class="screen museum-screen">
			<div class="museum-shell">
				<header class="museum-header">
					<div>
						<div class="meta">${escapeHtml(data.title)}</div>
						<h1 class="title">${escapeHtml(data.label)}</h1>
					</div>
					<div class="museum-header__aside">
						<div class="meta">Updated</div>
						<div class="footer">${escapeHtml(data.updatedAt)}</div>
					</div>
				</header>
				<div class="museum-main">
					<section class="museum-art">
						<div class="museum-art__frame">
							${
								imageDataUri
									? `<img src="${imageDataUri}" alt="${escapeHtml(data.artworkTitle)}" class="museum-art__image" />`
									: `<div class="museum-art__fallback"><div class="title title--small">Image unavailable</div></div>`
							}
						</div>
					</section>
					<section class="museum-copy">
						<article class="item museum-title-card">
							<div class="meta">Featured artwork</div>
							<div class="museum-artwork-title">${escapeHtml(data.artworkTitle)}</div>
							${data.showArtist ? `<div class="museum-artist">${escapeHtml(data.artist)}</div>` : ""}
						</article>
						<div class="museum-meta-grid">
							<article class="item museum-meta-card">
								<div class="meta">Date</div>
								<div class="description">${escapeHtml(data.dateLabel)}</div>
							</article>
							<article class="item museum-meta-card">
								<div class="meta">Department</div>
								<div class="description">${escapeHtml(data.department)}</div>
							</article>
							${
								data.showCulture
									? `<article class="item museum-meta-card">
										<div class="meta">Culture</div>
										<div class="description">${escapeHtml(data.culture)}</div>
									</article>`
									: ""
							}
							<article class="item museum-meta-card">
								<div class="meta">Medium</div>
								<div class="description">${escapeHtml(
									truncateText(data.medium, data.showCulture ? 130 : 180),
								)}</div>
							</article>
						</div>
						<article class="item museum-note">
							<div class="meta">Collection note</div>
							<div class="description">${escapeHtml(
								data.note ||
									"Daily selection from The Met Open Access collection.",
							)}</div>
						</article>
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.museum-screen {
				padding: 20px;
				background: #f3f0e7;
			}

			.museum-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fbfaf7 0%, #efe9de 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.museum-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
			}

			.museum-header__aside {
				display: grid;
				justify-items: end;
				gap: 4px;
				text-align: right;
			}

			.museum-main {
				display: grid;
				grid-template-columns: 278px 1fr;
				gap: 12px;
				min-height: 0;
			}

			.museum-art__frame {
				height: 100%;
				border: 2px solid #111;
				background: #fff;
				padding: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
			}

			.museum-art__image {
				width: 100%;
				height: 100%;
				object-fit: ${data.preferPortrait ? "contain" : "cover"};
				display: block;
				filter: grayscale(1) contrast(1.06);
			}

			.museum-art__fallback {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				background: repeating-linear-gradient(45deg, #f8f5ef, #f8f5ef 10px, #ece6db 10px, #ece6db 20px);
			}

			.museum-copy {
				display: grid;
				grid-template-rows: auto auto auto;
				gap: 10px;
				min-height: 0;
			}

			.museum-title-card {
				background: #fff;
				gap: 10px;
			}

			.museum-artwork-title {
				font-size: 21px;
				line-height: 1.06;
				font-weight: 800;
				letter-spacing: -0.03em;
				max-height: 76px;
				overflow: hidden;
			}

			.museum-artist {
				font-size: 16px;
				line-height: 1.15;
				font-weight: 700;
			}

			.museum-meta-grid {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 10px;
			}

			.museum-meta-card,
			.museum-note {
				background: #fff;
				gap: 8px;
			}

			.museum-meta-card .description,
			.museum-note .description {
				font-size: 14px;
				line-height: 1.18;
			}

			.museum-note .description {
				display: -webkit-box;
				-webkit-line-clamp: 3;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}
		`,
	});
}

import type { PokemonRecipeData } from "@/app/(app)/recipes/screens/whos-that-pokemon/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "whos-that-pokemon";
export const title = "Who's That Pokemon";
export const renderer = "chromium";

export { getData };

export async function renderHtml(data: PokemonRecipeData) {
	const artworkDataUri = data.artwork
		? await fetchImageUrlToDataUri(data.artwork, [
				"raw.githubusercontent.com",
				"githubusercontent.com",
			])
		: null;

	const bodyHtml = `
		<section class="screen pokemon-screen">
			<div class="pokemon-shell">
				<section class="pokemon-art-card">
					${
						artworkDataUri
							? `<img src="${artworkDataUri}" alt="${escapeHtml(data.name)}" class="pokemon-art" />`
							: `<div class="pokemon-art pokemon-art--fallback"><div class="title title--small">No artwork</div></div>`
					}
				</section>
				<section class="pokemon-copy">
					<article class="item pokemon-title-card">
						<div class="meta">WHO'S THAT POKEMON</div>
						<h1 class="pokemon-name">${escapeHtml(data.name)}</h1>
						<div class="pokemon-types">${escapeHtml(data.types)}</div>
						<div class="meta">${escapeHtml(data.species)}</div>
					</article>
					<div class="pokemon-stats">
						<article class="item pokemon-stat">
							<div class="meta">Height</div>
							<div class="pokemon-stat__value">${escapeHtml(data.pokemonHeight)}</div>
						</article>
						<article class="item pokemon-stat">
							<div class="meta">Weight</div>
							<div class="pokemon-stat__value">${escapeHtml(data.weight)}</div>
						</article>
					</div>
					<article class="item pokemon-abilities">
						<div class="meta">Abilities</div>
						<div class="pokemon-abilities__text">${escapeHtml(data.abilities)}</div>
					</article>
					<footer class="pokemon-footer">
						<div class="meta">${escapeHtml(data.note || "Daily Pokemon import.")}</div>
						<div class="meta">Updated ${escapeHtml(data.updatedAt)}</div>
					</footer>
				</section>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.pokemon-screen {
				padding: 20px;
				background: #f3f1ee;
			}

			.pokemon-shell {
				height: 100%;
				display: grid;
				grid-template-columns: 300px 1fr;
				gap: 14px;
			}

			.pokemon-art-card,
			.pokemon-title-card,
			.pokemon-stat,
			.pokemon-abilities {
				border: 2px solid #111;
				border-radius: 18px;
				background: #fff;
			}

			.pokemon-art-card {
				padding: 16px;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pokemon-art {
				width: 260px;
				height: 260px;
				object-fit: contain;
				display: block;
			}

			.pokemon-art--fallback {
				background: repeating-linear-gradient(45deg, #f8f5ef, #f8f5ef 10px, #ece6db 10px, #ece6db 20px);
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pokemon-copy {
				display: grid;
				grid-template-rows: auto auto 1fr auto;
				gap: 14px;
				min-height: 0;
			}

			.pokemon-title-card,
			.pokemon-abilities {
				padding: 16px;
			}

			.pokemon-name {
				margin: 8px 0 0;
				font-size: 34px;
				line-height: 1.02;
				font-weight: 800;
				letter-spacing: -0.04em;
			}

			.pokemon-types {
				margin-top: 8px;
				font-size: 18px;
				line-height: 1.1;
				font-weight: 700;
			}

			.pokemon-stats {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 12px;
			}

			.pokemon-stat {
				padding: 14px;
			}

			.pokemon-stat__value {
				margin-top: 6px;
				font-size: 32px;
				line-height: 1;
				font-weight: 800;
			}

			.pokemon-abilities__text {
				margin-top: 8px;
				font-size: 20px;
				line-height: 1.2;
				font-weight: 600;
			}

			.pokemon-footer {
				display: flex;
				justify-content: space-between;
				gap: 12px;
			}
		`,
	});
}

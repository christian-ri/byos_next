import type { RecipeRouletteRecipeData } from "@/app/(app)/recipes/screens/recipe-roulette/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "recipe-roulette";
export const title = "Recipe Roulette";
export const renderer = "chromium";

export { getData };

function ingredientLine(
	ingredient: RecipeRouletteRecipeData["ingredients"][number],
) {
	return ingredient.measure
		? `${ingredient.name}  ${ingredient.measure}`
		: ingredient.name;
}

export async function renderHtml(data: RecipeRouletteRecipeData) {
	const imageDataUri = data.imageUrl
		? await fetchImageUrlToDataUri(data.imageUrl, [
				"www.themealdb.com",
				"themealdb.com",
			])
		: null;

	const bodyHtml = `
		<section class="screen rr-screen">
			<div class="rr-shell">
				<header class="rr-header">
					<div>
						<div class="meta">${escapeHtml(data.title)}</div>
						<h1 class="title">${escapeHtml(data.label)}</h1>
					</div>
					<div class="rr-header__aside">
						<div class="rr-mode">${escapeHtml(data.mode.toUpperCase())}</div>
						<div class="footer">Updated ${escapeHtml(data.updatedAt)}</div>
					</div>
				</header>
				<div class="rr-main">
					<section class="rr-copy">
						<article class="item rr-title-card">
							<div class="rr-title">${escapeHtml(data.mealTitle)}</div>
							<div class="rr-tags">
								<div><span class="meta">Category</span><span class="description">${escapeHtml(data.category)}</span></div>
								<div><span class="meta">Region</span><span class="description">${escapeHtml(data.area)}</span></div>
							</div>
						</article>
						<article class="item rr-ingredients">
							<div class="rr-ingredients__head">
								<div class="meta">Ingredients</div>
								${data.showIngredientsCount ? `<div class="meta">${escapeHtml(String(data.ingredients.length))} shown</div>` : ""}
							</div>
							<div class="rr-ingredients__list">
								${data.ingredients
									.slice(0, 5)
									.map(
										(ingredient) =>
											`<div class="rr-ingredient">${escapeHtml(ingredientLine(ingredient))}</div>`,
									)
									.join("")}
							</div>
							<div class="footer">${escapeHtml(data.note)}</div>
						</article>
					</section>
					<section class="rr-image-card">
						${
							imageDataUri
								? `<img src="${imageDataUri}" alt="${escapeHtml(data.mealTitle)}" class="rr-image" />`
								: `<div class="rr-image rr-image--fallback"><div class="title title--small">No image</div></div>`
						}
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.rr-screen {
				padding: 20px;
				background: #f4f1ea;
			}

			.rr-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fcfbf8 0%, #efeae1 100%);
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 14px;
			}

			.rr-header {
				display: flex;
				justify-content: space-between;
				align-items: start;
				gap: 16px;
			}

			.rr-header__aside {
				display: grid;
				justify-items: end;
				gap: 8px;
				text-align: right;
			}

			.rr-mode {
				font-size: 18px;
				line-height: 1;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.rr-main {
				display: grid;
				grid-template-columns: 1fr 222px;
				gap: 14px;
				min-height: 0;
			}

			.rr-copy {
				display: grid;
				grid-template-rows: auto 1fr;
				gap: 12px;
				min-height: 0;
			}

			.rr-title-card,
			.rr-ingredients {
				background: #fff;
				gap: 12px;
				overflow: hidden;
			}

			.rr-title {
				font-size: 30px;
				line-height: 1.02;
				font-weight: 800;
				letter-spacing: -0.03em;
				max-height: 128px;
				overflow: hidden;
			}

			.rr-tags {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 12px;
			}

			.rr-tags div,
			.rr-ingredients__head {
				display: flex;
				justify-content: space-between;
				gap: 12px;
			}

			.rr-ingredients__list {
				display: grid;
				gap: 10px;
			}

			.rr-ingredient {
				font-size: 15px;
				line-height: 1.15;
				font-weight: 700;
				padding-bottom: 7px;
				border-bottom: 1px solid #c7c2b8;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.rr-image-card {
				border: 2px solid #111;
				background: #fff;
				padding: 10px;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
			}

			.rr-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
				filter: grayscale(1) contrast(1.08);
			}

			.rr-image--fallback {
				background: repeating-linear-gradient(45deg, #f8f5ef, #f8f5ef 10px, #ece6db 10px, #ece6db 20px);
				display: flex;
				align-items: center;
				justify-content: center;
			}
		`,
	});
}

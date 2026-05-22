import { cache } from "react";
import {
	fetchRecipeConfig,
	fetchRecipeProps,
	type RecipeConfig,
} from "@/lib/recipes/recipe-renderer";
import { DitheringMethod, renderBmp } from "@/utils/render-bmp";
import { postprocessPngForTrmnl } from "./postprocess";
import { renderHtmlToPng } from "./render-html";

type ChromiumRecipeRenderData = Record<string, unknown>;

type ChromiumRecipeModule = {
	renderHtml: (data: ChromiumRecipeRenderData) => string | Promise<string>;
};

export const isChromiumRecipeConfig = (
	config: RecipeConfig | null | undefined,
) => {
	return config?.renderSettings?.renderer === "chromium";
};

const loadChromiumRecipeModule = cache(
	async (slug: string): Promise<ChromiumRecipeModule | null> => {
		try {
			return (await import(
				`@/app/(app)/recipes/screens/${slug}/recipe`
			)) as ChromiumRecipeModule;
		} catch {
			return null;
		}
	},
);

export const getChromiumRecipeHtml = async ({
	slug,
	userId,
	paramOverrides,
}: {
	slug: string;
	userId?: string | null;
	paramOverrides?: Record<string, unknown>;
}) => {
	const config = fetchRecipeConfig(slug);
	if (!config) {
		throw new Error(`Unknown recipe: ${slug}`);
	}

	if (!isChromiumRecipeConfig(config)) {
		throw new Error(`Recipe ${slug} is not configured for Chromium rendering.`);
	}

	const recipeModule = await loadChromiumRecipeModule(slug);
	if (!recipeModule?.renderHtml) {
		throw new Error(
			`Recipe ${slug} does not export renderHtml from app/(app)/recipes/screens/${slug}/recipe.ts.`,
		);
	}

	const data = await fetchRecipeProps(slug, config, {
		userId,
		paramOverrides,
	});
	return recipeModule.renderHtml(data);
};

export const renderChromiumRecipePng = async ({
	slug,
	width,
	height,
	userId,
	paramOverrides,
}: {
	slug: string;
	width: number;
	height: number;
	userId?: string | null;
	paramOverrides?: Record<string, unknown>;
}) => {
	const html = await getChromiumRecipeHtml({
		slug,
		userId,
		paramOverrides,
	});
	const result = await renderHtmlToPng(html, {
		width,
		height,
	});

	return postprocessPngForTrmnl(result.png, {
		width,
		height,
		grayscale: true,
	});
};

export const renderChromiumRecipeBitmap = async ({
	slug,
	width,
	height,
	grayscale = 2,
	userId,
	paramOverrides,
}: {
	slug: string;
	width: number;
	height: number;
	grayscale?: number;
	userId?: string | null;
	paramOverrides?: Record<string, unknown>;
}) => {
	const png = await renderChromiumRecipePng({
		slug,
		width,
		height,
		userId,
		paramOverrides,
	});

	return renderBmp(png, {
		width,
		height,
		grayscale,
		ditheringMethod: DitheringMethod.FLOYD_STEINBERG,
	});
};

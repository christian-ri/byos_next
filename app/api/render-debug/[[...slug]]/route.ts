import type { NextRequest } from "next/server";
import { createElement } from "react";
import NotFoundScreen from "@/app/(app)/recipes/screens/not-found/not-found";
import {
	addDimensionsToProps,
	buildRecipeElement,
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
	fetchRecipeConfig,
	renderRecipeOutputs,
} from "@/lib/recipes/recipe-renderer";
import {
	renderChromiumRecipeBitmap,
	renderChromiumRecipePng,
} from "@/lib/renderer/chromium/recipe";
import { renderPng } from "@/utils/render-png";

/**
 * @deprecated Legacy debug route for Satori/Takumi-backed render inspection.
 *
 * New TRMNL recipes should use the Chromium HTML/CSS renderer path.
 * This route is retained for existing screens during migration.
 */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug?: string[] }> },
) {
	const { slug = ["not-found"] } = await params;
	const recipeSlug = slug.join("/").replace(/\.(bmp|png)$/i, "");
	const { searchParams } = new URL(req.url);
	const format = searchParams.get("format") || "final-png";
	const width = Number(searchParams.get("width") || DEFAULT_IMAGE_WIDTH);
	const height = Number(searchParams.get("height") || DEFAULT_IMAGE_HEIGHT);
	const paramOverrides = Object.fromEntries(
		Array.from(searchParams.entries()).filter(
			([key]) => !["format", "width", "height"].includes(key),
		),
	);
	const config = fetchRecipeConfig(recipeSlug);
	const isChromiumRecipe = config?.renderSettings?.renderer === "chromium";

	if (isChromiumRecipe) {
		try {
			if (format === "renderer-png") {
				const png = await renderChromiumRecipePng({
					slug: recipeSlug,
					width,
					height,
					paramOverrides,
				});
				return new Response(new Uint8Array(png), {
					headers: { "Content-Type": "image/png" },
				});
			}

			const bitmap = await renderChromiumRecipeBitmap({
				slug: recipeSlug,
				width,
				height,
				grayscale: 2,
				paramOverrides,
			});

			if (format === "bitmap") {
				return new Response(new Uint8Array(bitmap), {
					headers: { "Content-Type": "image/bmp" },
				});
			}

			const finalPng = await renderPng(bitmap);
			if (!finalPng) {
				return new Response("Final 1-bit PNG render failed", { status: 500 });
			}
			return new Response(new Uint8Array(finalPng), {
				headers: { "Content-Type": "image/png" },
			});
		} catch (error) {
			return new Response(
				`Chromium render-debug failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ status: 500 },
			);
		}
	}

	const { config: legacyConfig, Component, props, element } = await buildRecipeElement({
		slug: recipeSlug,
		paramOverrides,
	});
	const ComponentToRender =
		Component ??
		(() => {
			return element ?? createElement(NotFoundScreen, { slug: recipeSlug });
		});

	const renders = await renderRecipeOutputs({
		slug: recipeSlug,
		Component: ComponentToRender,
		props: addDimensionsToProps(props, width, height),
		config: legacyConfig,
		imageWidth: width,
		imageHeight: height,
		formats: ["bitmap", "png"],
		grayscale: 2,
	});

	if (format === "bitmap") {
		if (!renders.bitmap) {
			return new Response("Bitmap render failed", { status: 500 });
		}
		return new Response(new Uint8Array(renders.bitmap), {
			headers: { "Content-Type": "image/bmp" },
		});
	}

	if (format === "renderer-png") {
		if (!renders.png) {
			return new Response("Renderer PNG failed", { status: 500 });
		}
		return new Response(new Uint8Array(renders.png), {
			headers: { "Content-Type": "image/png" },
		});
	}

	if (!renders.bitmap) {
		return new Response("Final 1-bit PNG render failed", { status: 500 });
	}

	const finalPng = await renderPng(renders.bitmap);
	if (!finalPng) {
		return new Response("Final 1-bit PNG render failed", { status: 500 });
	}
	return new Response(new Uint8Array(finalPng), {
		headers: { "Content-Type": "image/png" },
	});
}

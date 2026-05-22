import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { resolveScreenSlug } from "@/app/api/screen-resolution";
import { fetchRecipeConfig } from "@/lib/recipes/recipe-renderer";
import { renderChromiumRecipePng } from "@/lib/renderer/chromium/recipe";
import {
	getChromiumRenderCacheSeconds,
	getChromiumRendererEnabled,
	getTrmnlRenderHeight,
	getTrmnlRenderWidth,
} from "@/lib/renderer/env";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	noStore();

	if (!getChromiumRendererEnabled()) {
		return NextResponse.json(
			{ error: "Chromium renderer is disabled by configuration." },
			{ status: 503 },
		);
	}

	const { slug } = await params;
	const normalized = resolveScreenSlug(slug, "simple-text");
	const recipeId = normalized.screen;
	const config = fetchRecipeConfig(recipeId);

	if (config?.renderSettings?.renderer !== "chromium") {
		return NextResponse.json(
			{
				error: "Recipe does not use the Chromium renderer.",
				recipeId,
			},
			{ status: 404 },
		);
	}

	const { searchParams } = new URL(request.url);
	const width = Number(searchParams.get("width") || getTrmnlRenderWidth());
	const height = Number(searchParams.get("height") || getTrmnlRenderHeight());
	const cacheSeconds = getChromiumRenderCacheSeconds();

	try {
		const png = await renderChromiumRecipePng({
			slug: recipeId,
			width,
			height,
		});

		// TODO: Add Vercel Blob artifact caching for rendered PNG outputs.
		// TODO: Cache by recipe id + params + data hash instead of static route-only caching.
		// TODO: Add render locks to avoid duplicate Chromium launches for identical requests.
		return new Response(new Uint8Array(png), {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
				"Content-Length": png.length.toString(),
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Chromium render failed",
				detail:
					error instanceof Error ? error.message : "Unknown Chromium error",
			},
			{ status: 500 },
		);
	}
}

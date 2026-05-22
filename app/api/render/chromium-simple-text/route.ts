import { unstable_noStore as noStore } from "next/cache";
import { NextResponse } from "next/server";
import { renderChromiumRecipePng } from "@/lib/renderer/chromium/recipe";
import {
	getChromiumRenderCacheSeconds,
	getChromiumRendererEnabled,
} from "@/lib/renderer/env";

export async function GET() {
	noStore();

	if (!getChromiumRendererEnabled()) {
		return NextResponse.json(
			{ error: "Chromium renderer is disabled by configuration." },
			{ status: 503 },
		);
	}

	try {
		const png = await renderChromiumRecipePng({
			slug: "chromium-simple-text",
			width: 800,
			height: 480,
		});
		const cacheSeconds = getChromiumRenderCacheSeconds();

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

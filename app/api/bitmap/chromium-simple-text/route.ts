import { unstable_noStore as noStore } from "next/cache";
import type { NextRequest } from "next/server";
import { renderChromiumRecipeBitmap } from "@/lib/renderer/chromium/recipe";
import {
	getChromiumRendererEnabled,
	getTrmnlRenderHeight,
	getTrmnlRenderWidth,
} from "@/lib/renderer/env";

export async function GET(request: NextRequest) {
	noStore();

	if (!getChromiumRendererEnabled()) {
		return Response.json(
			{ error: "Chromium renderer is disabled by configuration." },
			{ status: 503 },
		);
	}

	const { searchParams } = new URL(request.url);
	const width = Number(searchParams.get("width") || getTrmnlRenderWidth());
	const height = Number(searchParams.get("height") || getTrmnlRenderHeight());
	const grayscale = Number(searchParams.get("grayscale") || 2);

	try {
		const bmp = await renderChromiumRecipeBitmap({
			slug: "chromium-simple-text",
			width,
			height,
			grayscale,
		});

		return new Response(new Uint8Array(bmp), {
			headers: {
				"Content-Type": "image/bmp",
				"Content-Length": bmp.length.toString(),
				"Cache-Control": "no-store, max-age=0",
			},
		});
	} catch (error) {
		return Response.json(
			{
				error: "Chromium bitmap render failed",
				detail:
					error instanceof Error ? error.message : "Unknown Chromium error",
			},
			{ status: 500 },
		);
	}
}

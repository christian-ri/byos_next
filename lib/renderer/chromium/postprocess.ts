import sharp from "sharp";
import { getTrmnlRenderHeight, getTrmnlRenderWidth } from "@/lib/renderer/env";

export async function postprocessPngForTrmnl(
	input: Buffer,
	options: {
		width?: number;
		height?: number;
		grayscale?: boolean;
		threshold?: boolean;
	} = {},
): Promise<Buffer> {
	const width = options.width ?? getTrmnlRenderWidth();
	const height = options.height ?? getTrmnlRenderHeight();
	const grayscale = options.grayscale ?? true;
	const threshold = options.threshold ?? false;

	let pipeline = sharp(input).resize(width, height, {
		fit: "fill",
		kernel: sharp.kernel.nearest,
	});

	if (grayscale) {
		pipeline = pipeline.grayscale();
	}

	if (threshold) {
		pipeline = pipeline.threshold(180);
	}

	// TODO: Integrate ordered dithering and existing BMP helpers behind a shared Chromium artifact pipeline.
	return pipeline.png().toBuffer();
}

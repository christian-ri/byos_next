import {
	getChromiumRendererEnabled,
	getChromiumRenderTimeoutMs,
	getTrmnlRenderHeight,
	getTrmnlRenderWidth,
} from "@/lib/renderer/env";
import { getChromiumBrowser } from "./browser";
import type { ChromiumRenderOptions, ChromiumRenderResult } from "./types";

const ALLOWED_PROTOCOLS = new Set(["about:", "data:", "blob:"]);

export async function renderHtmlToPng(
	html: string,
	options: ChromiumRenderOptions = {},
): Promise<ChromiumRenderResult> {
	if (!getChromiumRendererEnabled()) {
		throw new Error(
			"Chromium renderer is disabled. Set CHROMIUM_RENDERER_ENABLED=true to enable Chromium screenshot routes.",
		);
	}

	const width = options.width ?? getTrmnlRenderWidth();
	const height = options.height ?? getTrmnlRenderHeight();
	const timeoutMs = options.timeoutMs ?? getChromiumRenderTimeoutMs();
	const deviceScaleFactor = options.deviceScaleFactor ?? 1;

	const browser = await getChromiumBrowser();
	let page: Awaited<ReturnType<typeof browser.newPage>> | null = null;

	try {
		page = await browser.newPage();
		page.setDefaultNavigationTimeout(timeoutMs);
		page.setDefaultTimeout(timeoutMs);

		await page.setRequestInterception(true);
		page.on("request", (request) => {
			const requestUrl = request.url();
			if (!requestUrl) {
				void request.continue();
				return;
			}

			const protocol = new URL(requestUrl).protocol;
			if (ALLOWED_PROTOCOLS.has(protocol)) {
				void request.continue();
				return;
			}

			void request.abort("blockedbyclient");
		});

		await page.setViewport({
			width,
			height,
			deviceScaleFactor,
		});

		await page.setContent(html, {
			timeout: timeoutMs,
			waitUntil: "load",
		});
		await page.waitForNetworkIdle({
			idleTime: 250,
			timeout: timeoutMs,
		});

		const screenshot = await page.screenshot({
			type: "png",
			clip: {
				x: 0,
				y: 0,
				width,
				height,
			},
		});
		const png = Buffer.isBuffer(screenshot)
			? screenshot
			: Buffer.from(screenshot);

		return {
			png,
			width,
			height,
			renderedAt: new Date().toISOString(),
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown Chromium render error";
		throw new Error(
			`Failed to render HTML to PNG with Chromium. Keep HTML self-contained and avoid remote assets. ${message}`,
		);
	} finally {
		if (page) {
			await page.close().catch(() => undefined);
		}
		await browser.close().catch(() => undefined);
	}
}

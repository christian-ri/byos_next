const TRUE_VALUES = new Set(["true", "1", "yes"]);
const VALID_RENDERERS = new Set(["chromium", "takumi", "satori"]);

type RendererMode = "chromium" | "takumi" | "satori";

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
	if (!value) return defaultValue;
	return TRUE_VALUES.has(value.trim().toLowerCase());
};

const parseInteger = (value: string | undefined, defaultValue: number) => {
	if (!value) return defaultValue;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const getTrmnlRenderer = (): RendererMode => {
	const configured = process.env.TRMNL_RENDERER?.trim().toLowerCase();
	if (!configured || !VALID_RENDERERS.has(configured)) {
		return "chromium";
	}

	return configured as RendererMode;
};

export const getLegacyRendererEnabled = () => {
	return parseBoolean(process.env.LEGACY_RENDERER_ENABLED, true);
};

export const getChromiumRendererEnabled = () => {
	return parseBoolean(process.env.CHROMIUM_RENDERER_ENABLED, true);
};

export const getChromiumRenderTimeoutMs = () => {
	return parseInteger(process.env.CHROMIUM_RENDER_TIMEOUT_MS, 25000);
};

export const getChromiumRenderCacheSeconds = () => {
	return parseInteger(process.env.CHROMIUM_RENDER_CACHE_SECONDS, 300);
};

export const getTrmnlRenderWidth = () => {
	return parseInteger(process.env.TRMNL_RENDER_WIDTH, 800);
};

export const getTrmnlRenderHeight = () => {
	return parseInteger(process.env.TRMNL_RENDER_HEIGHT, 480);
};

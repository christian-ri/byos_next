import screens from "@/app/(app)/recipes/screens.json";

export type ScreenResolution = {
	screen: string;
	fallbackUsed: boolean;
	fallbackReason: string | null;
	originalScreen: string | null;
};

const SCREEN_ALIASES: Record<string, string> = {
	"apple-photos": "apple-photos",
	"bitmap-pattern": "bitmap-patterns",
	"bitmap-patterns": "bitmap-patterns",
	"weather-forecast": "weather",
	weather: "weather",
	"calendar-recipe": "calendar-apple",
	"calendar-recipes": "calendar-apple",
	calendar: "calendar-apple",
	"multi-calendar-today": "calendar-today",
	nasa: "nasa-deep-space-network",
	"nasa-dsn": "nasa-deep-space-network",
	"nasa-deep-space-network": "nasa-deep-space-network",
	simpletext: "simple-text",
	"simple-text": "simple-text",
};

export const normalizeScreenCandidate = (value: string | null | undefined) => {
	const normalized = value?.trim();
	if (!normalized) return null;

	return normalized
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
};

export const resolveScreenSlug = (
	value: string | null | undefined,
	fallback = "album",
): ScreenResolution => {
	const originalScreen = value?.trim() || null;
	const candidate = normalizeScreenCandidate(value);
	const fallbackScreen = screens[fallback as keyof typeof screens]
		? fallback
		: "simple-text";

	if (!candidate) {
		return {
			screen: fallbackScreen,
			fallbackUsed: true,
			fallbackReason: "missing_screen",
			originalScreen,
		};
	}

	if (screens[candidate as keyof typeof screens]) {
		return {
			screen: candidate,
			fallbackUsed: candidate !== originalScreen,
			fallbackReason: candidate !== originalScreen ? "screen_normalized" : null,
			originalScreen,
		};
	}

	const alias = SCREEN_ALIASES[candidate];
	if (alias && screens[alias as keyof typeof screens]) {
		return {
			screen: alias,
			fallbackUsed: true,
			fallbackReason: "screen_alias",
			originalScreen,
		};
	}

	return {
		screen: fallbackScreen,
		fallbackUsed: true,
		fallbackReason: "invalid_screen_fallback",
		originalScreen,
	};
};

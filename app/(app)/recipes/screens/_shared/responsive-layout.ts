export type BitmapLayoutProfile = {
	width: number;
	height: number;
	scale: number;
	isPortrait: boolean;
	isCompact: boolean;
	isDense: boolean;
	padding: number;
	gap: number;
	panelRadius: number;
};

export function getBitmapLayoutProfile(
	width = 800,
	height = 480,
): BitmapLayoutProfile {
	const scale = Math.max(0.52, Math.min(width / 800, height / 480));

	return {
		width,
		height,
		scale,
		isPortrait: height > width,
		isCompact: width < 720 || height < 430,
		isDense: width < 560 || height < 340,
		padding: clampNumber(Math.round(24 * scale), 10, 24),
		gap: clampNumber(Math.round(16 * scale), 6, 16),
		panelRadius: clampNumber(Math.round(18 * scale), 10, 18),
	};
}

export function scaleText(
	base: number,
	profile: Pick<BitmapLayoutProfile, "scale" | "isCompact" | "isDense">,
	options?: {
		compactBase?: number;
		denseBase?: number;
		min?: number;
		max?: number;
	},
) {
	const compactBase = options?.compactBase ?? base;
	const denseBase = options?.denseBase ?? compactBase;
	const chosenBase = profile.isDense
		? denseBase
		: profile.isCompact
			? compactBase
			: base;

	return clampNumber(
		Math.round(chosenBase * profile.scale),
		options?.min ?? 8,
		options?.max ?? base,
	);
}

export function clampText(value: string, maxChars: number) {
	if (value.length <= maxChars) return value;
	return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

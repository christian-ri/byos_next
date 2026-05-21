import React from "react";

type PixelPerfectTextProps = {
	text: string;
	width: number;
	fontSize: number;
	fontWeight?: 400 | 500 | 600 | 700;
	lineHeight?: number;
	maxLines?: number;
	align?: "left" | "center" | "right";
	uppercase?: boolean;
	color?: string;
	letterSpacing?: number;
};

function normalizePixelWidth(width: number) {
	const rounded = Math.max(1, Math.round(width));
	return rounded;
}

function estimateCharsPerLine(width: number, fontSize: number) {
	return Math.max(4, Math.floor(width / Math.max(6, fontSize * 0.62)));
}

function wrapPixelLines(text: string, maxChars: number, maxLines: number) {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (!normalized) return [""];

	const words = normalized.split(" ");
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= maxChars || !current) {
			current = candidate;
			continue;
		}

		lines.push(current);
		current = word;
	}

	if (current) {
		lines.push(current);
	}

	if (lines.length <= maxLines) {
		return lines;
	}

	const visible = lines.slice(0, maxLines);
	const overflow = lines.slice(maxLines - 1).join(" ");
	visible[maxLines - 1] = overflow;

	return visible.map((line, index, arr) => {
		if (index !== arr.length - 1) return line;
		if (line.length <= maxChars) return line;
		return `${line.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
	});
}

export function PixelPerfectText({
	text,
	width,
	fontSize,
	fontWeight = 500,
	lineHeight = 1,
	maxLines = 1,
	align = "left",
	uppercase = false,
	color = "#111",
	letterSpacing = 0,
}: PixelPerfectTextProps) {
	const resolvedText = uppercase ? text.toUpperCase() : text;
	const pixelWidth = normalizePixelWidth(width);
	const lines = wrapPixelLines(
		resolvedText,
		estimateCharsPerLine(pixelWidth, fontSize),
		maxLines,
	);
	const alignment =
		align === "center"
			? "center"
			: align === "right"
				? "flex-end"
				: "flex-start";

	return (
		<div
			data-pixel-perfect="true"
			style={{
				width: pixelWidth,
				display: "flex",
				flexDirection: "column",
				alignItems: alignment,
				justifyContent: "flex-start",
				color,
			}}
		>
			{lines.map((line, index) => (
				<span
					key={`${line}-${index}`}
					data-pixel-perfect="true"
					style={{
						display: "block",
						width: pixelWidth,
						fontSize,
						fontWeight,
						lineHeight,
						letterSpacing,
						textAlign: align,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{line}
				</span>
			))}
		</div>
	);
}

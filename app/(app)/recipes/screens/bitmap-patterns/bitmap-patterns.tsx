import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
	TITLE_TEXT,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { PreSatori } from "@/utils/pre-satori";

const PATTERNS = [
	{ label: "0%", density: 0 },
	{ label: "12.5%", density: 1 },
	{ label: "25%", density: 2 },
	{ label: "37.5%", density: 3 },
	{ label: "50%", density: 4 },
	{ label: "62.5%", density: 5 },
	{ label: "75%", density: 6 },
	{ label: "87.5%", density: 7 },
];

const BAYER_8X8 = [
	[0, 48, 12, 60, 3, 51, 15, 63],
	[32, 16, 44, 28, 35, 19, 47, 31],
	[8, 56, 4, 52, 11, 59, 7, 55],
	[40, 24, 36, 20, 43, 27, 39, 23],
	[2, 50, 14, 62, 1, 49, 13, 61],
	[34, 18, 46, 30, 33, 17, 45, 29],
	[10, 58, 6, 54, 9, 57, 5, 53],
	[42, 26, 38, 22, 41, 25, 37, 21],
];

function PatternSwatch({
	density,
	size = 72,
}: {
	density: number;
	size?: number;
}) {
	const cell = Math.floor(size / 8);
	const threshold = density * 8;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			aria-hidden="true"
			focusable="false"
		>
			<rect x="0" y="0" width={size} height={size} fill="#fff" />
			{BAYER_8X8.flatMap((row, rowIndex) =>
				row.map((value, colIndex) =>
					value < threshold ? (
						<rect
							key={`${rowIndex}-${colIndex}`}
							x={colIndex * cell}
							y={rowIndex * cell}
							width={cell}
							height={cell}
							fill="#111"
						/>
					) : null,
				),
			)}
			<rect
				x="1"
				y="1"
				width={size - 2}
				height={size - 2}
				fill="none"
				stroke="#111"
				strokeWidth="2"
			/>
		</svg>
	);
}

export default function BitmapPatterns({
	width = 800,
	height = 480,
}: {
	width?: number;
	height?: number;
}) {
	const columns = 4;
	const cardWidth = 176;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: 20,
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<EInkCard padding={16} radius={18}>
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						<MetaText>Renderer-stable bitmap patterns</MetaText>
						<SafeTitle size={TITLE_TEXT} lines={2}>
							Deterministic 8x8 Bayer swatches
						</SafeTitle>
						<ReadableText size={16}>
							This screen avoids CSS gradients, background-size tricks, and
							subpixel patterns so the browser preview and the final renderer
							use the same integer SVG geometry.
						</ReadableText>
					</div>
				</EInkCard>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${columns}, ${cardWidth}px)`,
						gap: 12,
						alignContent: "start",
					}}
				>
					{PATTERNS.map((pattern) => (
						<EInkCard
							key={pattern.label}
							padding={12}
							radius={14}
							style={{
								width: cardWidth,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
							}}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
								<ReadableText size={20}>{pattern.label}</ReadableText>
								<MetaText>{pattern.density * 8}/64 black pixels</MetaText>
							</div>
							<PatternSwatch density={pattern.density} />
						</EInkCard>
					))}
				</div>
			</div>
		</PreSatori>
	);
}

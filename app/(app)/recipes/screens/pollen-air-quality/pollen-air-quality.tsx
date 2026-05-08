import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { PreSatori } from "@/utils/pre-satori";
import type { PollenAirQualityData } from "./getData";

function TrendChart({
	points,
	label,
	unit,
}: {
	points: PollenAirQualityData["trendPoints"];
	label: string;
	unit?: string;
}) {
	const width = 404;
	const height = 166;
	const paddingLeft = 24;
	const paddingBottom = 28;
	const paddingTop = 18;
	const innerHeight = height - paddingTop - paddingBottom;
	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const spread = Math.max(1, max - min);
	const mapped = points.map((point, index) => ({
		...point,
		x:
			paddingLeft +
			(index / Math.max(1, points.length - 1)) * (width - paddingLeft * 2),
		y: paddingTop + ((max - point.value) / spread) * innerHeight,
	}));

	return (
		<EInkCard padding={14} radius={16}>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "baseline",
					}}
				>
					<ReadableText size={20} weight={700}>
						{label} Trend
					</ReadableText>
					<MetaText>{unit || "index"}</MetaText>
				</div>
				<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
					<title>{`${label} trend chart`}</title>
					{[0, 0.5, 1].map((ratio) => (
						<line
							key={ratio}
							x1={paddingLeft}
							y1={paddingTop + ratio * innerHeight}
							x2={width - paddingLeft}
							y2={paddingTop + ratio * innerHeight}
							stroke="#bdbdbd"
							strokeWidth="2"
						/>
					))}
					<polyline
						fill="none"
						stroke="#111"
						strokeWidth="4"
						strokeLinecap="round"
						strokeLinejoin="round"
						points={mapped.map((point) => `${point.x},${point.y}`).join(" ")}
					/>
					{mapped.map((point) => (
						<g key={point.label}>
							<circle cx={point.x} cy={point.y} r="4" fill="#111" />
							<text
								x={point.x}
								y={point.y - 10}
								textAnchor="middle"
								fontSize="14"
								fontFamily="geneva9"
								fill="#111"
							>
								{Math.round(point.value)}
							</text>
							<text
								x={point.x}
								y={height - 4}
								textAnchor="middle"
								fontSize="14"
								fontFamily="geneva9"
								fill="#111"
							>
								{point.label}
							</text>
						</g>
					))}
				</svg>
			</div>
		</EInkCard>
	);
}

export default function PollenAirQuality({
	title,
	locationLabel,
	updatedAt,
	timeZone,
	aqiVisible,
	aqiValue,
	aqiLabel,
	aqiBand,
	metrics,
	trendLabel,
	trendUnit,
	trendPoints,
	pollenSummary,
	pollenAvailable,
	note,
	width = 800,
	height = 480,
}: PollenAirQualityData & { width?: number; height?: number }) {
	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: 20,
					display: "flex",
					gap: 14,
				}}
			>
				<div
					style={{
						width: 330,
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					<EInkCard padding={18} radius={18}>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<MetaText>{title}</MetaText>
							<SafeTitle size={30} lines={2}>
								{locationLabel}
							</SafeTitle>
							<div
								className="font-blockkie"
								style={{ fontSize: 82, lineHeight: 0.92 }}
							>
								{aqiVisible && aqiValue !== null ? Math.round(aqiValue) : "--"}
							</div>
							<ReadableText size={22} weight={700}>
								{aqiLabel}
							</ReadableText>
							<MetaText>{aqiBand}</MetaText>
							<MetaText>{timeZone}</MetaText>
							<MetaText>Updated {updatedAt}</MetaText>
						</div>
					</EInkCard>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							{metrics.slice(0, 5).map((metric) => (
								<div
									key={metric.key}
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "baseline",
										gap: 8,
									}}
								>
									<ReadableText size={16}>{metric.label}</ReadableText>
									<ReadableText size={22} weight={700}>
										{metric.value}
										{metric.unit
											? metric.unit.toUpperCase() === "C"
												? "°"
												: ` ${metric.unit}`
											: ""}
									</ReadableText>
								</div>
							))}
						</div>
					</EInkCard>
				</div>

				<div
					style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}
				>
					<TrendChart
						points={trendPoints}
						label={trendLabel}
						unit={trendUnit}
					/>
					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<SafeTitle size={28}>Pollen</SafeTitle>
							<ReadableText size={18}>
								{pollenAvailable
									? pollenSummary
									: "No pollen forecast available for this region."}
							</ReadableText>
							{note ? <MetaText>{note}</MetaText> : null}
						</div>
					</EInkCard>
				</div>
			</div>
		</PreSatori>
	);
}

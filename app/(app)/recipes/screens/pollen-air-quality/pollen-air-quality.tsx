import fontData from "@/components/bitmap-font/bitmap-font.json";
import { BitmapText } from "@/components/bitmap-font/bitmap-text";
import { PreSatori } from "@/utils/pre-satori";
import type { PollenAirQualityData } from "./getData";

function qualityTone(label: string) {
	const normalized = label.toLowerCase();
	if (normalized.includes("good")) return "#e7f4e4";
	if (normalized.includes("moderate")) return "#f3efdc";
	if (normalized.includes("sensitive")) return "#f7ead8";
	if (normalized.includes("unhealthy")) return "#f4dfdf";
	return "#ece7e1";
}

function MetricCard({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit?: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				border: "1px solid #1d1d1d",
				borderRadius: "14px",
				backgroundColor: "#fff",
				padding: "12px 14px",
				minHeight: "78px",
			}}
		>
			<div className="font-geneva9" style={{ fontSize: 12 }}>
				{label}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 6,
				}}
			>
				<div className="font-blockkie" style={{ fontSize: 26, lineHeight: 1 }}>
					{value}
				</div>
				{unit ? (
					<div className="font-geneva9" style={{ fontSize: 11 }}>
						{unit}
					</div>
				) : null}
			</div>
		</div>
	);
}

function TrendChart({
	points,
	label,
	unit,
}: {
	points: PollenAirQualityData["trendPoints"];
	label: string;
	unit?: string;
}) {
	const width = 420;
	const height = 152;
	const left = 18;
	const right = 12;
	const top = 18;
	const bottom = 28;
	const innerWidth = width - left - right;
	const innerHeight = height - top - bottom;

	if (!points.length) {
		return (
			<div
				style={{
					width,
					height,
					border: "1px solid #1d1d1d",
					borderRadius: "14px",
					padding: "12px 14px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
				}}
			>
				<div className="font-blockkie" style={{ fontSize: 18 }}>
					{label} Trend
				</div>
				<div className="font-geneva9" style={{ fontSize: 12 }}>
					No hourly trend available right now.
				</div>
			</div>
		);
	}

	const minValue = Math.min(...points.map((point) => point.value));
	const maxValue = Math.max(...points.map((point) => point.value));
	const paddedMin = Math.max(
		0,
		minValue - Math.max(2, (maxValue - minValue) * 0.2),
	);
	const paddedMax = maxValue + Math.max(2, (maxValue - minValue) * 0.2);
	const spread = Math.max(1, paddedMax - paddedMin);

	const chartPoints = points.map((point, index) => {
		const x = left + (index / Math.max(1, points.length - 1)) * innerWidth;
		const y = top + ((paddedMax - point.value) / spread) * innerHeight;
		return { ...point, x, y };
	});
	const linePath = chartPoints
		.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
		.join(" ");

	return (
		<div
			style={{
				width,
				border: "1px solid #1d1d1d",
				borderRadius: "14px",
				padding: "12px 14px 10px",
				display: "flex",
				flexDirection: "column",
				gap: 8,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
				}}
			>
				<div className="font-blockkie" style={{ fontSize: 18 }}>
					{label} Trend
				</div>
				<div className="font-geneva9" style={{ fontSize: 11 }}>
					Next {points.length} hours{unit ? ` • ${unit}` : ""}
				</div>
			</div>

			<svg
				width={width - 28}
				height={height}
				viewBox={`0 0 ${width - 28} ${height}`}
			>
				<title>{`${label} trend chart`}</title>
				{[0.25, 0.5, 0.75].map((ratio) => (
					<line
						key={ratio}
						x1={left}
						y1={top + innerHeight * ratio}
						x2={width - 28 - right}
						y2={top + innerHeight * ratio}
						stroke="#b4b4b4"
						strokeWidth="1"
						strokeDasharray="2 3"
					/>
				))}
				<path
					d={linePath}
					fill="none"
					stroke="#111"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				{chartPoints.map((point) => (
					<g key={point.label}>
						<circle cx={point.x} cy={point.y} r="3.2" fill="#111" />
						<text
							x={point.x}
							y={point.y - 10}
							textAnchor="middle"
							fontSize="10"
							fontFamily="Geneva"
							fill="#111"
						>
							{Math.round(point.value)}
						</text>
						<text
							x={point.x}
							y={height - 6}
							textAnchor="middle"
							fontSize="11"
							fontFamily="Geneva"
							fill="#111"
						>
							{point.label}
						</text>
					</g>
				))}
			</svg>
		</div>
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
	aqiBandDetail,
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
					border: "1px solid #111",
					padding: "18px 20px",
					display: "flex",
					flexDirection: "column",
					gap: 14,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						borderBottom: "1px solid #111",
						paddingBottom: "10px",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
						<div className="font-blockkie" style={{ fontSize: 34 }}>
							{title}
						</div>
						<div className="font-geneva9" style={{ fontSize: 12 }}>
							{locationLabel}
						</div>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							gap: 3,
						}}
					>
						<div className="font-geneva9" style={{ fontSize: 12 }}>
							{timeZone}
						</div>
						<div className="font-geneva9" style={{ fontSize: 12 }}>
							Updated {updatedAt}
						</div>
					</div>
				</div>

				<div
					style={{
						display: "flex",
						gap: 16,
						flex: 1,
					}}
				>
					<div
						style={{
							width: 452,
							display: "flex",
							flexDirection: "column",
							gap: 14,
						}}
					>
						{aqiVisible ? (
							<div
								style={{
									border: "1px solid #111",
									borderRadius: "16px",
									backgroundColor: qualityTone(aqiLabel),
									padding: "14px 16px",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 5,
									}}
								>
									<div className="font-geneva9" style={{ fontSize: 12 }}>
										US AQI
									</div>
									<div className="font-blockkie" style={{ fontSize: 22 }}>
										{aqiLabel}
									</div>
									<div className="font-geneva9" style={{ fontSize: 12 }}>
										Band {aqiBand}
									</div>
								</div>
								<div style={{ display: "flex", alignItems: "center" }}>
									{aqiValue !== null ? (
										<BitmapText
											text={String(Math.round(aqiValue))}
											fontData={fontData}
											gridSize="8x16"
											scale={3}
											gap={0}
										/>
									) : (
										<div className="font-blockkie" style={{ fontSize: 34 }}>
											--
										</div>
									)}
								</div>
							</div>
						) : (
							<div
								style={{
									border: "1px solid #111",
									borderRadius: "16px",
									backgroundColor: "#fff",
									padding: "14px 16px",
									display: "flex",
									flexDirection: "column",
									gap: 5,
								}}
							>
								<div className="font-blockkie" style={{ fontSize: 20 }}>
									US AQI hidden
								</div>
								<div className="font-geneva9" style={{ fontSize: 12 }}>
									Enable the AQI checkbox on the recipe page if you want the
									large category card back.
								</div>
							</div>
						)}

						<TrendChart
							points={trendPoints}
							label={trendLabel}
							unit={trendUnit}
						/>

						<div
							style={{
								border: "1px solid #111",
								borderRadius: "14px",
								padding: "12px 14px",
								backgroundColor: "#fff",
								display: "flex",
								flexDirection: "column",
								gap: 6,
							}}
						>
							<div className="font-blockkie" style={{ fontSize: 18 }}>
								Pollen Outlook
							</div>
							<div className="font-geneva9" style={{ fontSize: 12 }}>
								{pollenSummary}
							</div>
							{note ? (
								<div className="font-geneva9" style={{ fontSize: 11 }}>
									{note}
								</div>
							) : null}
						</div>
					</div>

					<div
						style={{
							flex: 1,
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 10,
							alignContent: "start",
						}}
					>
						{metrics.map((metric) => (
							<MetricCard
								key={metric.key}
								label={metric.label}
								value={metric.value}
								unit={metric.unit}
							/>
						))}
						{metrics.length === 0 ? (
							<div
								style={{
									gridColumn: "1 / span 2",
									border: "1px solid #111",
									borderRadius: "14px",
									backgroundColor: "#fff",
									padding: "14px",
								}}
								className="font-geneva9"
							>
								All indicator cards are currently disabled in the recipe
								settings.
							</div>
						) : null}
						<div
							style={{
								gridColumn: "1 / span 2",
								border: "1px solid #111",
								borderRadius: "14px",
								backgroundColor: pollenAvailable ? "#fff" : "#f7f4ef",
								padding: "12px 14px",
								display: "flex",
								flexDirection: "column",
								gap: 4,
							}}
						>
							<div className="font-blockkie" style={{ fontSize: 18 }}>
								Reading Guide
							</div>
							<div className="font-geneva9" style={{ fontSize: 12 }}>
								{aqiBandDetail}
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

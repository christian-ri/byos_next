import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { PreSatori } from "@/utils/pre-satori";
import type { PollenAirQualityData } from "./getData";

function Section({
	title,
	children,
	style,
}: {
	title: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}) {
	return (
		<div
			style={{
				border: "2px solid #111",
				backgroundColor: "#fff",
				padding: "12px 14px",
				display: "flex",
				flexDirection: "column",
				gap: 10,
				boxSizing: "border-box",
				...style,
			}}
		>
			<SafeTitle size={22} lines={1}>
				{title}
			</SafeTitle>
			{children}
		</div>
	);
}

function WeatherIcon({
	type,
	size = 96,
}: {
	type: "sun" | "cloud" | "rain" | "storm" | "fog" | "snow";
	size?: number;
}) {
	if (type === "cloud") {
		return (
			<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
				<path
					d="M38 82h42c12 0 22-9 22-20 0-11-9-20-20-20-3-13-14-22-28-22-16 0-29 12-30 28-11 1-20 10-20 21 0 7 3 13 8 17 5 4 11 6 26 6Z"
					fill="none"
					stroke="#111"
					strokeWidth="6"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}
	if (type === "rain") {
		return (
			<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
				<path
					d="M38 62h42c12 0 22-9 22-20 0-11-9-20-20-20-3-13-14-22-28-22-16 0-29 12-30 28-11 1-20 10-20 21 0 7 3 13 8 17 5 4 11 6 26 6Z"
					fill="none"
					stroke="#111"
					strokeWidth="6"
					strokeLinejoin="round"
				/>
				{[42, 60, 78].map((x) => (
					<line
						key={x}
						x1={x}
						y1="74"
						x2={x - 6}
						y2="92"
						stroke="#111"
						strokeWidth="6"
						strokeLinecap="round"
					/>
				))}
			</svg>
		);
	}
	if (type === "storm") {
		return (
			<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
				<path
					d="M38 58h42c12 0 22-9 22-20 0-11-9-20-20-20-3-13-14-22-28-22-16 0-29 12-30 28-11 1-20 10-20 21 0 7 3 13 8 17 5 4 11 6 26 6Z"
					fill="none"
					stroke="#111"
					strokeWidth="6"
					strokeLinejoin="round"
				/>
				<path
					d="M60 68 46 94h16l-8 22 22-32H62l10-16Z"
					fill="none"
					stroke="#111"
					strokeWidth="6"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}
	if (type === "fog") {
		return (
			<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
				{[44, 60, 76].map((y) => (
					<line
						key={y}
						x1="20"
						y1={y}
						x2="100"
						y2={y}
						stroke="#111"
						strokeWidth="6"
						strokeLinecap="round"
					/>
				))}
			</svg>
		);
	}
	if (type === "snow") {
		return (
			<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
				<path
					d="M60 24v72M24 60h72M34 34l52 52M86 34 34 86"
					fill="none"
					stroke="#111"
					strokeWidth="6"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	return (
		<svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
			<circle
				cx="60"
				cy="60"
				r="28"
				fill="none"
				stroke="#111"
				strokeWidth="6"
			/>
			{[
				[60, 10, 60, 28],
				[60, 92, 60, 110],
				[10, 60, 28, 60],
				[92, 60, 110, 60],
				[25, 25, 38, 38],
				[82, 82, 95, 95],
				[25, 95, 38, 82],
				[82, 38, 95, 25],
			].map(([x1, y1, x2, y2], index) => (
				<line
					key={index}
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					stroke="#111"
					strokeWidth="6"
					strokeLinecap="round"
				/>
			))}
		</svg>
	);
}

function TrendChart({
	points,
}: {
	points: PollenAirQualityData["trendPoints"];
}) {
	if (points.length === 0) {
		return (
			<div style={{ height: 106, display: "flex", alignItems: "center" }}>
				<MetaText>Trend unavailable</MetaText>
			</div>
		);
	}

	const width = 300;
	const height = 110;
	const left = 18;
	const bottom = 18;
	const top = 12;
	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const spread = Math.max(1, max - min);
	const mapped = points.map((point, index) => ({
		...point,
		x: left + (index / Math.max(1, points.length - 1)) * (width - left - 12),
		y: top + ((max - point.value) / spread) * (height - top - bottom),
	}));

	return (
		<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
			<title>AQI trend</title>
			<line
				x1={left}
				y1={top}
				x2={left}
				y2={height - bottom}
				stroke="#111"
				strokeWidth="2"
			/>
			<line
				x1={left}
				y1={height - bottom}
				x2={width - 8}
				y2={height - bottom}
				stroke="#111"
				strokeWidth="2"
			/>
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
						y={height - 2}
						textAnchor="middle"
						fontSize="12"
						fontFamily="geneva9"
						fill="#111"
					>
						{point.label}
					</text>
				</g>
			))}
		</svg>
	);
}

function ForecastRow({
	forecast,
}: {
	forecast: PollenAirQualityData["forecast"];
}) {
	return (
		<div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
			{forecast.map((point) => (
				<div
					key={point.label}
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 6,
						borderRight:
							point.label !== forecast.at(-1)?.label
								? "2px dotted #999"
								: "none",
						paddingRight: point.label !== forecast.at(-1)?.label ? 8 : 0,
					}}
				>
					<MetaText>{point.label}</MetaText>
					<WeatherIcon type={point.icon} size={40} />
					<ReadableText size={22} weight={700}>
						{point.temperature}
					</ReadableText>
				</div>
			))}
		</div>
	);
}

function PollenBars({ items }: { items: PollenAirQualityData["pollenItems"] }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
			{items.map((item) => (
				<div
					key={item.key}
					style={{
						display: "grid",
						gridTemplateColumns: "64px 1fr 80px",
						alignItems: "center",
						gap: 10,
					}}
				>
					<ReadableText size={18} weight={700}>
						{item.label}
					</ReadableText>
					<div
						style={{
							height: 10,
							borderBottom: "2px solid #111",
							position: "relative",
						}}
					>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: -1,
								height: 8,
								width: `${Math.max(10, item.ratio * 100)}%`,
								backgroundColor: "#111",
								borderRadius: 999,
							}}
						/>
					</div>
					<ReadableText size={18} align="right">
						{item.level}
					</ReadableText>
				</div>
			))}
		</div>
	);
}

export default function PollenAirQuality({
	locationLabel,
	dateLabel,
	timeLabel,
	updatedAt,
	showPollen,
	pollenAvailable,
	currentIcon,
	currentTemp,
	feelsLike,
	humidity,
	windSpeed,
	windDirection,
	pressure,
	weatherLabel,
	aqiVisible,
	aqiValue,
	aqiLabel,
	aqiBandDetail,
	metrics,
	trendPoints,
	pollenSummary,
	pollenItems,
	forecast,
	sunrise,
	sunset,
	recommendations,
	note,
	width = 800,
	height = 480,
}: PollenAirQualityData & { width?: number; height?: number }) {
	const showPollenPanel =
		showPollen && pollenAvailable && pollenItems.length > 0;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f5f2ec",
					padding: 10,
					display: "flex",
					flexDirection: "column",
					gap: 10,
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						border: "2px solid #111",
						backgroundColor: "#fff",
						padding: "10px 14px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<SafeTitle size={28} lines={1}>
						{locationLabel.toUpperCase()}
					</SafeTitle>
					<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
						<ReadableText size={20} weight={700}>
							{dateLabel.toUpperCase()}
						</ReadableText>
						<div style={{ height: 28, borderLeft: "2px solid #111" }} />
						<SafeTitle size={28} lines={1}>
							{timeLabel}
						</SafeTitle>
					</div>
				</div>

				<div style={{ display: "flex", gap: 10, flex: 1 }}>
					<Section title="CURRENT WEATHER" style={{ width: 270 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
							<WeatherIcon type={currentIcon} size={92} />
							<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<div
									className="font-blockkie"
									style={{ fontSize: 74, lineHeight: 0.92 }}
								>
									{currentTemp}
								</div>
								<ReadableText size={22} weight={700}>
									{weatherLabel}
								</ReadableText>
								<ReadableText size={18}>Feels like {feelsLike}</ReadableText>
							</div>
						</div>
						<div style={{ borderTop: "2px solid #111", paddingTop: 10 }} />
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								rowGap: 10,
								columnGap: 12,
							}}
						>
							<div>
								<MetaText>Humidity</MetaText>
								<ReadableText size={20} weight={700}>
									{humidity}
								</ReadableText>
							</div>
							<div>
								<MetaText>Wind</MetaText>
								<ReadableText size={20} weight={700}>
									{windSpeed}
								</ReadableText>
								<MetaText>{windDirection}</MetaText>
							</div>
							<div>
								<MetaText>Pressure</MetaText>
								<ReadableText size={20} weight={700}>
									{pressure}
								</ReadableText>
							</div>
							<div>
								<MetaText>Status</MetaText>
								<ReadableText size={20} weight={700}>
									{aqiLabel}
								</ReadableText>
							</div>
						</div>
					</Section>

					<Section
						title="AIR QUALITY"
						style={{ flex: showPollenPanel ? 1 : 1.35 }}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								gap: 12,
							}}
						>
							<div style={{ width: 110 }}>
								<MetaText>AQI (US)</MetaText>
								<div
									className="font-blockkie"
									style={{ fontSize: 72, lineHeight: 0.92 }}
								>
									{aqiVisible && aqiValue !== null
										? Math.round(aqiValue)
										: "--"}
								</div>
								<ReadableText size={22} weight={700}>
									{aqiLabel}
								</ReadableText>
							</div>
							<div style={{ flex: 1 }}>
								<MetaText>TREND (24H)</MetaText>
								<TrendChart points={trendPoints} />
							</div>
						</div>
						<ReadableText size={18}>{aqiBandDetail}</ReadableText>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`,
								gap: 8,
							}}
						>
							{metrics.slice(0, 4).map((metric) => (
								<div
									key={metric.key}
									style={{
										border: "2px solid #111",
										padding: "10px 8px",
										display: "flex",
										flexDirection: "column",
										gap: 4,
										alignItems: "center",
									}}
								>
									<MetaText>{metric.label}</MetaText>
									<ReadableText size={22} weight={700} align="center">
										{metric.value}
									</ReadableText>
									{metric.unit ? <MetaText>{metric.unit}</MetaText> : null}
								</div>
							))}
						</div>
					</Section>

					{showPollenPanel ? (
						<Section title="POLLEN" style={{ width: 240 }}>
							<ReadableText size={24} weight={700}>
								{pollenSummary}
							</ReadableText>
							<PollenBars items={pollenItems.slice(0, 4)} />
						</Section>
					) : null}
				</div>

				<div
					style={{
						display: "flex",
						gap: 10,
						height: showPollenPanel ? 126 : 148,
					}}
				>
					<Section
						title="TODAY'S FORECAST"
						style={{ flex: showPollenPanel ? 1.55 : 1.35 }}
					>
						<ForecastRow forecast={forecast} />
					</Section>

					<Section title="SUN" style={{ width: 180 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							<div>
								<MetaText>SUNRISE</MetaText>
								<ReadableText size={28} weight={700}>
									{sunrise}
								</ReadableText>
							</div>
							<div>
								<MetaText>SUNSET</MetaText>
								<ReadableText size={28} weight={700}>
									{sunset}
								</ReadableText>
							</div>
						</div>
					</Section>

					<Section
						title={showPollenPanel ? "RECOMMENDATION" : "WHAT YOU CAN DO TODAY"}
						style={{ flex: showPollenPanel ? 1.15 : 1.45 }}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							{recommendations.map((item) => (
								<ReadableText key={item} size={18}>
									{item}
								</ReadableText>
							))}
							{!showPollenPanel && note ? <MetaText>{note}</MetaText> : null}
						</div>
					</Section>
				</div>

				<div
					style={{
						border: "2px solid #111",
						backgroundColor: "#fff",
						padding: "8px 12px",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<MetaText>
						{showPollen
							? "Weather • Air Quality • Pollen"
							: "Weather • Air Quality"}
					</MetaText>
					<MetaText>{note || `Last update: ${updatedAt}`}</MetaText>
				</div>
			</div>
		</PreSatori>
	);
}

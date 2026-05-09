import {
	MetaText,
	ReadableText,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { PreSatori } from "@/utils/pre-satori";
import type { PollenAirQualityData } from "./getData";

function Panel({
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
				padding: "10px 12px",
				display: "flex",
				flexDirection: "column",
				boxSizing: "border-box",
				overflow: "hidden",
				...style,
			}}
		>
			<div
				className="font-blockkie"
				style={{ fontSize: 16, lineHeight: 1, letterSpacing: 0.4 }}
			>
				{title}
			</div>
			<div style={{ height: 8 }} />
			{children}
		</div>
	);
}

function WeatherIcon({
	type,
	size = 88,
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
	const width = 208;
	const height = 80;
	const paddingLeft = 12;
	const paddingRight = 8;
	const paddingTop = 10;
	const paddingBottom = 18;

	if (points.length === 0) {
		return (
			<div
				style={{
					width,
					height,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					border: "2px solid #111",
				}}
			>
				<MetaText>Trend unavailable</MetaText>
			</div>
		);
	}

	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const spread = Math.max(1, max - min);
	const innerWidth = width - paddingLeft - paddingRight;
	const innerHeight = height - paddingTop - paddingBottom;
	const mapped = points.map((point, index) => ({
		...point,
		x: paddingLeft + (index / Math.max(1, points.length - 1)) * innerWidth,
		y: paddingTop + ((max - point.value) / spread) * innerHeight,
	}));

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
				<title>AQI trend</title>
				{[0, 0.5, 1].map((ratio) => (
					<line
						key={ratio}
						x1={paddingLeft}
						y1={paddingTop + ratio * innerHeight}
						x2={width - paddingRight}
						y2={paddingTop + ratio * innerHeight}
						stroke="#bdbdbd"
						strokeWidth="1.5"
					/>
				))}
				<line
					x1={paddingLeft}
					y1={paddingTop}
					x2={paddingLeft}
					y2={height - paddingBottom}
					stroke="#111"
					strokeWidth="2"
				/>
				<line
					x1={paddingLeft}
					y1={height - paddingBottom}
					x2={width - paddingRight}
					y2={height - paddingBottom}
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
					<circle
						key={point.label}
						cx={point.x}
						cy={point.y}
						r="4"
						fill="#111"
					/>
				))}
			</svg>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
				{points.map((point) => (
					<MetaText
						key={point.label}
						size={11}
						align="center"
						style={{ width: 36 }}
					>
						{point.label}
					</MetaText>
				))}
			</div>
		</div>
	);
}

function ForecastStrip({
	forecast,
}: {
	forecast: PollenAirQualityData["forecast"];
}) {
	return (
		<div style={{ display: "flex", gap: 0, width: "100%" }}>
			{forecast.slice(0, 5).map((point, index, items) => (
				<div
					key={point.label}
					style={{
						width: 62,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 4,
						paddingRight: index < items.length - 1 ? 8 : 0,
						marginRight: index < items.length - 1 ? 8 : 0,
						borderRight: index < items.length - 1 ? "2px dotted #888" : "none",
						boxSizing: "border-box",
					}}
				>
					<MetaText size={13}>{point.label}</MetaText>
					<WeatherIcon type={point.icon} size={36} />
					<ReadableText size={20} weight={700}>
						{point.temperature}
					</ReadableText>
				</div>
			))}
		</div>
	);
}

function PollenRows({ items }: { items: PollenAirQualityData["pollenItems"] }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
			{items.slice(0, 4).map((item) => (
				<div
					key={item.key}
					style={{
						display: "grid",
						gridTemplateColumns: "56px 1fr 70px",
						alignItems: "center",
						gap: 8,
					}}
				>
					<ReadableText size={16} weight={700}>
						{item.label}
					</ReadableText>
					<div
						style={{
							height: 8,
							border: "2px solid #111",
							position: "relative",
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								height: "100%",
								width: `${Math.max(8, item.ratio * 100)}%`,
								backgroundColor: "#111",
							}}
						/>
					</div>
					<MetaText align="right">{item.level}</MetaText>
				</div>
			))}
		</div>
	);
}

function MetricGrid({ metrics }: { metrics: PollenAirQualityData["metrics"] }) {
	const visible = metrics.slice(0, 4);

	return (
		<div style={{ display: "flex", gap: 6 }}>
			{visible.map((metric) => (
				<div
					key={metric.key}
					style={{
						flex: 1,
						border: "2px solid #111",
						padding: "6px 4px",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
						boxSizing: "border-box",
					}}
				>
					<MetaText size={12}>{metric.label}</MetaText>
					<ReadableText size={18} weight={700} align="center">
						{metric.value}
					</ReadableText>
					{metric.unit ? (
						<MetaText size={11} align="center">
							{metric.unit}
						</MetaText>
					) : null}
				</div>
			))}
		</div>
	);
}

function WeatherStat({
	label,
	value,
	subvalue,
}: {
	label: string;
	value: string;
	subvalue?: string;
}) {
	return (
		<div
			style={{
				width: 68,
				border: "2px solid #111",
				padding: "6px 4px",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 2,
				boxSizing: "border-box",
			}}
		>
			<MetaText size={11} align="center">
				{label}
			</MetaText>
			<ReadableText size={16} weight={700} align="center">
				{value}
			</ReadableText>
			{subvalue ? (
				<MetaText size={10} align="center">
					{subvalue}
				</MetaText>
			) : null}
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
	const airPanelWidth = showPollenPanel ? 304 : 528;
	const recommendationTitle = showPollenPanel
		? "RECOMMENDATION"
		: "WHAT YOU CAN DO TODAY";

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f5f2ec",
					padding: 8,
					display: "flex",
					flexDirection: "column",
					gap: 8,
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						height: 52,
						border: "2px solid #111",
						backgroundColor: "#fff",
						padding: "0 16px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						boxSizing: "border-box",
					}}
				>
					<div
						className="font-blockkie"
						style={{ fontSize: 26, lineHeight: 1 }}
					>
						{locationLabel.toUpperCase()}
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						<ReadableText size={18} weight={700}>
							{dateLabel.toUpperCase()}
						</ReadableText>
						<div style={{ width: 2, height: 28, backgroundColor: "#111" }} />
						<div
							className="font-blockkie"
							style={{ fontSize: 28, lineHeight: 1 }}
						>
							{timeLabel}
						</div>
					</div>
				</div>

				<div style={{ display: "flex", gap: 8, height: 248 }}>
					<Panel title="CURRENT WEATHER" style={{ width: 260 }}>
						<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
							<div
								style={{
									width: 92,
									display: "flex",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								<WeatherIcon type={currentIcon} size={88} />
							</div>
							<div
								style={{
									width: 132,
									display: "flex",
									flexDirection: "column",
									gap: 4,
								}}
							>
								<ReadableText size={58} weight={700}>
									{currentTemp}
								</ReadableText>
								<ReadableText size={20} weight={700}>
									{weatherLabel}
								</ReadableText>
								<MetaText>Feels like {feelsLike}</MetaText>
							</div>
						</div>
						<div style={{ height: 10 }} />
						<div style={{ borderTop: "2px solid #111" }} />
						<div style={{ height: 10 }} />
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<WeatherStat label="Humidity" value={humidity} />
							<WeatherStat
								label="Wind"
								value={windSpeed}
								subvalue={windDirection}
							/>
							<WeatherStat label="Pressure" value={pressure} />
						</div>
					</Panel>

					<Panel title="AIR QUALITY" style={{ width: airPanelWidth }}>
						<div style={{ display: "flex", gap: 12 }}>
							<div style={{ width: 72 }}>
								<MetaText>AQI (US)</MetaText>
								<ReadableText size={52} weight={700}>
									{aqiVisible && aqiValue !== null
										? Math.round(aqiValue)
										: "--"}
								</ReadableText>
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<MetaText>TREND (24H)</MetaText>
								<div style={{ height: 6 }} />
								<TrendChart points={trendPoints} />
							</div>
						</div>
						<div style={{ height: 8 }} />
						<ReadableText size={16}>
							{aqiLabel}. {aqiBandDetail}
						</ReadableText>
						<div style={{ height: 10 }} />
						<MetricGrid metrics={metrics} />
					</Panel>

					{showPollenPanel ? (
						<Panel title="POLLEN" style={{ width: 216 }}>
							<ReadableText size={18} weight={700}>
								{pollenSummary}
							</ReadableText>
							<div style={{ height: 10 }} />
							<PollenRows items={pollenItems} />
						</Panel>
					) : null}
				</div>

				<div style={{ display: "flex", gap: 8, height: 156 }}>
					<Panel title="TODAY'S FORECAST" style={{ width: 336 }}>
						<ForecastStrip forecast={forecast} />
					</Panel>

					<Panel title="SUN" style={{ width: 160 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							<div>
								<MetaText>SUNRISE</MetaText>
								<ReadableText size={24} weight={700}>
									{sunrise}
								</ReadableText>
							</div>
							<div>
								<MetaText>SUNSET</MetaText>
								<ReadableText size={24} weight={700}>
									{sunset}
								</ReadableText>
							</div>
						</div>
					</Panel>

					<Panel title={recommendationTitle} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							{recommendations.slice(0, 3).map((item) => (
								<ReadableText key={item} size={17}>
									{item}
								</ReadableText>
							))}
							<MetaText>{note || "Data from Open-Meteo."}</MetaText>
						</div>
					</Panel>
				</div>

				<div
					style={{
						height: 32,
						border: "2px solid #111",
						backgroundColor: "#fff",
						padding: "0 14px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						boxSizing: "border-box",
					}}
				>
					<MetaText>
						{showPollenPanel
							? "Weather • Air Quality • Pollen"
							: "Weather • Air Quality"}
					</MetaText>
					<MetaText>
						{showPollenPanel
							? `Last update: ${updatedAt}`
							: note || "Data from Open-Meteo."}
					</MetaText>
				</div>
			</div>
		</PreSatori>
	);
}

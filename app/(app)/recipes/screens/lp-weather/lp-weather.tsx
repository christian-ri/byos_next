import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
	TemperatureWithUnit,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { LpWeatherRecipeData } from "./getData";

function HourlyChart({ hourly }: Pick<LpWeatherRecipeData, "hourly">) {
	const width = 420;
	const height = 150;
	const paddingX = 26;
	const paddingY = 18;
	const points = hourly.slice(0, 6);
	const temps = points.map((point) => point.temperature);
	const min = Math.min(...temps);
	const max = Math.max(...temps);
	const spread = Math.max(4, max - min);

	const mapped = points.map((point, index) => ({
		...point,
		x:
			paddingX +
			(index / Math.max(1, points.length - 1)) * (width - paddingX * 2),
		y:
			paddingY +
			((max + 2 - point.temperature) / Math.max(1, spread + 4)) *
				(height - paddingY * 2 - 24),
	}));

	return (
		<EInkCard padding={14} radius={16}>
			<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
				<ReadableText size={20} weight={700}>
					Temperature Trend
				</ReadableText>
				<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
					<title>Temperature trend chart</title>
					{[0, 0.5, 1].map((ratio) => (
						<line
							key={ratio}
							x1={paddingX}
							y1={paddingY + ratio * (height - paddingY * 2 - 24)}
							x2={width - paddingX}
							y2={paddingY + ratio * (height - paddingY * 2 - 24)}
							stroke="#c4c4c4"
							strokeWidth="2"
						/>
					))}
					<polyline
						fill="none"
						stroke="#111"
						strokeWidth="4"
						strokeLinejoin="round"
						strokeLinecap="round"
						points={mapped.map((point) => `${point.x},${point.y}`).join(" ")}
					/>
					{mapped.map((point) => (
						<circle
							key={point.timeLabel}
							cx={point.x}
							cy={point.y}
							r="4"
							fill="#111"
						/>
					))}
				</svg>
				<div
					style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
				>
					{points.map((point) => (
						<div
							key={`label-${point.timeLabel}`}
							style={{
								width: 60,
								display: "flex",
								flexDirection: "column",
								gap: 2,
								alignItems: "center",
							}}
						>
							<ReadableText size={14} weight={700} align="center">
								{point.temperature}°
							</ReadableText>
							<MetaText size={14} align="center">
								{point.timeLabel}
							</MetaText>
						</div>
					))}
				</div>
			</div>
		</EInkCard>
	);
}

export default function LpWeather({
	title,
	locationLabel,
	windUnit,
	currentTemp,
	feelsLike,
	condition,
	windSpeed,
	windDirection,
	humidity,
	sunrise,
	sunset,
	updatedAt,
	note,
	days,
	hourly,
	width = 800,
	height = 480,
}: LpWeatherRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 14,
				}}
			>
				<div style={{ display: "flex", gap: 14 }}>
					<div
						style={{
							width: 330,
							display: "flex",
							flexDirection: "column",
							gap: 14,
						}}
					>
						<EInkCard padding={16} radius={18}>
							<MetaText>{title}</MetaText>
							<ReadableText
								size={20}
								weight={700}
								style={{ marginTop: 8, whiteSpace: "pre-line" }}
							>
								{locationLabel.replace(", ", "\n")}
							</ReadableText>
							<MetaText style={{ marginTop: 8 }}>Updated {updatedAt}</MetaText>
						</EInkCard>
						<EInkCard padding={18} radius={18} style={{ flex: 1 }}>
							<TemperatureWithUnit
								value={currentTemp}
								unit=""
								size={88}
								unitSize={28}
							/>
							<ReadableText
								size={18}
								weight={700}
								style={{ marginTop: 8, whiteSpace: "pre-line" }}
							>
								{`${condition}\nFeels like ${feelsLike}°`}
							</ReadableText>
						</EInkCard>
					</div>
					<div style={{ width: 436 }}>
						<HourlyChart hourly={hourly} />
					</div>
				</div>

				<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<SafeTitle size={28}>Forecast</SafeTitle>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								gap: 16,
							}}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<MetaText>Wind</MetaText>
								<ReadableText size={18} weight={700}>
									{windSpeed} {windUnit} {windDirection}
								</ReadableText>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<MetaText>Humidity</MetaText>
								<ReadableText size={18} weight={700}>
									{humidity}%
								</ReadableText>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<MetaText>Sun</MetaText>
								<ReadableText size={18} weight={700}>
									{sunrise} / {sunset}
								</ReadableText>
							</div>
						</div>
						{days.slice(0, 3).map((day) => (
							<div
								key={day.label}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 12,
									border: "2px solid #111",
									padding: "10px 12px",
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<ReadableText
										size={18}
										weight={700}
										style={{ whiteSpace: "pre-line" }}
									>
										{`${day.label}\n${day.condition}`}
									</ReadableText>
								</div>
								<div style={{ textAlign: "right", minWidth: 126 }}>
									<ReadableText size={18} weight={700} align="right">
										{day.high}° / {day.low}°
									</ReadableText>
									<MetaText align="right">
										{day.precipProbability}% rain
									</MetaText>
								</div>
							</div>
						))}
						{note ? <MetaText>{note}</MetaText> : null}
					</div>
				</EInkCard>
			</div>
		</PreSatori>
	);
}

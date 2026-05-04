import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { LpWeatherRecipeData } from "./getData";

function WeatherIcon({ icon, size = 28 }: { icon: string; size?: number }) {
	const strokeWidth = Math.max(1.8, size / 16);

	if (icon === "sun") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				<circle
					cx="32"
					cy="32"
					r="11"
					fill="none"
					stroke="#111"
					strokeWidth={strokeWidth}
				/>
				{[
					[32, 7, 32, 17],
					[32, 47, 32, 57],
					[7, 32, 17, 32],
					[47, 32, 57, 32],
					[14, 14, 21, 21],
					[43, 43, 50, 50],
					[14, 50, 21, 43],
					[43, 21, 50, 14],
				].map((segment) => (
					<line
						key={segment.join("-")}
						x1={segment[0]}
						y1={segment[1]}
						x2={segment[2]}
						y2={segment[3]}
						stroke="#111"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
				))}
			</svg>
		);
	}

	if (icon === "partly-cloudy") {
		return (
			<div
				style={{
					position: "relative",
					width: size,
					height: size,
					display: "flex",
				}}
			>
				<div style={{ position: "absolute", left: size * 0.45, top: 0 }}>
					<WeatherIcon icon="sun" size={Math.round(size * 0.54)} />
				</div>
				<div style={{ position: "absolute", left: 0, bottom: 0 }}>
					<WeatherIcon icon="cloud" size={size} />
				</div>
			</div>
		);
	}

	if (icon === "rain") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				<path
					d="M18 41c-6 0-11-4-11-10 0-6 5-10 11-10 2 0 4 0 6 1 3-6 9-9 16-9 9 0 17 7 17 16 5 1 9 6 9 11 0 7-6 12-13 12H18Z"
					fill="none"
					stroke="#111"
					strokeWidth={strokeWidth}
					strokeLinejoin="round"
				/>
				{[20, 31, 42].map((x) => (
					<path
						key={x}
						d={`M${x} 47c2 3 2 7-1 9`}
						fill="none"
						stroke="#111"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
				))}
			</svg>
		);
	}

	if (icon === "snow") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				{[
					[32, 14, 32, 50],
					[14, 32, 50, 32],
					[19, 19, 45, 45],
					[19, 45, 45, 19],
				].map((segment) => (
					<line
						key={segment.join("-")}
						x1={segment[0]}
						y1={segment[1]}
						x2={segment[2]}
						y2={segment[3]}
						stroke="#111"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
				))}
				<circle cx="32" cy="32" r="3" fill="#111" />
			</svg>
		);
	}

	if (icon === "storm") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				<path
					d="M18 39c-6 0-11-4-11-10 0-6 5-10 11-10 2 0 4 0 6 1 3-6 9-9 16-9 9 0 17 7 17 16 5 1 9 6 9 11 0 7-6 12-13 12H18Z"
					fill="none"
					stroke="#111"
					strokeWidth={strokeWidth}
					strokeLinejoin="round"
				/>
				<path
					d="M33 36 25 50h8l-5 13 15-19h-9l5-8Z"
					fill="#111"
					stroke="#111"
					strokeWidth={strokeWidth / 2}
					strokeLinejoin="round"
				/>
			</svg>
		);
	}

	if (icon === "fog") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				<WeatherIcon icon="cloud" size={Math.round(size * 0.88)} />
				{[42, 50, 58].map((y) => (
					<line
						key={y}
						x1="10"
						y1={y}
						x2="54"
						y2={y}
						stroke="#111"
						strokeWidth={strokeWidth}
						strokeLinecap="round"
					/>
				))}
			</svg>
		);
	}

	if (icon === "moon") {
		return (
			<svg
				viewBox="0 0 64 64"
				width={size}
				height={size}
				aria-hidden="true"
				focusable="false"
			>
				<path
					d="M40 10c-9 3-15 11-15 21 0 11 8 20 19 21-3 2-7 3-11 3-14 0-25-11-25-25 0-13 10-24 23-25 4 0 7 1 9 2Z"
					fill="none"
					stroke="#111"
					strokeWidth={strokeWidth}
					strokeLinejoin="round"
				/>
			</svg>
		);
	}

	return (
		<svg
			viewBox="0 0 64 64"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M18 44c-6 0-11-4-11-10 0-6 5-10 11-10 2 0 4 0 6 1 3-6 9-9 16-9 9 0 17 7 17 16 5 1 9 6 9 11 0 7-6 12-13 12H18Z"
				fill="none"
				stroke="#111"
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function TemperatureRangeBar({
	low,
	high,
	globalLow,
	globalHigh,
	width,
	height = 24,
}: {
	low: number;
	high: number;
	globalLow: number;
	globalHigh: number;
	width: number;
	height?: number;
}) {
	const spread = Math.max(1, globalHigh - globalLow);
	const start = ((low - globalLow) / spread) * width;
	const barWidth = Math.max(20, ((high - low) / spread) * width);

	return (
		<svg
			width={width}
			height={height}
			viewBox={`0 0 ${width} ${height}`}
			aria-hidden="true"
			focusable="false"
		>
			<rect
				x="0.75"
				y="1.5"
				width={width - 1.5}
				height={height - 3}
				rx={height / 2}
				fill="none"
				stroke="#888"
				strokeWidth="1.5"
			/>
			<rect
				x={start}
				y="2.5"
				width={Math.min(width - start - 2, barWidth)}
				height={height - 5}
				rx={(height - 5) / 2}
				fill="#777"
			/>
		</svg>
	);
}

function TemperatureChart({
	hourly,
	sunriseIso,
	sunsetIso,
	profile,
}: {
	hourly: LpWeatherRecipeData["hourly"];
	sunriseIso?: string;
	sunsetIso?: string;
	profile: ReturnType<typeof getBitmapLayoutProfile>;
}) {
	const chartWidth = profile.isCompact ? 500 : 540;
	const chartHeight = profile.isCompact ? 180 : 210;
	const paddingLeft = 18;
	const paddingTop = 18;
	const paddingBottom = 24;
	const innerWidth = chartWidth - paddingLeft - 18;
	const innerHeight = chartHeight - paddingTop - paddingBottom;

	const temps = hourly.map((point) => point.temperature);
	const minTemp = Math.min(...temps);
	const maxTemp = Math.max(...temps);
	const spread = Math.max(6, maxTemp - minTemp);
	const rangeMin = minTemp - 2;
	const rangeMax = maxTemp + 2;
	const yForTemp = (temperature: number) =>
		paddingTop +
		((rangeMax - temperature) / Math.max(1, rangeMax - rangeMin)) * innerHeight;

	const points = hourly.map((point, index) => {
		const x =
			paddingLeft + (index / Math.max(1, hourly.length - 1)) * innerWidth;
		return {
			...point,
			x,
			y: yForTemp(point.temperature),
		};
	});

	const linePath = points
		.map(
			(point, index) =>
				`${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
		)
		.join(" ");
	const areaPath = `${linePath} L ${points[points.length - 1]?.x || paddingLeft} ${chartHeight - paddingBottom} L ${paddingLeft} ${chartHeight - paddingBottom} Z`;

	const sunriseLabel =
		sunriseIso &&
		new Date(sunriseIso).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	const sunsetLabel =
		sunsetIso &&
		new Date(sunsetIso).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 6,
			}}
		>
			<svg
				width={chartWidth}
				height={chartHeight}
				viewBox={`0 0 ${chartWidth} ${chartHeight}`}
				aria-hidden="true"
				focusable="false"
			>
				{[0.25, 0.5, 0.75].map((ratio) => (
					<line
						key={ratio}
						x1={paddingLeft}
						y1={paddingTop + innerHeight * ratio}
						x2={chartWidth - 18}
						y2={paddingTop + innerHeight * ratio}
						stroke="#aaa"
						strokeWidth="1"
						strokeDasharray="2 3"
					/>
				))}

				{sunsetLabel ? (
					<rect
						x={paddingLeft + (2 / Math.max(1, hourly.length - 1)) * innerWidth}
						y={paddingTop}
						width={innerWidth * 0.42}
						height={innerHeight}
						fill="url(#nightDots)"
						opacity="0.65"
					/>
				) : null}
				<defs>
					<pattern
						id="nightDots"
						width="6"
						height="6"
						patternUnits="userSpaceOnUse"
					>
						<circle cx="1.5" cy="1.5" r="0.8" fill="#777" />
					</pattern>
					<pattern
						id="rainHatch"
						width="8"
						height="8"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(12)"
					>
						<line x1="0" y1="0" x2="0" y2="8" stroke="#666" strokeWidth="2" />
					</pattern>
				</defs>

				<path d={areaPath} fill="url(#rainHatch)" opacity="0.45" />
				<path
					d={linePath}
					fill="none"
					stroke="#111"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>

				{points.map((point) => (
					<g key={point.timeLabel}>
						<circle cx={point.x} cy={point.y} r="3.2" fill="#111" />
						<foreignObject
							x={point.x - 12}
							y={Math.max(0, point.y - 34)}
							width="24"
							height="24"
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "100%",
									height: "100%",
								}}
							>
								<WeatherIcon icon={point.icon} size={16} />
							</div>
						</foreignObject>
						<text
							x={point.x}
							y={point.y - 10}
							textAnchor="middle"
							fontSize="11"
							fontFamily="Geneva"
							fill="#111"
						>
							{point.temperature}°
						</text>
						<text
							x={point.x}
							y={chartHeight - 6}
							textAnchor="middle"
							fontSize="12"
							fontFamily="Geneva"
							fill="#111"
						>
							{point.timeLabel}
						</text>
					</g>
				))}

				{sunsetLabel ? (
					<text
						x={paddingLeft + innerWidth * 0.28}
						y="14"
						textAnchor="middle"
						fontSize="12"
						fontFamily="Geneva"
						fill="#111"
					>
						{sunsetLabel}
					</text>
				) : null}
				{sunriseLabel ? (
					<text
						x={paddingLeft + innerWidth * 0.72}
						y="14"
						textAnchor="middle"
						fontSize="12"
						fontFamily="Geneva"
						fill="#111"
					>
						{sunriseLabel}
					</text>
				) : null}
			</svg>
			<div className="font-geneva9 text-[11px]">
				Temperatures span {spread}° across the next {hourly.length} hours.
			</div>
		</div>
	);
}

export default function LpWeather({
	title,
	locationLabel,
	currentTemp,
	feelsLike,
	condition,
	conditionIcon,
	windSpeed,
	windDirection,
	humidity,
	sunrise,
	sunset,
	sunriseIso,
	sunsetIso,
	updatedAt,
	note,
	days,
	hourly,
	width = 800,
	height = 480,
}: LpWeatherRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const globalLow = Math.min(...days.map((day) => day.low));
	const globalHigh = Math.max(...days.map((day) => day.high));

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full flex-col border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding }}
			>
				<div className="flex flex-1 gap-5">
					<div className="flex flex-[1.1] flex-col justify-between">
						<div className="flex items-start gap-5">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 150,
									height: 130,
								}}
							>
								<WeatherIcon
									icon={conditionIcon}
									size={profile.isCompact ? 108 : 128}
								/>
							</div>
							<div className="flex items-start gap-4">
								<div
									className="font-blockkie leading-none"
									style={{
										fontSize: scaleText(108, profile, {
											compactBase: 88,
											denseBase: 72,
											min: 54,
											max: 108,
										}),
									}}
								>
									{currentTemp}°
								</div>
								<div
									className="font-geneva9"
									style={{
										paddingTop: 8,
										fontSize: scaleText(18, profile, {
											compactBase: 16,
											denseBase: 14,
											min: 12,
											max: 18,
										}),
									}}
								>
									<div>{condition}</div>
									<div className="mt-1">Feels {feelsLike}°</div>
									<div className="mt-1">Humidity {humidity}%</div>
									<div className="mt-1">
										Wind {windSpeed} {windDirection}
									</div>
								</div>
							</div>
						</div>

						<TemperatureChart
							hourly={hourly}
							sunriseIso={sunriseIso}
							sunsetIso={sunsetIso}
							profile={profile}
						/>
					</div>

					<div
						className="flex flex-[0.78] flex-col"
						style={{ gap: 14, paddingTop: 6 }}
					>
						{days.map((day) => (
							<div
								key={day.label}
								className="flex items-center justify-between"
								style={{ minHeight: 48 }}
							>
								<div
									className="font-geneva9"
									style={{ width: 96, fontSize: 15 }}
								>
									{day.label}
									{day.precipProbability > 0 ? (
										<div
											style={{
												marginTop: 6,
												display: "flex",
												alignItems: "center",
												gap: 5,
												border: "1px solid #888",
												borderRadius: "4px",
												padding: "2px 6px",
												width: "fit-content",
												fontSize: 11,
											}}
										>
											<span>◔</span>
											<span>{day.precipProbability}%</span>
										</div>
									) : null}
								</div>

								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 10,
										width: 236,
									}}
								>
									<WeatherIcon icon={day.icon} size={28} />
									<div
										className="font-blockkie"
										style={{ width: 42, fontSize: 26, textAlign: "right" }}
									>
										{day.low}°
									</div>
									<TemperatureRangeBar
										low={day.low}
										high={day.high}
										globalLow={globalLow}
										globalHigh={globalHigh}
										width={120}
									/>
									<div
										className="font-blockkie"
										style={{ width: 42, fontSize: 26, textAlign: "right" }}
									>
										{day.high}°
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div
					className="mt-3 flex items-center justify-between border-t border-black"
					style={{ paddingTop: 10 }}
				>
					<div className="flex items-center gap-2">
						<WeatherIcon icon={conditionIcon} size={22} />
						<div className="font-blockkie text-[22px] leading-none">
							{title}
						</div>
						<div className="font-geneva9 text-[13px]">
							{clampText(locationLabel, profile.isCompact ? 20 : 28)}
						</div>
					</div>
					<div className="font-geneva9 text-[13px]">
						Sunrise {sunrise} · Sunset {sunset} · Updated {updatedAt}
					</div>
				</div>
				<div className="mt-1 font-geneva9 text-[11px]">
					{clampText(note || "", profile.isDense ? 46 : 120)}
				</div>
			</div>
		</PreSatori>
	);
}

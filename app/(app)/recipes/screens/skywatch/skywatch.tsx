import { MetaText, ReadableText, SafeTitle } from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

function AircraftCard({
	flight,
}: {
	flight: SkyWatchRecipeData["aircraft"][number];
}) {
	return (
		<div
			style={{
				borderBottom: "2px solid rgba(255,255,255,0.18)",
				paddingBottom: 10,
			}}
		>
			<div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
				<PlaneIcon heading={flight.heading} size={28} color="#fff" />
				<div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
					<ReadableText size={16} weight={700} color="#fff">
						{flight.callsign}
					</ReadableText>
					<MetaText color="#d4d4d4">{flight.aircraftType}</MetaText>
					<MetaText color="#d4d4d4">
						{flight.altitudeLabel} · {flight.speedLabel}
					</MetaText>
				</div>
			</div>
		</div>
	);
}

function PlaneIcon({
	heading = 0,
	size = 28,
	color = "#fff",
}: {
	heading?: number;
	size?: number;
	color?: string;
}) {
	return (
		<svg
			viewBox="0 0 238.45445 228.24998"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			style={{ transform: `rotate(${heading + 45}deg)` }}
		>
			<path
				fill={color}
				fillRule="evenodd"
				d="M194.67321 0 70.641958 53.625c-10.38227-6.92107-34.20058-21.27539-38.90545-23.44898-39.4400301-18.22079-36.9454001 14.73107-20.34925 24.6052 4.53917 2.70065 27.72352 17.17823 43.47345 26.37502l17.90625 133.9375 22.21875 13.15625 11.531252-120.9375 71.53125 36.6875 3.84375 39.21875 14.53125 8.625 11.09375-42.40625.125.0625 30.8125-31.53125-14.875-8-35.625 16.90625-68.28125-42.4375L217.36071 12.25 194.67321 0z"
			/>
		</svg>
	);
}

export default function SkyWatch({
	title,
	locationLabel,
	radiusLabel,
	updatedAt,
	note,
	aircraft,
	width = 800,
	height = 480,
}: SkyWatchRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const visibleAircraft = aircraft.slice(0, 2);
	const primaryLocation = locationLabel.split(",")[0]?.trim() || locationLabel;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#111",
					padding: profile.padding,
					position: "relative",
					overflow: "hidden",
				}}
			>
				<svg
					width="100%"
					height="100%"
					viewBox="0 0 760 440"
					aria-hidden="true"
					focusable="false"
				>
					{[64, 132, 198].map((radius) => (
						<circle
							key={radius}
							cx="530"
							cy="220"
							r={radius}
							fill="none"
							stroke="#fff"
							strokeWidth="2"
							opacity="0.16"
						/>
					))}
					<line x1="530" y1="0" x2="530" y2="440" stroke="#fff" strokeWidth="2" opacity="0.08" />
					<line x1="332" y1="220" x2="760" y2="220" stroke="#fff" strokeWidth="2" opacity="0.08" />
				</svg>
				<div style={{ position: "absolute", left: 28, top: 24, width: 250 }}>
					<MetaText color="#cfcfcf">{title}</MetaText>
					<SafeTitle size={28} lines={2} style={{ color: "#fff", marginTop: 10 }}>
						{primaryLocation}
					</SafeTitle>
					<ReadableText size={18} weight={700} color="#fff" style={{ marginTop: 12 }}>
						{radiusLabel}
					</ReadableText>
					<MetaText color="#cfcfcf" style={{ marginTop: 8 }}>
						Updated {updatedAt}
					</MetaText>
				</div>
				<div
					style={{
						position: "absolute",
						left: 28,
						width: 332,
						bottom: 26,
						padding: 16,
						border: "2px solid rgba(255,255,255,0.25)",
						backgroundColor: "rgba(0,0,0,0.32)",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{visibleAircraft.map((flight) => (
							<AircraftCard key={flight.id} flight={flight} />
						))}
					</div>
				</div>
				<div
					style={{
						position: "absolute",
						left: 518,
						top: 208,
						width: 24,
						height: 24,
						borderRadius: 12,
						backgroundColor: "#fff",
					}}
				/>
				{visibleAircraft.map((flight, index) => (
					<div
						key={`marker-${flight.id}`}
						style={{
							position: "absolute",
							left: `${index === 0 ? 50 : 56}%`,
							top: `${index === 0 ? 34 : 52}%`,
							transform: "translate(-50%, -50%)",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 6,
						}}
					>
						<PlaneIcon heading={flight.heading} size={34} color="#fff" />
					</div>
				))}
				{note ? (
					<div style={{ position: "absolute", left: 28, right: 28, bottom: 8 }}>
						<MetaText color="#bfbfbf">{note}</MetaText>
					</div>
				) : null}
			</div>
		</PreSatori>
	);
}

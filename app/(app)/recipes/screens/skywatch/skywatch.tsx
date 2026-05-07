import {
	AirplaneIcon,
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

function AircraftCard({
	flight,
}: {
	flight: SkyWatchRecipeData["aircraft"][number];
}) {
	return (
		<EInkCard padding={12} radius={12}>
			<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
				<AirplaneIcon heading={flight.heading} size={30} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<ReadableText size={16} weight={700}>
						{flight.callsign}
					</ReadableText>
					<MetaText>{flight.aircraftType}</MetaText>
					<MetaText>
						{flight.altitudeLabel} · {flight.speedLabel}
					</MetaText>
				</div>
			</div>
		</EInkCard>
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
	const visibleAircraft = aircraft.slice(0, 4);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: profile.padding,
					display: "flex",
					gap: 14,
				}}
			>
				<div
					style={{
						width: 364,
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					<EInkCard padding={18} radius={18}>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<MetaText>{title}</MetaText>
							<SafeTitle size={30} lines={2}>
								{locationLabel}
							</SafeTitle>
							<ReadableText size={20} weight={700}>
								{radiusLabel}
							</ReadableText>
							<MetaText>Updated {updatedAt}</MetaText>
						</div>
					</EInkCard>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<SafeTitle size={26}>Closest Aircraft</SafeTitle>
							{visibleAircraft.map((flight) => (
								<AircraftCard key={flight.id} flight={flight} />
							))}
						</div>
					</EInkCard>
				</div>

				<EInkCard
					padding={0}
					radius={18}
					style={{
						flex: 1,
						position: "relative",
						overflow: "hidden",
						backgroundColor: "#111",
						color: "#fff",
					}}
				>
					<svg
						width="100%"
						height="100%"
						viewBox="0 0 380 420"
						aria-hidden="true"
						focusable="false"
					>
						{[50, 110, 170].map((radius) => (
							<circle
								key={radius}
								cx="190"
								cy="210"
								r={radius}
								fill="none"
								stroke="#fff"
								strokeWidth="2"
								opacity="0.4"
							/>
						))}
						<line
							x1="190"
							y1="0"
							x2="190"
							y2="420"
							stroke="#fff"
							strokeWidth="2"
							opacity="0.25"
						/>
						<line
							x1="0"
							y1="210"
							x2="380"
							y2="210"
							stroke="#fff"
							strokeWidth="2"
							opacity="0.25"
						/>
					</svg>
					<div
						style={{
							position: "absolute",
							left: 178,
							top: 198,
							width: 24,
							height: 24,
							borderRadius: 12,
							backgroundColor: "#fff",
						}}
					/>
					{visibleAircraft.map((flight) => (
						<div
							key={`marker-${flight.id}`}
							style={{
								position: "absolute",
								left: `${flight.x * 100}%`,
								top: `${flight.y * 100}%`,
								transform: "translate(-50%, -50%)",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 4,
							}}
						>
							<AirplaneIcon heading={flight.heading} size={34} color="#fff" />
							<div
								style={{
									backgroundColor: "#fff",
									color: "#111",
									padding: "4px 8px",
									minWidth: 92,
								}}
							>
								<ReadableText size={14} weight={700}>
									{flight.callsign}
								</ReadableText>
							</div>
						</div>
					))}
					<div style={{ position: "absolute", left: 16, top: 16 }}>
						<MetaText color="#fff">
							Renderer-stable 8-direction aircraft icons
						</MetaText>
					</div>
					{note ? (
						<div
							style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}
						>
							<MetaText color="#fff">{note}</MetaText>
						</div>
					) : null}
				</EInkCard>
			</div>
		</PreSatori>
	);
}

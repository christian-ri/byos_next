import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

const MAP_BOX_SIZE = 360;
const PANEL_WIDTH = 360;

function AircraftCard({
	flight,
}: {
	flight: SkyWatchRecipeData["aircraft"][number];
}) {
	return (
		<div
			style={{
				border: "2px solid #111",
				padding: "12px 14px",
				backgroundColor: "#fff",
				display: "flex",
				flexDirection: "column",
				gap: 5,
			}}
		>
			<div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
				<PlaneIcon heading={flight.heading} size={26} color="#111" />
				<div
					style={{
						flex: 1,
						minWidth: 0,
						display: "flex",
						flexDirection: "column",
						gap: 3,
					}}
				>
					<ReadableText size={18} weight={700}>
						{flight.callsign}
					</ReadableText>
					<MetaText>{flight.aircraftType}</MetaText>
					<MetaText>
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
	map,
	aircraft,
	width = 800,
	height = 480,
}: SkyWatchRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const visibleAircraft = aircraft.slice(0, 3);
	const primaryLocation = locationLabel.split(",")[0]?.trim() || locationLabel;
	const mapOffset = (MAP_BOX_SIZE - map.size) / 2;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f4f2ee",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 14,
					color: "#111",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						gap: 12,
						paddingBottom: 10,
						borderBottom: "2px solid #111",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 8,
							width: PANEL_WIDTH,
						}}
					>
						<MetaText>{title}</MetaText>
						<SafeTitle size={30} lines={2}>
							{primaryLocation}
						</SafeTitle>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							gap: 6,
							width: 180,
						}}
					>
						<ReadableText size={22} weight={700}>
							{radiusLabel}
						</ReadableText>
						<MetaText align="right">{`Updated ${updatedAt}`}</MetaText>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						gap: 18,
						flex: 1,
						minHeight: 0,
					}}
				>
					<div
						style={{
							width: PANEL_WIDTH,
							display: "flex",
							flexDirection: "column",
							gap: 12,
							minWidth: 0,
						}}
					>
						<ReadableText size={16} weight={700}>
							{visibleAircraft.length === 1
								? "1 aircraft in range"
								: `${visibleAircraft.length} aircraft in range`}
						</ReadableText>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							{visibleAircraft.map((flight) => (
								<AircraftCard key={flight.id} flight={flight} />
							))}
						</div>
						<div
							style={{
								marginTop: "auto",
								display: "flex",
								flexDirection: "column",
								gap: 4,
							}}
						>
							{note ? <MetaText>{note}</MetaText> : null}
							<MetaText>Map © OpenStreetMap contributors</MetaText>
						</div>
					</div>
					<div
						style={{
							position: "relative",
							width: MAP_BOX_SIZE,
							height: MAP_BOX_SIZE,
							border: "2px solid #111",
							backgroundColor: "#fbfbfb",
							overflow: "hidden",
							boxSizing: "border-box",
						}}
					>
						{map.tiles.map((tile) => (
							/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */
							<img
								key={tile.id}
								src={tile.src}
								alt=""
								style={{
									position: "absolute",
									left: mapOffset + tile.left,
									top: mapOffset + tile.top,
									width: tile.size,
									height: tile.size,
									opacity: 0.28,
								}}
							/>
						))}
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								right: 0,
								bottom: 0,
								backgroundColor: "rgba(255,255,255,0.38)",
							}}
						/>
						{[74, 132, 180].map((diameter) => (
							<div
								key={diameter}
								style={{
									position: "absolute",
									left: (MAP_BOX_SIZE - diameter) / 2,
									top: (MAP_BOX_SIZE - diameter) / 2,
									width: diameter,
									height: diameter,
									borderRadius: diameter / 2,
									border: "2px solid rgba(17,17,17,0.28)",
								}}
							/>
						))}
						<div
							style={{
								position: "absolute",
								left: MAP_BOX_SIZE / 2,
								top: 0,
								bottom: 0,
								borderLeft: "2px solid rgba(17,17,17,0.16)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								top: MAP_BOX_SIZE / 2,
								borderTop: "2px solid rgba(17,17,17,0.16)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: MAP_BOX_SIZE / 2 - 10,
								top: MAP_BOX_SIZE / 2 - 10,
								width: 20,
								height: 20,
								borderRadius: 10,
								backgroundColor: "#111",
								border: "4px solid #fff",
							}}
						/>
						{visibleAircraft.map((flight) => (
							<div
								key={`marker-${flight.id}`}
								style={{
									position: "absolute",
									left: flight.x * MAP_BOX_SIZE - 17,
									top: flight.y * MAP_BOX_SIZE - 17,
									width: 34,
									height: 34,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<PlaneIcon heading={flight.heading} size={34} color="#111" />
							</div>
						))}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

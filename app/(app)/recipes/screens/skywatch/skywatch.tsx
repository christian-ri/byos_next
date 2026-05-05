import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

function PlaneIcon({
	heading,
	brightness,
	size = 28,
}: {
	heading: number;
	brightness: number;
	size?: number;
}) {
	return (
		<svg
			viewBox="0 0 64 64"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			style={{
				transform: `rotate(${heading}deg)`,
				opacity: brightness,
			}}
		>
			<path
				d="M31 3L38 24L55 31L38 36L43 60L32 49L21 60L26 36L9 31L26 24L31 3Z"
				fill="#fff"
				stroke="#fff"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function AirplaneMarker({
	x,
	y,
	heading,
	brightness,
	label,
	meta,
	detail,
}: {
	x: number;
	y: number;
	heading: number;
	brightness: number;
	label: string;
	meta: string;
	detail: string;
}) {
	return (
		<div
			style={{
				position: "absolute",
				left: `${x * 100}%`,
				top: `${y * 100}%`,
				transform: "translate(-50%, -50%)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 4,
				width: 118,
			}}
		>
			<PlaneIcon heading={heading} brightness={brightness} size={38} />
			<div
				style={{
					backgroundColor: "rgba(255,255,255,0.12)",
					padding: "4px 6px",
					width: 118,
					border: "1px solid rgba(255,255,255,0.18)",
				}}
			>
				<div className="font-blockkie leading-none text-white text-[16px]">
					{label}
				</div>
				<div className="mt-1 font-geneva9 text-[11px] leading-tight text-white">
					<div>{meta}</div>
					<div>{detail}</div>
				</div>
			</div>
		</div>
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
	const visibleAircraft = aircraft.slice(0, profile.isDense ? 6 : 8);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="h-full w-full overflow-hidden rounded-2xl border border-black bg-[#141414] text-white"
				style={{ padding: profile.padding }}
			>
				<div
					className="relative h-full w-full overflow-hidden rounded-xl"
					style={{ backgroundColor: "#1d1d1d" }}
				>
					<svg
						width="100%"
						height="100%"
						viewBox="0 0 760 420"
						preserveAspectRatio="none"
						aria-hidden="true"
						focusable="false"
						style={{ position: "absolute", inset: 0, opacity: 0.28 }}
					>
						{Array.from({ length: 12 }, (_, index) => (
							<line
								key={`h-${index}`}
								x1="0"
								y1={index * 36}
								x2="760"
								y2={index * 36}
								stroke="#ffffff"
								strokeWidth="1"
								strokeDasharray="2 4"
							/>
						))}
						{Array.from({ length: 12 }, (_, index) => (
							<line
								key={`v-${index}`}
								x1={index * 64}
								y1="0"
								x2={index * 64}
								y2="420"
								stroke="#ffffff"
								strokeWidth="1"
								strokeDasharray="2 4"
							/>
						))}
					</svg>
					<div
						style={{
							position: "absolute",
							right: 16,
							top: 16,
							borderRadius: 8,
							backgroundColor: "#fff",
							padding: "8px 12px",
							color: "#000",
							fontSize: 14,
						}}
					>
						airplanes.live
					</div>
					<div
						className="font-geneva9 uppercase"
						style={{
							position: "absolute",
							left: 24,
							top: 18,
							letterSpacing: "0.22em",
							fontSize: 12,
							opacity: 0.7,
						}}
					>
						live radar
					</div>
					<div
						className="font-geneva9"
						style={{
							position: "absolute",
							left: "57%",
							top: "16%",
							fontSize: 14,
							opacity: 0.75,
						}}
					>
						{radiusLabel}
					</div>
					<div
						style={{
							position: "absolute",
							left: "56%",
							top: "19%",
							width: 28,
							height: 28,
							borderRadius: 999,
							border: "1px solid #fff",
							opacity: 0.8,
						}}
					/>
					<div
						style={{
							position: "absolute",
							left: "56.9%",
							top: "19.8%",
							width: 10,
							height: 10,
							borderRadius: 999,
							backgroundColor: "#fff",
							opacity: 0.95,
						}}
					/>

					{visibleAircraft.map((flight) => (
						<AirplaneMarker
							key={flight.id}
							x={flight.x}
							y={flight.y}
							heading={flight.heading}
							brightness={flight.brightness}
							label={clampText(flight.callsign, 10)}
							meta={clampText(flight.aircraftType, 28)}
							detail={`${flight.altitudeLabel} · ${flight.speedLabel}`}
						/>
					))}

					<div
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 0,
							height: 56,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "0 20px",
							backgroundColor: "rgba(0,0,0,0.4)",
							borderTop: "1px solid rgba(255,255,255,0.2)",
						}}
					>
						<div className="flex items-center gap-3">
							<PlaneIcon heading={35} brightness={1} size={24} />
							<div className="font-blockkie leading-none">
								<span
									style={{
										fontSize: scaleText(26, profile, {
											compactBase: 20,
											denseBase: 18,
											min: 16,
											max: 26,
										}),
									}}
								>
									{title}
								</span>
							</div>
						</div>
						<div className="text-right font-geneva9 text-[16px]">
							<div>{locationLabel}</div>
							<div className="mt-1 text-[13px] opacity-80">
								Updated {updatedAt}
							</div>
						</div>
					</div>
				</div>
				<div className="mt-2 px-1 font-geneva9 text-[10px] text-white">
					{clampText(note || "", profile.isDense ? 42 : 84)}
				</div>
			</div>
		</PreSatori>
	);
}

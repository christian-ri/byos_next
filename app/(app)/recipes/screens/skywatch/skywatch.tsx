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
				alignItems: "center",
				gap: 8,
			}}
		>
			<PlaneIcon heading={heading} brightness={brightness} size={38} />
			<div
				style={{
					backgroundColor: "rgba(255,255,255,0.12)",
					padding: "4px 6px",
					minWidth: 112,
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
	const visibleAircraft = aircraft.slice(0, profile.isDense ? 6 : 10);

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
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage:
								"linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
							backgroundSize: "64px 64px",
							opacity: 0.35,
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage:
								"linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
							backgroundSize: "64px 64px",
							opacity: 0.35,
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage:
								"radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0 1px, transparent 1px)",
							backgroundSize: "120px 120px",
							opacity: 0.45,
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage:
								"radial-gradient(circle at 80% 35%, rgba(255,255,255,0.08) 0 1px, transparent 1px)",
							backgroundSize: "150px 150px",
							opacity: 0.4,
						}}
					/>
					<div
						className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-black"
						style={{ fontSize: 14 }}
					>
						airplanes.live
					</div>
					<div
						className="absolute left-6 top-5 font-geneva9 uppercase"
						style={{ letterSpacing: "0.22em", fontSize: 12, opacity: 0.7 }}
					>
						live radar
					</div>
					<div
						className="absolute left-[58%] top-[16%] font-geneva9 text-[14px]"
						style={{ opacity: 0.75 }}
					>
						{radiusLabel}
					</div>
					<div
						className="absolute left-[56%] top-[19%] h-7 w-7 rounded-full border border-white"
						style={{ opacity: 0.8 }}
					/>
					<div
						className="absolute left-[56.9%] top-[19.8%] h-[10px] w-[10px] rounded-full bg-white"
						style={{ opacity: 0.95 }}
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
						className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5"
						style={{
							height: 56,
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
				<div className="mt-2 px-1 font-geneva9 text-[11px] text-white">
					{clampText(note || "", profile.isDense ? 52 : 100)}
				</div>
			</div>
		</PreSatori>
	);
}

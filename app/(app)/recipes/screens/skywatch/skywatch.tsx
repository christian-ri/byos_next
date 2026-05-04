import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

function headingTransform(heading: number) {
	return `rotate(${heading}deg)`;
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
	const visibleAircraft = aircraft.slice(0, profile.isDense ? 5 : 8);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full gap-4 border border-black bg-white"
				style={{ padding: profile.padding }}
			>
				<div className="relative flex-[1.05] rounded-2xl border border-black bg-[#f4f4f2]">
					<div className="absolute left-4 top-4 font-blockkie leading-none">
						<span
							style={{
								fontSize: scaleText(28, profile, {
									compactBase: 20,
									denseBase: 16,
									min: 14,
									max: 28,
								}),
							}}
						>
							{title}
						</span>
					</div>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="relative h-[78%] w-[78%] rounded-full border border-black">
							<div className="absolute inset-[16%] rounded-full border border-gray-400" />
							<div className="absolute inset-[33%] rounded-full border border-gray-300" />
							<div className="absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-300" />
							<div className="absolute inset-y-1/2 left-0 h-px w-full -translate-y-1/2 bg-gray-300" />
							{visibleAircraft.map((flight) => (
								<div
									key={flight.id}
									style={{
										position: "absolute",
										left: `${flight.x * 100}%`,
										top: `${flight.y * 100}%`,
										transform: "translate(-50%, -50%)",
									}}
									className="flex flex-col items-center"
								>
									<div
										className="h-4 w-4 rounded-full border border-black bg-black"
										style={{ transform: headingTransform(flight.heading) }}
									/>
									<div
										className="mt-1 font-geneva9 text-center"
										style={{
											fontSize: scaleText(11, profile, {
												compactBase: 9,
												denseBase: 8,
												min: 8,
												max: 11,
											}),
											maxWidth: 54,
										}}
									>
										{clampText(flight.callsign, 8)}
									</div>
								</div>
							))}
						</div>
					</div>
					<div
						className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-geneva9"
						style={{
							fontSize: scaleText(14, profile, {
								compactBase: 11,
								denseBase: 9,
								min: 8,
								max: 14,
							}),
						}}
					>
						<span>{locationLabel}</span>
						<span>{radiusLabel}</span>
					</div>
				</div>

				<div className="flex flex-1 flex-col rounded-2xl border border-black p-4">
					<div className="border-b border-black pb-3">
						<div className="font-blockkie leading-none text-[28px]">
							Live Traffic
						</div>
						<div className="mt-2 font-geneva9 text-[14px]">
							Updated {updatedAt}
						</div>
					</div>
					<div className="flex flex-1 flex-col gap-3 pt-3">
						{visibleAircraft.map((flight) => (
							<div
								key={`list-${flight.id}`}
								className="flex items-center justify-between border-b border-gray-200 pb-2"
							>
								<div className="flex flex-col">
									<span className="font-blockkie leading-none text-[22px]">
										{clampText(flight.callsign, 14)}
									</span>
									<span className="mt-1 font-geneva9 text-[12px]">
										{flight.status}
									</span>
								</div>
								<div className="text-right font-geneva9 text-[12px]">
									<div>{flight.altitudeFt.toLocaleString("en-US")} ft</div>
									<div>{flight.speedKt} kt</div>
								</div>
							</div>
						))}
					</div>
					<div className="border-t border-black pt-3 font-geneva9 text-[12px]">
						{clampText(note || "", profile.isDense ? 48 : 86)}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

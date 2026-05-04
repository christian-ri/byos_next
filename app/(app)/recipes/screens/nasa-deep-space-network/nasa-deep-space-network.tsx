import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { DsnRecipeData } from "./getData";

export default function NasaDeepSpaceNetwork({
	updatedAt,
	note,
	stations,
	width = 800,
	height = 480,
}: DsnRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const visibleCrafts = profile.isDense ? 2 : 3;
	const stationColumns = profile.isPortrait ? 1 : profile.isDense ? 2 : 3;
	const metaSize = scaleText(16, profile, {
		compactBase: 12,
		denseBase: 9,
		min: 8,
		max: 16,
	});

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full flex-col border border-black bg-white"
				style={{ padding: profile.padding }}
			>
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div className="flex flex-col">
						<span
							className="font-geneva9 uppercase tracking-[0.3em]"
							style={{
								fontSize: scaleText(18, profile, {
									compactBase: 14,
									denseBase: 11,
									min: 10,
									max: 18,
								}),
							}}
						>
							NASA
						</span>
						<span
							className="mt-2 font-blockkie leading-none"
							style={{
								fontSize: scaleText(60, profile, {
									compactBase: 40,
									denseBase: 28,
									min: 24,
									max: 60,
								}),
								maxWidth: profile.isPortrait
									? width - profile.padding * 2
									: 340,
							}}
						>
							Deep Space Network
						</span>
						<span
							className="mt-2 font-geneva9"
							style={{
								fontSize: scaleText(20, profile, {
									compactBase: 15,
									denseBase: 11,
									min: 10,
									max: 20,
								}),
							}}
						>
							Three ground stations, live traffic
						</span>
					</div>
					<div
						className="text-right font-geneva9"
						style={{
							fontSize: metaSize,
							maxWidth: profile.isDense ? 120 : 160,
						}}
					>
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{stations.length} stations online</div>
					</div>
				</div>

				<div
					className="grid flex-1 py-4"
					style={{
						gap: profile.gap,
						gridTemplateColumns: `repeat(${stationColumns}, minmax(0, 1fr))`,
					}}
				>
					{stations.map((station) => (
						<div
							key={station.name}
							className="flex flex-col rounded-xl border border-black p-4"
						>
							<div className="border-b border-black pb-3">
								<div
									className="font-blockkie leading-none"
									style={{
										fontSize: scaleText(30, profile, {
											compactBase: 22,
											denseBase: 16,
											min: 14,
											max: 30,
										}),
									}}
								>
									{clampText(station.name, profile.isDense ? 8 : 12)}
								</div>
								<div
									className="mt-2 font-geneva9"
									style={{ fontSize: metaSize }}
								>
									{station.craftCount} craft
								</div>
								<div
									className="mt-1 font-geneva9"
									style={{ fontSize: metaSize }}
								>
									{station.signalCount} signals
								</div>
							</div>

							<div className="flex flex-1 flex-col gap-3 pt-3">
								{station.crafts.slice(0, visibleCrafts).map((craft) => (
									<div
										key={`${station.name}-${craft.name}`}
										className="flex flex-col"
									>
										<span
											className="font-blockkie leading-tight"
											style={{
												fontSize: scaleText(22, profile, {
													compactBase: 16,
													denseBase: 12,
													min: 10,
													max: 22,
												}),
											}}
										>
											{clampText(craft.name, profile.isDense ? 18 : 28)}
										</span>
										<span
											className="mt-1 font-geneva9"
											style={{
												fontSize: scaleText(14, profile, {
													compactBase: 11,
													denseBase: 8,
													min: 8,
													max: 14,
												}),
											}}
										>
											Up: {clampText(craft.uplink, profile.isDense ? 14 : 22)}
										</span>
										<span
											className="mt-1 font-geneva9"
											style={{
												fontSize: scaleText(14, profile, {
													compactBase: 11,
													denseBase: 8,
													min: 8,
													max: 14,
												}),
											}}
										>
											Down:{" "}
											{clampText(craft.downlink, profile.isDense ? 16 : 24)}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div
					className="flex items-center justify-between border-t border-black pt-3 font-geneva9"
					style={{ fontSize: metaSize }}
				>
					<span>
						{clampText(
							note || "Data source: NASA DSN Now via trmnl-dsn.",
							profile.isDense ? 40 : 72,
						)}
					</span>
					{!profile.isDense ? <span>eyes.nasa.gov</span> : null}
				</div>
			</div>
		</PreSatori>
	);
}

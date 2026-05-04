import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { FlightBoardRecipeData } from "./getData";

export default function FlightBoard({
	airportName,
	airportCode,
	updatedAt,
	note,
	flights,
	width = 800,
	height = 480,
}: FlightBoardRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const useCardLayout = profile.isDense || profile.isPortrait;
	const headerMetaSize = scaleText(16, profile, {
		compactBase: 12,
		denseBase: 9,
		min: 8,
		max: 16,
	});
	const titleSize = scaleText(60, profile, {
		compactBase: 40,
		denseBase: 28,
		min: 24,
		max: 60,
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
							FlightBoard
						</span>
						<span
							className="mt-2 font-blockkie leading-none"
							style={{ fontSize: titleSize }}
						>
							{airportCode}
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
							{clampText(airportName, profile.isDense ? 30 : 54)}
						</span>
					</div>
					<div
						className="text-right font-geneva9"
						style={{
							fontSize: headerMetaSize,
							maxWidth: profile.isDense ? 120 : 160,
						}}
					>
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{flights.length} nearby aircraft</div>
					</div>
				</div>

				<div className="flex-1 py-4">
					{useCardLayout ? (
						<div
							className="grid h-full"
							style={{
								gap: profile.gap,
								gridTemplateColumns: profile.isPortrait ? "1fr" : "1fr 1fr",
								gridAutoRows: "1fr",
							}}
						>
							{flights
								.slice(0, profile.isPortrait ? 4 : 6)
								.map((flight, index) => (
									<div
										key={`${flight.callsign}-${index}`}
										className="flex flex-col rounded-xl border border-black p-3"
									>
										<div className="flex items-center justify-between border-b border-black pb-2">
											<span
												className="font-blockkie leading-none"
												style={{
													fontSize: scaleText(24, profile, {
														compactBase: 18,
														denseBase: 13,
														min: 11,
														max: 24,
													}),
												}}
											>
												{clampText(flight.callsign, 10)}
											</span>
											<span
												className="font-geneva9 uppercase"
												style={{ fontSize: headerMetaSize }}
											>
												{flight.status}
											</span>
										</div>
										<div
											className="mt-3 grid font-geneva9"
											style={{
												gap: profile.gap,
												gridTemplateColumns: "1fr 1fr",
												fontSize: scaleText(14, profile, {
													compactBase: 11,
													denseBase: 8,
													min: 8,
													max: 14,
												}),
											}}
										>
											<div>
												<div className="uppercase text-gray-500">Country</div>
												<div>{clampText(flight.country, 14)}</div>
											</div>
											<div>
												<div className="uppercase text-gray-500">Range</div>
												<div>{flight.distance}</div>
											</div>
											<div>
												<div className="uppercase text-gray-500">Altitude</div>
												<div>{flight.altitude}</div>
											</div>
											<div>
												<div className="uppercase text-gray-500">Speed</div>
												<div>{flight.speed}</div>
											</div>
										</div>
									</div>
								))}
						</div>
					) : (
						<div className="flex h-full flex-col">
							<div
								className="grid grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr] rounded-t-xl border border-black bg-black px-3 py-2 font-geneva9 uppercase tracking-[0.15em] text-white"
								style={{
									fontSize: scaleText(16, profile, {
										compactBase: 12,
										denseBase: 8,
										min: 8,
										max: 16,
									}),
								}}
							>
								<span>Callsign</span>
								<span>Country</span>
								<span>Status</span>
								<span>Altitude</span>
								<span>Speed</span>
								<span>Range</span>
							</div>
							{flights.map((flight, index) => (
								<div
									key={`${flight.callsign}-${index}`}
									className="grid grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr] border-x border-b border-black px-3 py-3 font-geneva9"
									style={{
										fontSize: scaleText(18, profile, {
											compactBase: 13,
											denseBase: 9,
											min: 8,
											max: 18,
										}),
									}}
								>
									<span>{clampText(flight.callsign, 12)}</span>
									<span>{clampText(flight.country, 14)}</span>
									<span>{flight.status}</span>
									<span>{flight.altitude}</span>
									<span>{flight.speed}</span>
									<span>{flight.distance}</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div
					className="flex items-center justify-between border-t border-black pt-3 font-geneva9"
					style={{ fontSize: headerMetaSize }}
				>
					<span>
						{clampText(
							note ||
								"Airport activity approximation powered by OpenSky live state vectors.",
							profile.isDense ? 42 : 78,
						)}
					</span>
					{!profile.isDense ? <span>Live state vectors</span> : null}
				</div>
			</div>
		</PreSatori>
	);
}

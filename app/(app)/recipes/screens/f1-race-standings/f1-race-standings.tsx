import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import fontData from "@/components/bitmap-font/bitmap-font.json";
import { BitmapText } from "@/components/bitmap-font/bitmap-text";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

function compactDriverName(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length <= 2) {
		return name;
	}
	return `${parts[0]} ${parts[parts.length - 1]}`;
}

export default function F1RaceStandings({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	nextRaceTrackImageUrl,
	driverStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const leftWidth = profile.isCompact ? 220 : 232;
	const rightWidth = width - profile.padding * 2 - leftWidth - profile.gap;
	const rowNameSize = scaleText(18, profile, {
		compactBase: 16,
		denseBase: 14,
		min: 13,
		max: 18,
	});

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding, gap: profile.gap }}
			>
				<div
					className="flex h-full flex-col rounded-2xl bg-white"
					style={{
						width: leftWidth,
						border: "1px solid #111",
						padding: 16,
						flexShrink: 0,
					}}
				>
					<div
						className="font-geneva9 uppercase"
						style={{
							fontSize: 12,
							letterSpacing: "0.18em",
							borderBottom: "1px solid #111",
							paddingBottom: 8,
							color: "#111",
						}}
					>
						Next Race
					</div>

					<div
						className="mt-4 flex items-center justify-center"
						style={{ minHeight: 156 }}
					>
						{nextRaceTrackImageUrl ? (
							// biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs
							<img
								src={nextRaceTrackImageUrl}
								alt={nextRaceName}
								style={{
									width: "100%",
									maxWidth: 180,
									maxHeight: 132,
									objectFit: "contain",
								}}
							/>
						) : (
							<div
								className="flex items-center justify-center rounded-2xl border border-black"
								style={{ width: 180, height: 124 }}
							>
								<span className="font-blockkie text-[24px]">F1</span>
							</div>
						)}
					</div>

					<div
						className="mt-3 leading-none"
						style={{
							minHeight: 56,
						}}
					>
						<BitmapText
							text={clampText(nextRaceName, 18)}
							fontData={fontData}
							gridSize="8x16"
							scale={profile.isCompact ? 2 : 3}
							gap={0}
						/>
					</div>

					<div className="mt-5 flex gap-6">
						<div className="font-geneva9">
							<div className="text-[12px] text-[#6b7280]">Race Date</div>
							<div className="mt-1 font-blockkie text-[18px] leading-none">
								{nextRaceDate}
							</div>
						</div>
						<div className="font-geneva9">
							<div className="text-[12px] text-[#6b7280]">Round</div>
							<div className="mt-1 font-blockkie text-[18px] leading-none">
								{nextRaceRound}
							</div>
						</div>
					</div>
				</div>

				<div
					className="flex h-full flex-col rounded-2xl bg-white"
					style={{
						width: rightWidth,
						border: "1px solid #111",
						padding: 16,
						overflow: "hidden",
					}}
				>
					<div className="flex items-end justify-between">
						<div
							className="font-blockkie leading-none"
							style={{
								fontSize: scaleText(24, profile, {
									compactBase: 20,
									denseBase: 18,
									min: 16,
									max: 24,
								}),
							}}
						>
							Driver Standings {seasonLabel.replace(" season", "")}
						</div>
						<div className="font-geneva9 text-[12px] text-[#4b5563]">
							Updated {updatedAt}
						</div>
					</div>

					<div className="mt-3 flex flex-1 flex-col">
						{driverStandings.map((driver, index) => (
							<div
								key={`${driver.position}-${driver.name}`}
								className="flex items-center justify-between"
								style={{
									padding: "10px 0",
									borderBottom:
										index === driverStandings.length - 1
											? "none"
											: "1px solid #d9d9d9",
									gap: 12,
								}}
							>
								<div
									className="flex items-center"
									style={{ gap: 12, flex: 1, minWidth: 0 }}
								>
									<div
										className="font-blockkie leading-none"
										style={{ width: 22, fontSize: 18, flexShrink: 0 }}
									>
										{driver.position}
									</div>
									<div
										className="overflow-hidden rounded-full border border-[#d1d5db] bg-[#efefef]"
										style={{ width: 42, height: 42, flexShrink: 0 }}
									>
										{driver.headshotUrl ? (
											// biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs
											<img
												src={driver.headshotUrl}
												alt={driver.name}
												style={{
													width: "100%",
													height: "100%",
													objectFit: "cover",
												}}
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center font-geneva9 text-[11px]">
												{driver.teamBadge}
											</div>
										)}
									</div>
									<div
										className="flex flex-col"
										style={{ flex: 1, minWidth: 0, maxWidth: rightWidth - 150 }}
									>
										<div
											className="font-blockkie leading-none"
											style={{ fontSize: rowNameSize }}
										>
											{clampText(compactDriverName(driver.name), 15)}
										</div>
										<div
											className="mt-1 font-geneva9 text-[#4b5563]"
											style={{ fontSize: 12 }}
										>
											{clampText(driver.team, 14)}
										</div>
									</div>
								</div>
								<div
									className="font-blockkie leading-none"
									style={{
										width: 52,
										fontSize: 22,
										textAlign: "right",
										flexShrink: 0,
									}}
								>
									{driver.points}
								</div>
							</div>
						))}
					</div>

					<div className="mt-3 font-geneva9 text-[11px] text-[#4b5563]">
						{clampText(note || "Driver standings via OpenF1.", 92)}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

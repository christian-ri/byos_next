import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

export default function F1WeekendTeams({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	nextRaceTrackImageUrl,
	schedule,
	teamStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const leftWidth = profile.isCompact ? 270 : 286;
	const rightWidth = width - profile.padding * 2 - leftWidth - profile.gap;
	const groupedSchedule = schedule.reduce<Record<string, typeof schedule>>(
		(acc, item) => {
			if (!acc[item.day]) acc[item.day] = [];
			acc[item.day].push(item);
			return acc;
		},
		{},
	);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding, gap: profile.gap }}
			>
				<div
					className="flex h-full flex-col"
					style={{ width: leftWidth, gap: profile.gap, flexShrink: 0 }}
				>
					<div
						className="rounded-2xl bg-white"
						style={{ border: "1px solid #111", padding: 16 }}
					>
						<div
							className="font-geneva9 uppercase"
							style={{
								fontSize: 12,
								letterSpacing: "0.18em",
								borderBottom: "1px solid #111",
								paddingBottom: 8,
							}}
						>
							Next Race
						</div>
						<div
							className="mt-4 flex items-center justify-center"
							style={{ minHeight: 138 }}
						>
							{nextRaceTrackImageUrl ? (
								// biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs
								<img
									src={nextRaceTrackImageUrl}
									alt={nextRaceName}
									style={{
										width: "100%",
										maxWidth: 186,
										maxHeight: 126,
										objectFit: "contain",
									}}
								/>
							) : (
								<div
									className="flex items-center justify-center rounded-2xl border border-black"
									style={{ width: 186, height: 122 }}
								>
									<span className="font-blockkie text-[24px]">F1</span>
								</div>
							)}
						</div>
						<div className="mt-2 font-blockkie text-[22px] leading-none">
							{clampText(nextRaceName, 18)}
						</div>
						<div className="mt-4 flex gap-6">
							<div className="font-geneva9">
								<div className="text-[12px] text-[#6b7280]">Race Date</div>
								<div className="mt-1 font-blockkie text-[17px] leading-none">
									{nextRaceDate}
								</div>
							</div>
							<div className="font-geneva9">
								<div className="text-[12px] text-[#6b7280]">Round</div>
								<div className="mt-1 font-blockkie text-[17px] leading-none">
									{nextRaceRound}
								</div>
							</div>
						</div>
					</div>

					<div
						className="flex-1 rounded-2xl bg-white"
						style={{
							border: "1px solid #111",
							padding: 16,
							overflow: "hidden",
						}}
					>
						<div className="font-blockkie text-[22px] leading-none">
							Schedule
						</div>
						<div className="mt-4 flex flex-col gap-4">
							{Object.entries(groupedSchedule).map(([day, sessions]) => (
								<div key={day}>
									<div
										className="font-geneva9 uppercase"
										style={{ fontSize: 12, letterSpacing: "0.16em" }}
									>
										{day}
									</div>
									<div className="mt-2 flex flex-col gap-2">
										{sessions.map((item) => (
											<div
												key={`${day}-${item.label}-${item.time}`}
												className="flex items-center justify-between"
											>
												<div className="font-geneva9 text-[15px]">
													{clampText(item.label, 16)}
												</div>
												<div className="font-blockkie text-[16px] leading-none">
													{item.time}
												</div>
											</div>
										))}
									</div>
								</div>
							))}
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
							Constructor Standings {seasonLabel.replace(" season", "")}
						</div>
						<div className="font-geneva9 text-[12px] text-[#4b5563]">
							Updated {updatedAt}
						</div>
					</div>

					<div className="mt-4 flex flex-1 flex-col">
						{teamStandings.map((team, index) => (
							<div
								key={`${team.position}-${team.team}`}
								className="flex items-center justify-between"
								style={{
									padding: "14px 0",
									borderBottom:
										index === teamStandings.length - 1
											? "none"
											: "1px solid #d9d9d9",
								}}
							>
								<div className="flex items-center gap-4">
									<div
										className="font-blockkie leading-none"
										style={{ width: 26, fontSize: 18 }}
									>
										{team.position}
									</div>
									<div
										className="font-blockkie leading-none"
										style={{
											fontSize: scaleText(22, profile, {
												compactBase: 18,
												denseBase: 16,
												min: 14,
												max: 22,
											}),
										}}
									>
										{clampText(team.team, 20)}
									</div>
								</div>
								<div className="font-blockkie text-[22px] leading-none">
									{team.points}
								</div>
							</div>
						))}
					</div>

					<div className="mt-3 font-geneva9 text-[11px] text-[#4b5563]">
						{clampText(note || "Schedule and team standings via OpenF1.", 100)}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

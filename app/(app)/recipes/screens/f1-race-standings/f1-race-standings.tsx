import {
	clampText,
	getBitmapLayoutProfile,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

function TeamBadge({ label }: { label: string }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: 36,
				height: 36,
				borderRadius: "18px",
				backgroundColor: "#111",
				color: "#fff",
				border: "1px solid #111",
			}}
			className="font-geneva9"
		>
			<span style={{ fontSize: label.length > 1 ? 11 : 14 }}>{label}</span>
		</div>
	);
}

export default function F1RaceStandings({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	nextRaceTrackImageUrl,
	schedule,
	driverStandings,
	teamStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
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
				className="flex h-full w-full gap-4 border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding }}
			>
				<div className="flex w-[31%] flex-col gap-4">
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
								display: "block",
							}}
						>
							Next Race
						</div>
						<div
							className="mt-4 flex items-center justify-center"
							style={{ minHeight: 142 }}
						>
							{nextRaceTrackImageUrl ? (
								// biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs
								<img
									src={nextRaceTrackImageUrl}
									alt={nextRaceName}
									style={{
										width: "100%",
										maxWidth: 220,
										maxHeight: 128,
										objectFit: "contain",
									}}
								/>
							) : (
								<div
									className="flex items-center justify-center rounded-2xl border border-black"
									style={{ width: 220, height: 120 }}
								>
									<span className="font-blockkie text-[26px]">F1</span>
								</div>
							)}
						</div>
						<div className="mt-2 font-blockkie text-[34px] leading-none">
							{clampText(nextRaceName, 18)}
						</div>
						<div className="mt-5 flex gap-8">
							<div className="font-geneva9">
								<div className="text-[14px] text-gray-500">Race Date</div>
								<div className="mt-1 text-[22px]">{nextRaceDate}</div>
							</div>
							<div className="font-geneva9">
								<div className="text-[14px] text-gray-500">Round</div>
								<div className="mt-1 text-[22px]">{nextRaceRound}</div>
							</div>
						</div>
					</div>

					<div
						className="flex-1 rounded-2xl bg-white"
						style={{ border: "1px solid #111", padding: 16 }}
					>
						<div className="font-blockkie text-[22px] leading-none">
							Schedule
						</div>
						<div className="mt-4 flex flex-col gap-4">
							{Object.entries(groupedSchedule).map(([day, sessions]) => (
								<div key={day}>
									<div
										className="font-geneva9 uppercase text-[13px]"
										style={{ letterSpacing: "0.18em" }}
									>
										{day}
									</div>
									<div className="mt-2 flex flex-col gap-2">
										{sessions.map((item) => (
											<div
												key={`${day}-${item.label}-${item.time}`}
												className="flex items-center justify-between font-geneva9 text-[16px]"
											>
												<span>{clampText(item.label, 18)}</span>
												<span>{item.time}</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-1 flex-col gap-4">
					<div
						className="rounded-2xl bg-white"
						style={{ border: "1px solid #111", padding: 16 }}
					>
						<div className="font-blockkie text-[24px] leading-none">
							Driver Standings {seasonLabel.replace(" season", "")}
						</div>
						<div className="mt-3 flex flex-col">
							{driverStandings.map((driver) => (
								<div
									key={`${driver.position}-${driver.name}`}
									className="flex items-center justify-between"
									style={{
										padding: "11px 0",
										borderBottom: "1px solid #d9d9d9",
									}}
								>
									<div className="flex items-center gap-4">
										<span className="font-blockkie text-[20px]">
											{driver.position}
										</span>
										<div
											className="overflow-hidden rounded-full border border-gray-300 bg-[#efefef]"
											style={{ width: 44, height: 44 }}
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
												<div className="flex h-full w-full items-center justify-center font-geneva9 text-[12px]">
													{driver.teamBadge}
												</div>
											)}
										</div>
										<span className="font-blockkie text-[24px] leading-none">
											{clampText(driver.name, 24)}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<TeamBadge label={driver.teamBadge} />
										<div className="min-w-[118px] font-geneva9 text-[15px]">
											{clampText(driver.team, 14)}
										</div>
										<span className="min-w-[38px] text-right font-blockkie text-[24px]">
											{driver.points}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>

					<div
						className="flex-1 rounded-2xl bg-white"
						style={{ border: "1px solid #111", padding: 16 }}
					>
						<div className="flex items-end justify-between">
							<div className="font-blockkie text-[24px] leading-none">
								Constructor Standings {seasonLabel.replace(" season", "")}
							</div>
							<div className="font-geneva9 text-[13px]">
								Updated {updatedAt}
							</div>
						</div>
						<div className="mt-4 flex flex-col">
							{teamStandings.map((team) => (
								<div
									key={`${team.position}-${team.team}`}
									className="flex items-center justify-between"
									style={{
										padding: "14px 0",
										borderBottom: "1px solid #d9d9d9",
									}}
								>
									<div className="flex items-center gap-4">
										<span className="font-blockkie text-[20px]">
											{team.position}
										</span>
										<TeamBadge label={team.teamBadge} />
										<span className="font-blockkie text-[24px] leading-none">
											{clampText(team.team, 20)}
										</span>
									</div>
									<span className="font-blockkie text-[24px]">
										{team.points}
									</span>
								</div>
							))}
						</div>
						<div className="mt-3 font-geneva9 text-[12px]">
							{clampText(note || "", profile.isDense ? 40 : 98)}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

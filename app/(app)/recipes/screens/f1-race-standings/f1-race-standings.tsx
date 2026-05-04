import {
	clampText,
	getBitmapLayoutProfile,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

export default function F1RaceStandings({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	schedule,
	driverStandings,
	teamStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full gap-4 border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding }}
			>
				<div className="flex w-[30%] flex-col gap-4">
					<div className="rounded-2xl border border-black bg-white p-4">
						<div className="font-geneva9 text-[12px] uppercase tracking-[0.2em]">
							Next Race
						</div>
						<div className="mt-4 font-blockkie text-[34px] leading-none">
							{clampText(nextRaceName, 18)}
						</div>
						<div className="mt-4 font-geneva9 text-[16px]">{nextRaceDate}</div>
						<div className="mt-2 font-geneva9 text-[16px]">{nextRaceRound}</div>
					</div>
					<div className="flex-1 rounded-2xl border border-black bg-white p-4">
						<div className="font-blockkie text-[22px] leading-none">
							Schedule
						</div>
						<div className="mt-4 flex flex-col gap-3 font-geneva9 text-[14px]">
							{schedule.map((item) => (
								<div
									key={`${item.label}-${item.time}`}
									className="flex items-center justify-between"
								>
									<span>{item.label}</span>
									<span>{item.time}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="flex flex-1 flex-col">
					<div className="rounded-2xl border border-black bg-white p-4">
						<div className="flex items-end justify-between border-b border-gray-200 pb-3">
							<div className="font-blockkie text-[24px] leading-none">
								Driver Standings
							</div>
							<div className="font-geneva9 text-[14px]">{seasonLabel}</div>
						</div>
						<div className="mt-2 flex flex-col">
							{driverStandings.map((driver) => (
								<div
									key={`${driver.position}-${driver.name}`}
									className="flex items-center justify-between border-b border-gray-100 py-3"
								>
									<div className="flex items-center gap-4">
										<span className="font-blockkie text-[20px]">
											{driver.position}
										</span>
										<div className="flex flex-col">
											<span className="font-blockkie text-[24px] leading-none">
												{clampText(driver.name, 22)}
											</span>
											<span className="mt-1 font-geneva9 text-[14px]">
												{driver.team}
											</span>
										</div>
									</div>
									<span className="font-blockkie text-[24px]">
										{driver.points}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="mt-4 flex-1 rounded-2xl border border-black bg-white p-4">
						<div className="flex items-end justify-between border-b border-gray-200 pb-3">
							<div className="font-blockkie text-[24px] leading-none">
								Constructor Standings
							</div>
							<div className="font-geneva9 text-[14px]">
								Updated {updatedAt}
							</div>
						</div>
						<div className="mt-2 flex flex-col">
							{teamStandings.map((team) => (
								<div
									key={`${team.position}-${team.team}`}
									className="flex items-center justify-between border-b border-gray-100 py-3"
								>
									<div className="flex items-center gap-4">
										<span className="font-blockkie text-[20px]">
											{team.position}
										</span>
										<span className="font-blockkie text-[24px] leading-none">
											{clampText(team.team, 22)}
										</span>
									</div>
									<span className="font-blockkie text-[24px]">
										{team.points}
									</span>
								</div>
							))}
						</div>
						<div className="mt-4 border-t border-black pt-3 font-geneva9 text-[12px]">
							{clampText(note || "", profile.isDense ? 42 : 90)}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

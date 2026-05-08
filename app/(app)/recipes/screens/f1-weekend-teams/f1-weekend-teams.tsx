import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

export default function F1WeekendTeams({
	seasonLabel = "2026 season",
	nextRaceName = "Montreal Grand Prix",
	nextRaceDate = "May 24, 4:00 PM",
	nextRaceRound = "Round 7",
	schedule,
	teamStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const flatSchedule =
		schedule.length > 0
			? schedule.slice(0, 4)
			: [
					{ day: "Friday", time: "TBA", label: "Weekend schedule pending" },
				];
	const topTeams = teamStandings.slice(0, 4);
	const remainingTeams = teamStandings.slice(4, 11);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: profile.padding,
					display: "flex",
					gap: 14,
				}}
			>
				<div
					style={{
						width: 314,
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					<EInkCard padding={16} radius={18}>
						<MetaText>F1 Weekend</MetaText>
						<SafeTitle
							size={24}
							lines={3}
							style={{ marginTop: 8, fontFamily: "Georgia, serif" }}
						>
							{nextRaceName}
						</SafeTitle>
						<ReadableText
							size={18}
							weight={700}
							style={{ marginTop: 10, whiteSpace: "pre-line" }}
						>
							{`${nextRaceRound}\n${nextRaceDate}`}
						</ReadableText>
					</EInkCard>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<ReadableText size={22} weight={700}>
							Schedule
						</ReadableText>
						<div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
							{flatSchedule.map((entry, index) => (
								<div
									key={`${entry.day}-${entry.label}-${entry.time}-${index}`}
									style={{
										borderLeft: "6px solid #111",
										paddingLeft: 10,
									}}
								>
									<ReadableText size={16} style={{ whiteSpace: "pre-line" }}>
										{`${entry.day}\n${entry.time}\n${entry.label}`}
									</ReadableText>
								</div>
							))}
						</div>
					</EInkCard>
				</div>

				<EInkCard
					padding={16}
					radius={18}
					style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-end",
						}}
					>
						<SafeTitle size={28} lines={2}>
							Constructor Standings
						</SafeTitle>
						<MetaText>{seasonLabel.replace(" season", "")}</MetaText>
					</div>
					<MetaText>Updated {updatedAt}</MetaText>
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						{topTeams.map((team) => (
							<div
								key={`${team.position}-${team.team}`}
								style={{
									display: "flex",
									alignItems: "baseline",
									justifyContent: "space-between",
									gap: 14,
									paddingBottom: 8,
									borderBottom: "2px solid #111",
								}}
							>
								<div style={{ display: "flex", gap: 12, minWidth: 0 }}>
									<div className="font-blockkie" style={{ fontSize: 22, width: 24 }}>
										{team.position}
									</div>
									<ReadableText size={22} weight={700}>
										{team.team}
									</ReadableText>
								</div>
								<div className="font-blockkie" style={{ fontSize: 24, lineHeight: 1 }}>
									{team.points}
								</div>
							</div>
						))}
					</div>
					<div
						style={{
							borderTop: "2px solid #111",
							paddingTop: 10,
							display: "flex",
							flexDirection: "column",
							gap: 6,
						}}
					>
						<MetaText>Rest of field</MetaText>
						{remainingTeams.slice(0, 5).map((team) => (
							<div
								key={`small-${team.position}-${team.team}`}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "baseline",
									gap: 10,
								}}
							>
								<ReadableText size={16}>
									{team.position}. {team.team}
								</ReadableText>
								<ReadableText size={16} weight={700}>
									{team.points}
								</ReadableText>
							</div>
						))}
					</div>
					{note ? <MetaText>{note}</MetaText> : null}
				</EInkCard>
			</div>
		</PreSatori>
	);
}

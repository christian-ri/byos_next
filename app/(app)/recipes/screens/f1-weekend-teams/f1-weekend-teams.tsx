import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
	TeamBadge,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

export default function F1WeekendTeams({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	schedule,
	teamStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const groupedSchedule = schedule.reduce<Record<string, typeof schedule>>(
		(acc, entry) => {
			if (!acc[entry.day]) acc[entry.day] = [];
			acc[entry.day].push(entry);
			return acc;
		},
		{},
	);
	const teamColumns = [teamStandings.slice(0, 6), teamStandings.slice(6)];
	const hasSchedule = Object.keys(groupedSchedule).length > 0;
	const flatSchedule = schedule.slice(0, 6);

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
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<MetaText>F1 Weekend</MetaText>
							<SafeTitle size={32} lines={3}>
								{nextRaceName}
							</SafeTitle>
							<ReadableText size={20} weight={700}>
								{nextRaceRound}
							</ReadableText>
							<MetaText>{nextRaceDate}</MetaText>
						</div>
					</EInkCard>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							<SafeTitle size={26}>Schedule</SafeTitle>
							{hasSchedule ? (
								flatSchedule.map((entry) => (
									<div
										key={`${entry.day}-${entry.label}-${entry.time}`}
										style={{
											borderLeft: "8px solid #111",
											paddingLeft: 10,
											display: "flex",
											flexDirection: "column",
											gap: 2,
										}}
									>
										<ReadableText size={16}>{entry.day}</ReadableText>
										<ReadableText size={18} weight={700}>
											{entry.time}
										</ReadableText>
										<ReadableText size={18}>{entry.label}</ReadableText>
									</div>
								))
							) : (
								<ReadableText size={18}>
									No session schedule published for this weekend yet.
								</ReadableText>
							)}
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
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
							gap: 10,
						}}
					>
						{teamColumns.map((column, columnIndex) => (
							<div
								key={`col-${columnIndex}`}
								style={{ display: "flex", flexDirection: "column", gap: 8 }}
							>
								{column.map((team) => (
									<div
										key={`${team.position}-${team.team}`}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 10,
											border: "2px solid #111",
											padding: "10px 12px",
											minHeight: 54,
										}}
									>
										<div
											className="font-blockkie"
											style={{ fontSize: 20, width: 22 }}
										>
											{team.position}
										</div>
										<TeamBadge team={team.team} size={30} />
										<div style={{ flex: 1, minWidth: 0, maxWidth: 126 }}>
											<ReadableText size={18} weight={700}>
												{team.team}
											</ReadableText>
										</div>
										<div
											className="font-blockkie"
											style={{
												fontSize: 22,
												lineHeight: 1,
												width: 34,
												textAlign: "right",
											}}
										>
											{team.points}
										</div>
									</div>
								))}
							</div>
						))}
					</div>
					{note ? <MetaText>{note}</MetaText> : null}
				</EInkCard>
			</div>
		</PreSatori>
	);
}

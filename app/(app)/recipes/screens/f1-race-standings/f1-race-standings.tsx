import {
	EInkCard,
	META_TEXT,
	MetaText,
	ReadableText,
	SafeTitle,
	TeamBadge,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

export default function F1RaceStandings({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	driverStandings,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const leftWidth = 286;

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
						width: leftWidth,
						display: "flex",
						flexDirection: "column",
						gap: 14,
					}}
				>
					<EInkCard
						padding={16}
						radius={18}
						style={{ display: "flex", flexDirection: "column", gap: 10 }}
					>
						<MetaText>F1 Driver Standings</MetaText>
						<SafeTitle size={34} lines={3}>
							{nextRaceName}
						</SafeTitle>
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							<ReadableText size={16} weight={700}>
								{nextRaceRound}
							</ReadableText>
							<MetaText>{nextRaceDate}</MetaText>
							<MetaText>Updated {updatedAt}</MetaText>
						</div>
					</EInkCard>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<MetaText>{seasonLabel}</MetaText>
							<ReadableText size={20}>
								Track and event names wrap instead of clipping, and team
								portraits are replaced with high-contrast monochrome badges for
								1-bit eInk.
							</ReadableText>
							{note ? <MetaText size={META_TEXT}>{note}</MetaText> : null}
						</div>
					</EInkCard>
				</div>

				<EInkCard
					padding={16}
					radius={18}
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "flex-end",
						}}
					>
						<SafeTitle size={28} lines={2}>
							Top Drivers
						</SafeTitle>
						<MetaText>{seasonLabel.replace(" season", "")}</MetaText>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						{driverStandings.map((driver) => (
							<div
								key={`${driver.position}-${driver.name}`}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 12,
									border: "2px solid #111",
									padding: "10px 12px",
									minHeight: 58,
								}}
							>
								<div
									className="font-blockkie"
									style={{ fontSize: 22, width: 24 }}
								>
									{driver.position}
								</div>
								<TeamBadge team={driver.team} size={34} />
								<div
									style={{
										flex: 1,
										display: "flex",
										flexDirection: "column",
										gap: 4,
										minWidth: 0,
									}}
								>
									<ReadableText size={20} weight={700}>
										{driver.name}
									</ReadableText>
									<MetaText>{driver.team}</MetaText>
								</div>
								<div style={{ textAlign: "right", minWidth: 54 }}>
									<div
										className="font-blockkie"
										style={{ fontSize: 24, lineHeight: 1 }}
									>
										{driver.points}
									</div>
									<MetaText>pts</MetaText>
								</div>
							</div>
						))}
					</div>
				</EInkCard>
			</div>
		</PreSatori>
	);
}

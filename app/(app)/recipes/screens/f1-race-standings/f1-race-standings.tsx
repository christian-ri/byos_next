import {
	EInkCard,
	META_TEXT,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import fontData from "@/components/bitmap-font/bitmap-font.json";
import { BitmapText } from "@/components/bitmap-font/bitmap-text";
import { PreSatori } from "@/utils/pre-satori";
import type { F1RaceStandingsRecipeData } from "./getData";

function splitHeadline(value: string) {
	const words = value.trim().split(/\s+/).filter(Boolean);
	if (words.length <= 2) {
		return [value];
	}

	if (words.length === 3) {
		return [words[0], words.slice(1).join(" ")];
	}

	let bestIndex = 1;
	let bestDelta = Number.POSITIVE_INFINITY;
	for (let index = 1; index < words.length; index += 1) {
		const left = words.slice(0, index).join(" ");
		const right = words.slice(index).join(" ");
		const delta = Math.abs(left.length - right.length);
		if (delta < bestDelta) {
			bestDelta = delta;
			bestIndex = index;
		}
	}

	return [
		words.slice(0, bestIndex).join(" "),
		words.slice(bestIndex).join(" "),
	];
}

export default function F1RaceStandings({
	seasonLabel,
	nextRaceName,
	nextRaceDate,
	nextRaceRound,
	nextRaceTrackImageUrl,
	driverStandings,
	note,
	width = 800,
	height = 480,
}: F1RaceStandingsRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const leftWidth = 286;
	const raceNameLines = splitHeadline(nextRaceName);

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
						padding={14}
						radius={18}
						style={{
							height: 198,
							flexShrink: 0,
							display: "flex",
							flexDirection: "column",
							gap: 10,
						}}
					>
						<MetaText>F1 Driver Standings</MetaText>
						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							{raceNameLines.map((line) => (
								<BitmapText
									key={line}
									text={line}
									fontData={fontData}
									gridSize="7x8"
									scale={1.7}
									gap={0}
								/>
							))}
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
							<ReadableText size={16} weight={700}>
								{nextRaceRound}
							</ReadableText>
							<MetaText size={15}>{nextRaceDate}</MetaText>
						</div>
					</EInkCard>

					<EInkCard padding={14} radius={18} style={{ flex: 1 }}>
						{nextRaceTrackImageUrl ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 6,
									height: "100%",
								}}
							>
								<div
									style={{
										flex: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										padding: 0,
									}}
								>
									{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
									<img
										src={nextRaceTrackImageUrl}
										alt={nextRaceName}
										style={{
											width: "100%",
											height: "100%",
											objectFit: "contain",
											display: "block",
										}}
									/>
								</div>
								{note ? (
									<MetaText size={14} style={{ lineHeight: 1.05 }}>
										{note}
									</MetaText>
								) : null}
							</div>
						) : (
							<div
								style={{ display: "flex", flexDirection: "column", gap: 10 }}
							>
								<ReadableText size={20}>{nextRaceName}</ReadableText>
								{note ? <MetaText size={META_TEXT}>{note}</MetaText> : null}
							</div>
						)}
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
								<div
									style={{
										width: 42,
										height: 42,
										borderRadius: 21,
										border: "2px solid #111",
										overflow: "hidden",
										flexShrink: 0,
										backgroundColor: "#fff",
									}}
								>
									{driver.headshotUrl ? (
										/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */
										<img
											src={driver.headshotUrl}
											alt={driver.name}
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
												display: "block",
											}}
										/>
									) : null}
								</div>
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

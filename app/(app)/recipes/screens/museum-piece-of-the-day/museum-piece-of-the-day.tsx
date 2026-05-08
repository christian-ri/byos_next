import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { MuseumPieceRecipeData } from "./getData";

export default function MuseumPieceOfTheDay({
	title,
	label,
	updatedAt,
	artworkTitle,
	artist,
	culture,
	dateLabel,
	medium,
	department,
	imageUrl,
	showArtist,
	showCulture,
	preferPortrait,
	note,
	width = 800,
	height = 480,
}: MuseumPieceRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const imageWidth = preferPortrait ? 290 : 350;
	const titleSize = scaleText(28, profile, {
		compactBase: 24,
		denseBase: 20,
		min: 20,
		max: 28,
	});

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f5f2ec",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						gap: 12,
						borderBottom: "2px solid #111",
						paddingBottom: 10,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<MetaText>{title}</MetaText>
						<SafeTitle size={30} lines={1}>
							{label}
						</SafeTitle>
					</div>
					<MetaText align="right">{`Updated ${updatedAt}`}</MetaText>
				</div>
				<div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
					<div
						style={{
							width: imageWidth,
							border: "2px solid #111",
							backgroundColor: "#fff",
							padding: 10,
							boxSizing: "border-box",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
						<img
							src={imageUrl}
							alt={artworkTitle}
							style={{
								width: "100%",
								height: "100%",
								objectFit: preferPortrait ? "contain" : "cover",
								display: "block",
							}}
						/>
					</div>
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: 12,
							minWidth: 0,
						}}
					>
						<div
							style={{
								border: "2px solid #111",
								backgroundColor: "#fff",
								padding: "14px 16px",
								display: "flex",
								flexDirection: "column",
								gap: 10,
							}}
						>
							<SafeTitle size={titleSize} lines={3}>
								{artworkTitle}
							</SafeTitle>
							{showArtist ? (
								<ReadableText size={20} weight={700}>
									{artist}
								</ReadableText>
							) : null}
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr",
									gap: 10,
								}}
							>
								<div>
									<MetaText>Date</MetaText>
									<ReadableText size={18} weight={700}>
										{dateLabel}
									</ReadableText>
								</div>
								<div>
									<MetaText>Department</MetaText>
									<ReadableText size={18} weight={700}>
										{department}
									</ReadableText>
								</div>
							</div>
						</div>
						<div
							style={{
								border: "2px solid #111",
								backgroundColor: "#fff",
								padding: "12px 16px",
								display: "flex",
								flexDirection: "column",
								gap: 8,
								flex: 1,
							}}
						>
							<div>
								<MetaText>Medium</MetaText>
								<ReadableText size={18}>{clampText(medium, 110)}</ReadableText>
							</div>
							{showCulture ? (
								<div>
									<MetaText>Culture</MetaText>
									<ReadableText size={18}>{culture}</ReadableText>
								</div>
							) : null}
							<div style={{ marginTop: "auto" }}>
								<MetaText>
									{note || "Open-access artwork selected for today."}
								</MetaText>
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

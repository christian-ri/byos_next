import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { clampText } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { MuseumPieceRecipeData } from "./getData";

function FramedPanel({
	children,
	style,
	padding = 16,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
	padding?: number;
}) {
	return (
		<div
			style={{
				position: "relative",
				backgroundColor: "#fff",
				padding,
				boxSizing: "border-box",
				...style,
			}}
		>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					height: 3,
					backgroundColor: "#111",
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					height: 3,
					backgroundColor: "#111",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					width: 3,
					backgroundColor: "#111",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					bottom: 0,
					right: 0,
					width: 3,
					backgroundColor: "#111",
				}}
			/>
			<div
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					height: "100%",
				}}
			>
				{children}
			</div>
		</div>
	);
}

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
	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f5f2ec",
					padding: 18,
					display: "flex",
					flexDirection: "column",
					gap: 12,
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						gap: 12,
						paddingBottom: 12,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<MetaText size={15}>{title}</MetaText>
						<SafeTitle size={31} lines={1}>
							{label}
						</SafeTitle>
					</div>
					<MetaText size={15} align="right">{`Updated ${updatedAt}`}</MetaText>
				</div>
				<div
					style={{
						height: 3,
						width: "100%",
						backgroundColor: "#111",
					}}
				/>
				<div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
					<FramedPanel
						padding={14}
						style={{
							width: preferPortrait ? 320 : 365,
							flexShrink: 0,
							overflow: "hidden",
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
								maxWidth: "100%",
								maxHeight: "100%",
								width: "100%",
								height: "100%",
								objectFit: preferPortrait ? "contain" : "cover",
								display: "block",
							}}
						/>
					</FramedPanel>
					<div
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							gap: 18,
							minWidth: 0,
						}}
					>
						<FramedPanel
							padding={20}
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 14,
							}}
						>
							<SafeTitle size={31} lines={3}>
								{artworkTitle}
							</SafeTitle>
							{showArtist ? (
								<ReadableText size={21} weight={700}>
									{artist}
								</ReadableText>
							) : null}
							<div style={{ display: "flex", gap: 18 }}>
								<div
									style={{
										flex: 1,
										display: "flex",
										flexDirection: "column",
										gap: 4,
									}}
								>
									<div style={{ display: "block" }}>
										<MetaText size={14}>Date</MetaText>
									</div>
									<div style={{ display: "block" }}>
										<ReadableText size={19} weight={700}>
											{dateLabel}
										</ReadableText>
									</div>
								</div>
								<div
									style={{
										flex: 1,
										display: "flex",
										flexDirection: "column",
										gap: 4,
									}}
								>
									<div style={{ display: "block" }}>
										<MetaText size={14}>Department</MetaText>
									</div>
									<div style={{ display: "block" }}>
										<ReadableText size={19} weight={700}>
											{department}
										</ReadableText>
									</div>
								</div>
							</div>
						</FramedPanel>
						<FramedPanel
							padding={20}
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 14,
								flex: 1,
							}}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
								<div style={{ display: "block" }}>
									<MetaText size={14}>Medium</MetaText>
								</div>
								<div style={{ display: "block" }}>
									<ReadableText size={19}>
										{clampText(medium, 110)}
									</ReadableText>
								</div>
							</div>
							{showCulture ? (
								<div
									style={{ display: "flex", flexDirection: "column", gap: 4 }}
								>
									<div style={{ display: "block" }}>
										<MetaText size={14}>Culture</MetaText>
									</div>
									<div style={{ display: "block" }}>
										<ReadableText size={19}>{culture}</ReadableText>
									</div>
								</div>
							) : null}
							<div style={{ marginTop: "auto", paddingTop: 8 }}>
								<MetaText size={14}>
									{note || "Open-access artwork selected for today."}
								</MetaText>
							</div>
						</FramedPanel>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

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
import type { OnThisDayRecipeData } from "./getData";

function EventCard({
	item,
	showYearLarge,
	highlight = false,
}: {
	item: OnThisDayRecipeData["items"][number];
	showYearLarge: boolean;
	highlight?: boolean;
}) {
	return (
		<div
			style={{
				border: "2px solid #111",
				padding: highlight ? "16px 18px" : "12px 14px",
				backgroundColor: "#fff",
				display: "flex",
				gap: 16,
				minHeight: highlight ? 180 : 90,
			}}
		>
			<div
				style={{
					width: showYearLarge ? (highlight ? 120 : 88) : 64,
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "flex-start",
					flexShrink: 0,
				}}
			>
				<SafeTitle size={showYearLarge ? (highlight ? 40 : 32) : 22} lines={2}>
					{item.year}
				</SafeTitle>
			</div>
			<div
				style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}
			>
				<ReadableText size={highlight ? 22 : 18} weight={700}>
					{clampText(item.text, highlight ? 210 : 150)}
				</ReadableText>
				<MetaText>{item.context}</MetaText>
			</div>
		</div>
	);
}

export default function OnThisDay({
	title,
	dateLabel,
	updatedAt,
	mode,
	showYearLarge,
	items,
	note,
	width = 800,
	height = 480,
}: OnThisDayRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const headerTitleSize = scaleText(34, profile, {
		compactBase: 28,
		denseBase: 24,
		min: 24,
		max: 34,
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
						<SafeTitle size={headerTitleSize} lines={1}>
							{dateLabel}
						</SafeTitle>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<ReadableText size={18} weight={700} align="right">
							{mode === "top3" ? "Top 3" : "Highlight"}
						</ReadableText>
						<MetaText align="right">{`Updated ${updatedAt}`}</MetaText>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 10,
						flex: 1,
						minHeight: 0,
					}}
				>
					{items.map((item, index) => (
						<EventCard
							key={`${item.year}-${index}`}
							item={item}
							showYearLarge={showYearLarge}
							highlight={mode === "highlight"}
						/>
					))}
					<div style={{ marginTop: "auto" }}>
						<MetaText>
							{note || "Historical context from today's Wikimedia feed."}
						</MetaText>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

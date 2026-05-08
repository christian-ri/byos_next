import { PreSatori } from "@/utils/pre-satori";
import { WikipediaData } from "./getData";

export default async function Wikipedia({
	title = "Wikipedia Article",
	extract = "Article content is unavailable.",
	thumbnail,
	content_urls,
	fullurl,
	displaytitle,
	width = 800,
	height = 480,
}: WikipediaData & { width?: number; height?: number }) {
	"use cache";

	const safeTitle =
		title ||
		displaytitle?.replace(/<[^>]*>?/g, "").trim() ||
		"Wikipedia Article";
	const safeExtract = extract || "Article content is unavailable.";
	const safeContentUrl =
		fullurl || content_urls?.desktop?.page || "https://en.wikipedia.org";
	const hasValidThumbnail =
		typeof thumbnail?.source === "string" &&
		thumbnail.source.startsWith("https://") &&
		typeof thumbnail.width === "number" &&
		thumbnail.width > 0 &&
		typeof thumbnail.height === "number" &&
		thumbnail.height > 0;
	const truncatedExtract =
		safeExtract.length > 560
			? `${safeExtract.slice(0, 560).trim()}...`
			: safeExtract;
	const formattedDate = new Date().toLocaleDateString("en-GB", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					border: "1px solid #111",
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div style={{ padding: 16, borderBottom: "2px solid #111" }}>
					<div
						className="font-blockkie"
						style={{ fontSize: 52, lineHeight: 1 }}
					>
						{safeTitle}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						gap: 16,
						flex: 1,
						padding: 16,
						boxSizing: "border-box",
					}}
				>
					<div
						className="font-geneva9"
						style={{ fontSize: 22, lineHeight: 1.55, flex: 1 }}
					>
						{truncatedExtract}
					</div>
					{hasValidThumbnail ? (
						<div style={{ width: 240 }}>
							{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
							<img
								src={thumbnail.source}
								alt={safeTitle}
								width={thumbnail.width}
								height={thumbnail.height}
								style={{
									width: 240,
									height: 300,
									objectFit: "contain",
									display: "block",
								}}
							/>
						</div>
					) : null}
				</div>

				<div
					style={{
						padding: "0 16px 16px",
						display: "flex",
						flexDirection: "column",
						gap: 8,
					}}
				>
					<div className="font-geneva9" style={{ fontSize: 12 }}>
						{safeContentUrl}
					</div>
					<div
						style={{
							border: "2px solid #111",
							borderRadius: 18,
							backgroundColor: "#fff",
							padding: 12,
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div
							className="font-blockkie"
							style={{ fontSize: 20, lineHeight: 1 }}
						>
							Wikipedia
						</div>
						<div className="font-geneva9" style={{ fontSize: 12 }}>
							Generated: {formattedDate}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

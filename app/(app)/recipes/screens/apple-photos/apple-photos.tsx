import {
	META_TEXT,
	ReadableText,
} from "@/app/(app)/recipes/screens/_shared/eink";
import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { ApplePhotosRecipeData } from "./getData";

function ClockIcon({
	size = 18,
	color = "#111",
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<circle
				cx="12"
				cy="12"
				r="8.5"
				fill="none"
				stroke={color}
				strokeWidth="2"
			/>
			<path
				d="M12 7.5v5l3.5 2"
				fill="none"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function AlbumIcon({
	size = 18,
	color = "#111",
}: {
	size?: number;
	color?: string;
}) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<rect
				x="5"
				y="7"
				width="12"
				height="10"
				rx="1.5"
				fill="none"
				stroke={color}
				strokeWidth="2"
			/>
			<rect
				x="8"
				y="5"
				width="12"
				height="10"
				rx="1.5"
				fill="none"
				stroke={color}
				strokeWidth="2"
				opacity="0.75"
			/>
		</svg>
	);
}

export default function ApplePhotos({
	title = "Apple Photos",
	imageUrl = "https://byos-nextjs.vercel.app/album/london.png",
	caption = "",
	updatedAt = "",
	currentTime = "",
	timeZoneLabel = "",
	note,
	showCaption = true,
	showTimestamp = true,
	fitMode = "cover",
	width = 800,
	height = 480,
}: ApplePhotosRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const metaSize = scaleText(META_TEXT, profile, {
		compactBase: 16,
		denseBase: 14,
		min: 14,
		max: 16,
	});
	const overlayPadding = profile.isDense ? 10 : 16;
	const timeSize = scaleText(28, profile, {
		compactBase: 24,
		denseBase: 22,
		min: 24,
		max: 30,
	});
	const overlayBackground = "rgba(17, 17, 17, 0.78)";

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="w-full h-full bg-black text-black relative overflow-hidden flex">
				{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
				<img
					src={imageUrl}
					alt={caption || title}
					width={width}
					height={height}
					className="w-full h-full absolute inset-0"
					style={{
						objectFit: fitMode,
						imageRendering: "pixelated",
						display: "block",
					}}
				/>
				{showTimestamp ? (
					<div
						className="absolute left-0 bottom-0"
						style={{ padding: overlayPadding }}
					>
						<div
							style={{
								border: "2px solid #111",
								borderRadius: 16,
								backgroundColor: overlayBackground,
								color: "#fff",
								padding: profile.isDense ? 12 : 14,
								minWidth: profile.isCompact ? 196 : 210,
								maxWidth: profile.isCompact ? 220 : 236,
							}}
						>
							<div className="flex items-start gap-3">
								<ClockIcon size={20} color="#fff" />
								<div className="flex flex-col">
									<ReadableText size={16} color="#fff">
										{title}
									</ReadableText>
									{currentTime ? (
										<div
											className="font-blockkie leading-none"
											style={{ fontSize: timeSize, color: "#fff" }}
										>
											{currentTime}
										</div>
									) : null}
									<div
										className="mt-1 font-geneva9 leading-none"
										style={{ fontSize: metaSize, color: "#fff" }}
									>
										{[timeZoneLabel, updatedAt].filter(Boolean).join(" · ")}
									</div>
								</div>
							</div>
						</div>
					</div>
				) : null}

				<div
					className="absolute right-0 bottom-0"
					style={{ padding: overlayPadding }}
				>
					<div
						style={{
							border: "2px solid #111",
							borderRadius: 16,
							backgroundColor: overlayBackground,
							color: "#fff",
							padding: profile.isDense ? 12 : 14,
							minWidth: profile.isCompact ? 208 : 232,
							maxWidth: profile.isCompact ? 236 : 272,
						}}
					>
						<div className="flex items-center gap-3">
							<AlbumIcon size={20} color="#fff" />
							<div
								className="flex flex-col items-end text-right"
								style={{ width: "100%" }}
							>
								{note ? (
									<ReadableText size={16} align="right" color="#fff">
										{clampText(note, profile.isDense ? 24 : 32)}
									</ReadableText>
								) : null}
								{showCaption && caption.trim() ? (
									<div className="mt-1">
										<ReadableText size={metaSize} align="right" color="#fff">
											{clampText(caption, profile.isDense ? 22 : 30)}
										</ReadableText>
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

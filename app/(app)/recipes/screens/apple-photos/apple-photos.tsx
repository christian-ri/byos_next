import {
	EInkCard,
	META_TEXT,
	ReadableText,
	SafeTitle,
	TITLE_TEXT,
} from "@/app/(app)/recipes/screens/_shared/eink";
import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { ApplePhotosRecipeData } from "./getData";

function ClockIcon({ size = 18 }: { size?: number }) {
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
				stroke="#111"
				strokeWidth="2"
			/>
			<path
				d="M12 7.5v5l3.5 2"
				fill="none"
				stroke="#111"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function AlbumIcon({ size = 18 }: { size?: number }) {
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
				stroke="#111"
				strokeWidth="2"
			/>
			<rect
				x="8"
				y="5"
				width="12"
				height="10"
				rx="1.5"
				fill="none"
				stroke="#111"
				strokeWidth="2"
				opacity="0.75"
			/>
		</svg>
	);
}

export default function ApplePhotos({
	title = "Apple Photos",
	albumName = "Shared Album",
	imageUrl = "https://byos-nextjs.vercel.app/album/london.png",
	caption = "Shared album preview",
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
	const titleSize = scaleText(TITLE_TEXT, profile, {
		compactBase: 28,
		denseBase: 24,
		min: 28,
		max: 36,
	});
	const albumSize = scaleText(18, profile, {
		compactBase: 17,
		denseBase: 16,
		min: 16,
		max: 18,
	});
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

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="w-full h-full bg-white text-black relative overflow-hidden flex">
				{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
				<img
					src={imageUrl}
					alt={caption || albumName}
					width={width}
					height={height}
					className="w-full h-full absolute inset-0"
					style={{
						objectFit: fitMode,
						imageRendering: "pixelated",
						display: "block",
					}}
				/>
				<div
					className="absolute left-0 top-0"
					style={{ padding: overlayPadding }}
				>
					<EInkCard
						padding={16}
						radius={16}
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 8,
							width: profile.isCompact ? 250 : 300,
						}}
					>
						<ReadableText size={16}>{title}</ReadableText>
						<SafeTitle size={titleSize} lines={2}>
							{clampText(albumName, profile.isDense ? 24 : 36)}
						</SafeTitle>
						<ReadableText size={albumSize}>Shared Album</ReadableText>
					</EInkCard>
				</div>

				{showTimestamp ? (
					<div
						className="absolute left-0 bottom-0"
						style={{ padding: overlayPadding }}
					>
						<EInkCard padding={16} radius={16}>
							<div className="flex items-center gap-3">
								<ClockIcon size={20} />
								<div className="flex flex-col">
									{currentTime ? (
										<div
											className="font-blockkie leading-none"
											style={{ fontSize: timeSize }}
										>
											{currentTime}
										</div>
									) : null}
									<div
										className="mt-1 font-geneva9 leading-none"
										style={{ fontSize: metaSize }}
									>
										{[timeZoneLabel, updatedAt].filter(Boolean).join(" · ")}
									</div>
								</div>
							</div>
						</EInkCard>
					</div>
				) : null}

				<div
					className="absolute right-0 bottom-0"
					style={{ padding: overlayPadding }}
				>
					<EInkCard
						padding={16}
						radius={16}
						style={{
							width: profile.isCompact ? 280 : 320,
						}}
					>
						<div className="flex items-center gap-3">
							<AlbumIcon size={20} />
							<div
								className="flex flex-col items-end text-right"
								style={{ width: "100%" }}
							>
								{note ? (
									<ReadableText size={16} align="right">
										{clampText(note, profile.isDense ? 28 : 40)}
									</ReadableText>
								) : null}
								{showCaption && caption.trim() ? (
									<div className="mt-1">
										<ReadableText size={metaSize} align="right">
											{clampText(caption, profile.isDense ? 28 : 44)}
										</ReadableText>
									</div>
								) : null}
							</div>
						</div>
					</EInkCard>
				</div>
			</div>
		</PreSatori>
	);
}

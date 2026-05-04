import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { ApplePhotosRecipeData } from "./getData";

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
	const titleSize = scaleText(30, profile, {
		compactBase: 24,
		denseBase: 18,
		min: 16,
		max: 30,
	});
	const subtitleSize = scaleText(16, profile, {
		compactBase: 14,
		denseBase: 11,
		min: 10,
		max: 16,
	});
	const metaSize = scaleText(14, profile, {
		compactBase: 12,
		denseBase: 10,
		min: 9,
		max: 14,
	});
	const captionSize = scaleText(18, profile, {
		compactBase: 14,
		denseBase: 12,
		min: 10,
		max: 18,
	});
	const overlayPadding = profile.isDense ? 10 : 16;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="w-full h-full bg-black text-white relative overflow-hidden flex">
				<picture className="absolute inset-0 w-full h-full">
					<source srcSet={imageUrl} />
					<img
						src={imageUrl}
						alt={caption || albumName}
						width={width}
						height={height}
						className="w-full h-full"
						style={{
							objectFit: fitMode,
							imageRendering: "pixelated",
						}}
					/>
				</picture>

				<div
					className="absolute inset-x-0 top-0 flex items-start justify-between"
					style={{ padding: overlayPadding, gap: profile.gap }}
				>
					<div
						className="rounded-xl px-4 py-3 flex flex-col"
						style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
					>
						<span
							className="font-blockkie leading-none"
							style={{ fontSize: titleSize }}
						>
							{title}
						</span>
						<span
							className="mt-1 text-gray-200 font-geneva9"
							style={{ fontSize: subtitleSize }}
						>
							{clampText(albumName, profile.isDense ? 20 : 30)}
						</span>
					</div>

					{showTimestamp && (
						<div
							className="rounded-xl px-4 py-3 text-right text-gray-100 font-geneva9"
							style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
						>
							{currentTime && (
								<div
									className="leading-none"
									style={{
										fontSize: scaleText(22, profile, {
											compactBase: 18,
											denseBase: 14,
											min: 12,
											max: 22,
										}),
									}}
								>
									{currentTime}
								</div>
							)}
							{timeZoneLabel && (
								<div
									className="mt-1 leading-none"
									style={{ fontSize: metaSize }}
								>
									{timeZoneLabel}
								</div>
							)}
							<div className="mt-1" style={{ fontSize: metaSize }}>
								{updatedAt}
							</div>
							{note && !profile.isDense && (
								<div
									className="mt-1 text-gray-300"
									style={{ fontSize: metaSize }}
								>
									{clampText(note, 36)}
								</div>
							)}
						</div>
					)}
				</div>

				{showCaption && caption.trim() ? (
					<div
						className="absolute inset-x-0 bottom-0"
						style={{ padding: overlayPadding }}
					>
						<div
							className="rounded-xl px-4 py-3 leading-tight font-geneva9"
							style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
						>
							<span style={{ fontSize: captionSize }}>
								{clampText(caption, profile.isDense ? 64 : 120)}
							</span>
						</div>
					</div>
				) : null}
			</div>
		</PreSatori>
	);
}

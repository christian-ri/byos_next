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
				stroke="#fff"
				strokeWidth="2"
			/>
			<path
				d="M12 7.5v5l3.5 2"
				fill="none"
				stroke="#fff"
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
				stroke="#fff"
				strokeWidth="2"
			/>
			<rect
				x="8"
				y="5"
				width="12"
				height="10"
				rx="1.5"
				fill="none"
				stroke="#fff"
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
	const overlayPadding = profile.isDense ? 10 : 16;
	const timeSize = scaleText(28, profile, {
		compactBase: 24,
		denseBase: 18,
		min: 16,
		max: 28,
	});
	const hudSubtitleSize = scaleText(15, profile, {
		compactBase: 13,
		denseBase: 10,
		min: 9,
		max: 15,
	});

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
					className="absolute left-0 top-0"
					style={{ padding: overlayPadding }}
				>
					<div
						className="rounded-xl px-4 py-3 flex flex-col"
						style={{ backgroundColor: "rgba(0, 0, 0, 0.58)" }}
					>
						<span
							className="font-blockkie leading-none"
							style={{
								fontSize: scaleText(22, profile, {
									compactBase: 18,
									denseBase: 15,
									min: 13,
									max: 22,
								}),
							}}
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
				</div>

				{showTimestamp ? (
					<div
						className="absolute left-0 bottom-0"
						style={{ padding: overlayPadding }}
					>
						<div
							className="rounded-xl px-4 py-3"
							style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}
						>
							<div className="flex items-center gap-3">
								<ClockIcon size={profile.isDense ? 16 : 18} />
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
										className="mt-1 font-geneva9 leading-none text-gray-200"
										style={{ fontSize: hudSubtitleSize }}
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
						className="rounded-xl px-4 py-3"
						style={{ backgroundColor: "rgba(0, 0, 0, 0.62)" }}
					>
						<div className="flex items-center gap-3">
							<AlbumIcon size={profile.isDense ? 16 : 18} />
							<div className="flex flex-col items-end text-right">
								{note ? (
									<div
										className="font-geneva9 leading-none text-gray-100"
										style={{ fontSize: subtitleSize }}
									>
										{clampText(note, profile.isDense ? 24 : 34)}
									</div>
								) : null}
								{showCaption && caption.trim() ? (
									<div
										className="mt-1 font-geneva9 leading-none text-gray-300"
										style={{ fontSize: metaSize }}
									>
										{clampText(caption, profile.isDense ? 26 : 42)}
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

import { PreSatori } from "@/utils/pre-satori";
import type { ApplePhotosRecipeData } from "./getData";

export default function ApplePhotos({
	title = "Apple Photos",
	albumName = "Shared Album",
	imageUrl = "https://byos-nextjs.vercel.app/album/london.png",
	caption = "Shared album preview",
	updatedAt = "",
	note,
	showCaption = true,
	showTimestamp = true,
	fitMode = "cover",
	width = 800,
	height = 480,
}: ApplePhotosRecipeData & { width?: number; height?: number }) {
	return (
		<PreSatori width={width} height={height}>
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

				<div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between">
					<div
						className="rounded-xl px-4 py-3 flex flex-col"
						style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
					>
						<span className="text-[30px] font-blockkie leading-none">
							{title}
						</span>
						<span className="text-[16px] mt-1 text-gray-200">{albumName}</span>
					</div>

					{showTimestamp && (
						<div
							className="rounded-xl px-4 py-3 text-right text-[13px] text-gray-100"
							style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
						>
							<div>{updatedAt}</div>
							{note && <div className="mt-1 text-gray-300">{note}</div>}
						</div>
					)}
				</div>

				{showCaption && caption && (
					<div className="absolute inset-x-0 bottom-0 p-4">
						<div
							className="rounded-xl px-4 py-3 text-[18px] leading-tight"
							style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
						>
							{caption}
						</div>
					</div>
				)}
			</div>
		</PreSatori>
	);
}

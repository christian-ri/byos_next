import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { NasaImageOfDayRecipeData } from "./getData";

export default function NasaImageOfTheDay({
	title,
	imageUrl,
	caption,
	date,
	updatedAt,
	note,
	width = 800,
	height = 480,
}: NasaImageOfDayRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="relative h-full w-full overflow-hidden bg-black text-white">
				<img
					src={imageUrl}
					alt={title}
					width={width}
					height={height}
					className="absolute inset-0 h-full w-full object-cover"
					style={{ imageRendering: "pixelated", display: "block" }}
				/>
				<div
					className="absolute inset-x-0 top-0 flex items-start justify-between"
					style={{ padding: profile.padding }}
				>
					<div
						className="rounded-xl px-4 py-3"
						style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
					>
						<div
							className="font-blockkie leading-none"
							style={{
								fontSize: scaleText(28, profile, {
									compactBase: 20,
									denseBase: 16,
									min: 14,
									max: 28,
								}),
							}}
						>
							{clampText(title, profile.isDense ? 22 : 34)}
						</div>
						<div className="mt-2 font-geneva9 text-[12px] text-gray-200">
							{date}
						</div>
					</div>
					<div
						className="rounded-xl px-4 py-3 text-right font-geneva9 text-[12px]"
						style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
					>
						<div>Updated {updatedAt}</div>
					</div>
				</div>

				<div
					className="absolute inset-x-0 bottom-0"
					style={{ padding: profile.padding }}
				>
					<div
						className="rounded-xl px-4 py-3 font-geneva9 leading-tight"
						style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
					>
						<div
							style={{
								fontSize: scaleText(14, profile, {
									compactBase: 11,
									denseBase: 10,
									min: 9,
									max: 14,
								}),
							}}
						>
							{clampText(caption, profile.isDense ? 120 : 220)}
						</div>
						{note ? (
							<div className="mt-2 text-[12px] text-gray-300">{note}</div>
						) : null}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

import fontData from "@/components/bitmap-font/bitmap-font.json";
import { BitmapText } from "@/components/bitmap-font/bitmap-text";
import { PreSatori } from "@/utils/pre-satori";

interface AlbumProps {
	width?: number;
	height?: number;
	params?: {
		imageUrl?: string;
	};
}

export default async function Album({
	width = 800,
	height = 480,
	params,
}: AlbumProps) {
	const imageUrl =
		params?.imageUrl || "https://byos-nextjs.vercel.app/album/london.png";

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="w-full h-full bg-black flex flex-col items-center justify-center relative">
				<img
					src={imageUrl}
					alt="Album"
					width={width}
					height={height}
					className="w-full h-full object-cover absolute inset-0"
					style={{ imageRendering: "pixelated", display: "block" }}
				/>
				<div className="absolute top-0 right-0 p-4 flex flex-col items-end">
					<div
						className="rounded-xl px-4 py-3 flex flex-col items-end"
						style={{ backgroundColor: "rgba(0,0,0,0.56)" }}
					>
						<BitmapText
							text={new Date().toLocaleTimeString("en-GB", {
								timeZone: "Europe/London",
								hour12: true,
								hour: "2-digit",
								minute: "2-digit",
							})}
							fontData={fontData}
							gridSize="8x16"
							scale={3}
							gap={0}
						/>
						<span className="mt-2 font-geneva9 text-[14px] text-white leading-none">
							London{" "}
							{new Date()
								.toLocaleString("en-GB", {
									timeZone: "Europe/London",
									timeZoneName: "short",
								})
								.split(" ")
								.pop()}
						</span>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

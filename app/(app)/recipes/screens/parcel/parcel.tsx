import { PreSatori } from "@/utils/pre-satori";
import { ParcelRecipeData } from "./getData";

export default function Parcel({
	filterMode,
	style,
	updatedAt,
	note,
	error,
	deliveries,
	width = 800,
	height = 480,
}: ParcelRecipeData & { width?: number; height?: number }) {
	const isPortrait = height > width;
	const visibleDeliveries = deliveries.slice(0, isPortrait ? 4 : 6);

	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-white border border-black flex flex-col p-5">
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div className="flex flex-col">
						<span className="text-lg tracking-[0.3em] uppercase">Parcel</span>
						<span className="text-6xl font-blockkie leading-none mt-2">
							Deliveries
						</span>
						<span className="text-xl mt-2">
							{filterMode} • {style}
						</span>
					</div>
					<div className="text-right text-base">
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{visibleDeliveries.length} packages shown</div>
					</div>
				</div>

				<div className="flex-1 grid grid-cols-1 gap-3 py-4">
					{visibleDeliveries.map((delivery) => (
						<div
							key={`${delivery.title}-${delivery.status}`}
							className="border border-black rounded-xl px-4 py-3 flex items-center gap-4"
						>
							<div className="w-[160px] border-r border-black pr-4 flex flex-col">
								<span className="text-base uppercase tracking-[0.2em]">
									Status
								</span>
								<span className="text-2xl mt-1">{delivery.status}</span>
							</div>

							<div className="flex-1 flex flex-col">
								<span className="text-3xl leading-none">{delivery.title}</span>
								<span className="text-lg mt-2">{delivery.latest}</span>
							</div>

							<div className="w-[140px] flex flex-col text-right">
								<span className="text-base uppercase tracking-[0.2em]">ETA</span>
								<span className="text-2xl mt-1">{delivery.deliveryBy}</span>
								<span className="text-base mt-2">{delivery.days}</span>
							</div>
						</div>
					))}
				</div>

				<div className="border-t border-black pt-3 flex justify-between items-center text-base">
					<span>{error || note || "Parcel external API import."}</span>
					<span>api.parcel.app</span>
				</div>
			</div>
		</PreSatori>
	);
}

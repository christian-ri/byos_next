import { PreSatori } from "@/utils/pre-satori";
import { DsnRecipeData } from "./getData";

export default function NasaDeepSpaceNetwork({
	updatedAt,
	note,
	stations,
	width = 800,
	height = 480,
}: DsnRecipeData & { width?: number; height?: number }) {
	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-white border border-black flex flex-col p-5">
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div className="flex flex-col">
						<span className="text-lg tracking-[0.3em] uppercase">NASA</span>
						<span className="text-6xl font-blockkie leading-none mt-2">
							Deep Space Network
						</span>
						<span className="text-xl mt-2">Three ground stations, live traffic</span>
					</div>
					<div className="text-right text-base">
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{stations.length} stations online</div>
					</div>
				</div>

				<div className="flex-1 grid grid-cols-3 gap-4 py-4">
					{stations.map((station) => (
						<div
							key={station.name}
							className="border border-black rounded-xl p-4 flex flex-col"
						>
							<div className="border-b border-black pb-3">
								<div className="text-3xl leading-none">{station.name}</div>
								<div className="text-base mt-2">
									{station.craftCount} craft • {station.signalCount} signals
								</div>
							</div>

							<div className="flex-1 flex flex-col gap-3 pt-3">
								{station.crafts.map((craft) => (
									<div key={`${station.name}-${craft.name}`} className="flex flex-col">
										<span className="text-2xl leading-none">{craft.name}</span>
										<span className="text-base mt-1">Up: {craft.uplink}</span>
										<span className="text-base mt-1">Down: {craft.downlink}</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="border-t border-black pt-3 flex justify-between items-center text-base">
					<span>{note || "Data source: NASA DSN Now via trmnl-dsn."}</span>
					<span>eyes.nasa.gov</span>
				</div>
			</div>
		</PreSatori>
	);
}

import { PreSatori } from "@/utils/pre-satori";
import { FlightBoardRecipeData } from "./getData";

export default function FlightBoard({
	airportName,
	airportCode,
	updatedAt,
	note,
	flights,
	width = 800,
	height = 480,
}: FlightBoardRecipeData & { width?: number; height?: number }) {
	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-white border border-black flex flex-col p-5">
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div className="flex flex-col">
						<span className="text-lg tracking-[0.3em] uppercase">FlightBoard</span>
						<span className="text-6xl font-blockkie leading-none mt-2">
							{airportCode}
						</span>
						<span className="text-xl mt-2">{airportName}</span>
					</div>
					<div className="text-right text-base">
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{flights.length} nearby aircraft</div>
					</div>
				</div>

				<div className="flex-1 flex flex-col py-4">
					<div className="grid grid-cols-[1.5fr_1.4fr_1fr_1fr_1fr_1fr] border border-black rounded-t-xl bg-black text-white px-3 py-2 text-base uppercase tracking-[0.2em]">
						<span>Callsign</span>
						<span>Country</span>
						<span>Status</span>
						<span>Altitude</span>
						<span>Speed</span>
						<span>Range</span>
					</div>

					{flights.map((flight, index) => (
						<div
							key={`${flight.callsign}-${index}`}
							className="grid grid-cols-[1.5fr_1.4fr_1fr_1fr_1fr_1fr] border-x border-b border-black px-3 py-3 text-lg"
						>
							<span>{flight.callsign}</span>
							<span>{flight.country}</span>
							<span>{flight.status}</span>
							<span>{flight.altitude}</span>
							<span>{flight.speed}</span>
							<span>{flight.distance}</span>
						</div>
					))}
				</div>

				<div className="border-t border-black pt-3 flex justify-between items-center text-base">
					<span>{note || "Airport activity import."}</span>
					<span>Live state vectors</span>
				</div>
			</div>
		</PreSatori>
	);
}

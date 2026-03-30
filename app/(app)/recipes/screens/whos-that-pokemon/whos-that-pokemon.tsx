import { PreSatori } from "@/utils/pre-satori";
import { PokemonRecipeData } from "./getData";

export default function WhosThatPokemon({
	name,
	types,
	species,
	pokemonHeight,
	weight,
	abilities,
	artwork,
	updatedAt,
	note,
	width = 800,
	height: screenHeight = 480,
}: PokemonRecipeData & { width?: number; height?: number }) {
	const isPortrait = screenHeight > width;

	return (
		<PreSatori width={width} height={screenHeight}>
			<div
				className={`w-full h-full bg-white border border-black p-5 flex ${isPortrait ? "flex-col" : "flex-row"} gap-5`}
			>
				<div
					className={`${isPortrait ? "h-[180px]" : "w-[300px]"} border border-black rounded-2xl flex items-center justify-center overflow-hidden bg-gray-100`}
				>
					<picture className="w-full h-full">
						<source srcSet={artwork} type="image/png" />
						<img
							src={artwork}
							alt={name}
							width={300}
							height={300}
							className="w-full h-full object-contain"
							style={{
								filter: "grayscale(100%) contrast(1.05)",
							}}
						/>
					</picture>
				</div>

				<div className="flex-1 flex flex-col">
					<div className="border-b border-black pb-4">
						<div className="text-lg tracking-[0.3em] uppercase">
							Who's That Pokemon
						</div>
						<div className="text-6xl font-blockkie leading-none mt-2">{name}</div>
						<div className="text-xl mt-2">
							{types} • {species}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 py-4">
						<div className="border border-black rounded-xl p-3 flex flex-col">
							<span className="text-base uppercase tracking-[0.2em]">Height</span>
							<span className="text-3xl mt-1">{pokemonHeight}</span>
						</div>
						<div className="border border-black rounded-xl p-3 flex flex-col">
							<span className="text-base uppercase tracking-[0.2em]">Weight</span>
							<span className="text-3xl mt-1">{weight}</span>
						</div>
						<div className="border border-black rounded-xl p-3 col-span-2 flex flex-col">
							<span className="text-base uppercase tracking-[0.2em]">
								Abilities
							</span>
							<span className="text-2xl mt-2">{abilities}</span>
						</div>
					</div>

					<div className="mt-auto border-t border-black pt-3 flex justify-between items-center text-base">
						<span>{note || "Daily Pokemon import."}</span>
						<span>Updated {updatedAt}</span>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

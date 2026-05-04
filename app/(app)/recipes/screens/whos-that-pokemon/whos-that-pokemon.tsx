import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { PokemonRecipeData } from "./getData";

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
	const profile = getBitmapLayoutProfile(width, screenHeight);
	const isPortrait = profile.isPortrait;
	const statsColumns = profile.isDense ? 1 : 2;
	const artworkWidth = isPortrait
		? "100%"
		: profile.isDense
			? "220px"
			: "280px";

	return (
		<PreSatori useDoubling={true} width={width} height={screenHeight}>
			<div
				className={`flex h-full w-full border border-black bg-white ${isPortrait ? "flex-col" : "flex-row"}`}
				style={{ padding: profile.padding, gap: profile.gap }}
			>
				<div
					className="flex items-center justify-center overflow-hidden rounded-2xl border border-black bg-gray-100"
					style={{
						width: artworkWidth,
						height: isPortrait ? 170 : "100%",
						minHeight: isPortrait ? 170 : 0,
					}}
				>
					<picture className="h-full w-full">
						<source srcSet={artwork} type="image/png" />
						<img
							src={artwork}
							alt={name}
							width={300}
							height={300}
							className="h-full w-full object-contain"
							style={{ filter: "grayscale(100%) contrast(1.05)" }}
						/>
					</picture>
				</div>

				<div className="flex flex-1 flex-col">
					<div className="border-b border-black pb-4">
						<div
							className="font-geneva9 uppercase tracking-[0.3em]"
							style={{
								fontSize: scaleText(18, profile, {
									compactBase: 14,
									denseBase: 11,
									min: 10,
									max: 18,
								}),
							}}
						>
							Who's That Pokemon
						</div>
						<div
							className="mt-2 font-blockkie leading-none"
							style={{
								fontSize: scaleText(52, profile, {
									compactBase: 36,
									denseBase: 24,
									min: 20,
									max: 52,
								}),
							}}
						>
							{clampText(name, profile.isDense ? 12 : 18)}
						</div>
						<div
							className="mt-2 font-geneva9"
							style={{
								fontSize: scaleText(20, profile, {
									compactBase: 15,
									denseBase: 11,
									min: 10,
									max: 20,
								}),
							}}
						>
							{clampText(`${types} • ${species}`, profile.isDense ? 28 : 46)}
						</div>
					</div>

					<div
						className="grid py-4"
						style={{
							gap: profile.gap,
							gridTemplateColumns: `repeat(${statsColumns}, minmax(0, 1fr))`,
						}}
					>
						<div className="flex flex-col rounded-xl border border-black p-3">
							<span
								className="font-geneva9 uppercase tracking-[0.2em]"
								style={{
									fontSize: scaleText(16, profile, {
										compactBase: 12,
										denseBase: 10,
										min: 9,
										max: 16,
									}),
								}}
							>
								Height
							</span>
							<span
								className="mt-1 font-blockkie leading-none"
								style={{
									fontSize: scaleText(30, profile, {
										compactBase: 22,
										denseBase: 16,
										min: 14,
										max: 30,
									}),
								}}
							>
								{pokemonHeight}
							</span>
						</div>
						<div className="flex flex-col rounded-xl border border-black p-3">
							<span
								className="font-geneva9 uppercase tracking-[0.2em]"
								style={{
									fontSize: scaleText(16, profile, {
										compactBase: 12,
										denseBase: 10,
										min: 9,
										max: 16,
									}),
								}}
							>
								Weight
							</span>
							<span
								className="mt-1 font-blockkie leading-none"
								style={{
									fontSize: scaleText(30, profile, {
										compactBase: 22,
										denseBase: 16,
										min: 14,
										max: 30,
									}),
								}}
							>
								{weight}
							</span>
						</div>
						<div
							className="flex flex-col rounded-xl border border-black p-3"
							style={{ gridColumn: statsColumns === 1 ? "auto" : "1 / -1" }}
						>
							<span
								className="font-geneva9 uppercase tracking-[0.2em]"
								style={{
									fontSize: scaleText(16, profile, {
										compactBase: 12,
										denseBase: 10,
										min: 9,
										max: 16,
									}),
								}}
							>
								Abilities
							</span>
							<span
								className="mt-2 font-geneva9"
								style={{
									fontSize: scaleText(22, profile, {
										compactBase: 16,
										denseBase: 12,
										min: 10,
										max: 22,
									}),
								}}
							>
								{clampText(abilities, profile.isDense ? 36 : 64)}
							</span>
						</div>
					</div>

					<div
						className="mt-auto flex items-center justify-between border-t border-black pt-3 font-geneva9"
						style={{
							fontSize: scaleText(16, profile, {
								compactBase: 12,
								denseBase: 9,
								min: 8,
								max: 16,
							}),
						}}
					>
						<span>
							{clampText(
								note || "Daily Pokemon import.",
								profile.isDense ? 26 : 48,
							)}
						</span>
						{!profile.isDense ? <span>Updated {updatedAt}</span> : null}
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

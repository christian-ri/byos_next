import {
	EInkCard,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { PokemonRecipeData } from "./getData";

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<EInkCard padding={14} radius={14}>
			<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
				<MetaText>{label}</MetaText>
				<ReadableText size={32} weight={700}>
					{value}
				</ReadableText>
			</div>
		</EInkCard>
	);
}

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
	height = 480,
}: PokemonRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: profile.padding,
					display: "flex",
					gap: 14,
				}}
			>
				<EInkCard
					padding={16}
					radius={18}
					style={{
						width: 300,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
					<img
						src={artwork}
						alt={name}
						width={260}
						height={260}
						style={{
							width: 260,
							height: 260,
							objectFit: "contain",
							display: "block",
						}}
					/>
				</EInkCard>

				<div
					style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}
				>
					<EInkCard padding={16} radius={18}>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<MetaText>WHO'S THAT POKEMON</MetaText>
							<SafeTitle size={34} lines={2}>
								{name}
							</SafeTitle>
							<ReadableText size={18}>{types}</ReadableText>
							<MetaText>{species}</MetaText>
						</div>
					</EInkCard>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
							gap: 12,
						}}
					>
						<StatCard label="Height" value={pokemonHeight} />
						<StatCard label="Weight" value={weight} />
					</div>

					<EInkCard padding={16} radius={18} style={{ flex: 1 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<MetaText>Abilities</MetaText>
							<ReadableText size={20}>{abilities}</ReadableText>
						</div>
					</EInkCard>

					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							gap: 12,
						}}
					>
						<MetaText>{note || "Daily Pokemon import."}</MetaText>
						<MetaText>Updated {updatedAt}</MetaText>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type PokemonParams = {
	dataUrl?: string;
};

type PokemonApiResponse = {
	timestamp?: string;
	pokemon_data?: {
		name?: string;
		types?: string;
		species?: string;
		height?: string;
		weight?: string;
		abilities?: string;
		artwork?: string;
	};
};

export type PokemonRecipeData = {
	name: string;
	types: string;
	species: string;
	pokemonHeight: string;
	weight: string;
	abilities: string;
	artwork: string;
	updatedAt: string;
	note?: string;
};

const DEFAULT_URL =
	"https://raw.githubusercontent.com/sriniketh/trmnl-plugin-whos-that-pokemon/refs/heads/main/pokemon_data/response.json";

const FALLBACK_DATA: PokemonRecipeData = {
	name: "Fennekin",
	types: "Fire",
	species: "Fox Pokemon",
	pokemonHeight: "0.4 m",
	weight: "9.4 kg",
	abilities: "Blaze, Magician",
	artwork:
		"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/653.png",
	updatedAt: formatUpdatedAt(new Date()),
	note: "Live data unavailable, showing a cached sample Pokemon.",
};

export default async function getData(
	params?: PokemonParams,
): Promise<PokemonRecipeData> {
	const dataUrl = String(params?.dataUrl || DEFAULT_URL).trim();

	try {
		const data = await fetchJsonWithTimeout<PokemonApiResponse>(
			dataUrl,
			{
				headers: {
					Accept: "application/json",
				},
			},
			8000,
		);

		const pokemon = data.pokemon_data;
		if (!pokemon?.name) {
			return FALLBACK_DATA;
		}

		return {
			name: pokemon.name,
			types: pokemon.types || "Unknown",
			species: pokemon.species || "Unknown species",
			pokemonHeight: pokemon.height || "-",
			weight: pokemon.weight || "-",
			abilities: pokemon.abilities || "-",
			artwork: pokemon.artwork || FALLBACK_DATA.artwork,
			updatedAt: formatUpdatedAt(data.timestamp || new Date()),
		};
	} catch (error) {
		console.error("Error loading Pokemon data:", error);
		return FALLBACK_DATA;
	}
}

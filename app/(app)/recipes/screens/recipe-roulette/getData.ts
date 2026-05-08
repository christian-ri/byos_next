import {
	dateSeedKey,
	pickDeterministicIndex,
} from "@/app/(app)/recipes/screens/_shared/daily-seed";
import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type RecipeRouletteParams = {
	apiKey?: string;
	category?: string;
	area?: string;
	mode?: string;
	showIngredientsCount?: string | boolean;
};

type MealListResponse = {
	meals?: Array<{
		idMeal: string;
		strMeal: string;
		strMealThumb?: string;
	}>;
};

type MealLookupResponse = {
	meals?: MealRecord[];
};

type MealRecord = {
	idMeal: string;
	strMeal: string;
	strCategory?: string;
	strArea?: string;
	strInstructions?: string;
	strMealThumb?: string;
	[key: string]: string | undefined;
};

type Ingredient = {
	name: string;
	measure: string;
};

export type RecipeRouletteRecipeData = {
	title: string;
	label: string;
	updatedAt: string;
	mode: "random" | "category" | "area";
	mealTitle: string;
	category: string;
	area: string;
	imageUrl: string;
	ingredients: Ingredient[];
	showIngredientsCount: boolean;
	note: string;
};

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["yes", "true", "1", "on"].includes(normalized)) return true;
	if (["no", "false", "0", "off"].includes(normalized)) return false;
	return fallback;
}

function normalizeMode(value?: string): "random" | "category" | "area" {
	switch (
		String(value || "")
			.trim()
			.toLowerCase()
	) {
		case "category":
		case "area":
			return String(value).trim().toLowerCase() as "category" | "area";
		default:
			return "random";
	}
}

function extractIngredients(meal: MealRecord) {
	const ingredients: Ingredient[] = [];

	for (let index = 1; index <= 20; index += 1) {
		const name = String(meal[`strIngredient${index}`] || "").trim();
		const measure = String(meal[`strMeasure${index}`] || "").trim();
		if (!name) continue;
		ingredients.push({ name, measure });
	}

	return ingredients.slice(0, 6);
}

function buildFallback(
	mode: "random" | "category" | "area",
	showIngredientsCount: boolean,
	note = "API unavailable",
): RecipeRouletteRecipeData {
	return {
		title: "Recipe Roulette",
		label: "Cook tonight",
		updatedAt: formatUpdatedAt(new Date()),
		mode,
		mealTitle: "Shakshuka",
		category: "Vegetarian",
		area: "Middle Eastern",
		imageUrl:
			"https://www.themealdb.com/images/media/meals/g373701551450225.jpg",
		ingredients: [
			{ name: "Eggs", measure: "4" },
			{ name: "Tomatoes", measure: "400g" },
			{ name: "Onion", measure: "1" },
			{ name: "Garlic", measure: "2 cloves" },
			{ name: "Paprika", measure: "1 tsp" },
			{ name: "Olive Oil", measure: "2 tbsp" },
		],
		showIngredientsCount,
		note,
	};
}

async function fetchMealById(apiKey: string, id: string) {
	const lookup = await fetchJsonWithTimeout<MealLookupResponse>(
		`https://www.themealdb.com/api/json/v1/${apiKey}/lookup.php?i=${id}`,
		{ headers: { Accept: "application/json" } },
		10000,
	);
	return lookup.meals?.[0];
}

export default async function getData(
	params?: RecipeRouletteParams,
): Promise<RecipeRouletteRecipeData> {
	const apiKey = String(params?.apiKey || "1").trim() || "1";
	const category = String(params?.category || "").trim();
	const area = String(params?.area || "").trim();
	const mode = normalizeMode(params?.mode);
	const showIngredientsCount = parseBoolean(params?.showIngredientsCount, true);

	try {
		let meal: MealRecord | undefined;

		if (
			mode === "random" ||
			(mode === "category" && !category) ||
			(mode === "area" && !area)
		) {
			const random = await fetchJsonWithTimeout<MealLookupResponse>(
				`https://www.themealdb.com/api/json/v1/${apiKey}/random.php`,
				{ headers: { Accept: "application/json" } },
				10000,
			);
			meal = random.meals?.[0];
		} else {
			const filterUrl =
				mode === "category"
					? `https://www.themealdb.com/api/json/v1/${apiKey}/filter.php?c=${encodeURIComponent(category)}`
					: `https://www.themealdb.com/api/json/v1/${apiKey}/filter.php?a=${encodeURIComponent(area)}`;
			const list = await fetchJsonWithTimeout<MealListResponse>(
				filterUrl,
				{ headers: { Accept: "application/json" } },
				10000,
			);
			const meals = list.meals || [];

			if (meals.length > 0) {
				const index = pickDeterministicIndex(
					meals.length,
					`${dateSeedKey("UTC")}:${mode}:${category}:${area}`,
				);
				meal = await fetchMealById(
					apiKey,
					meals[index]?.idMeal || meals[0].idMeal,
				);
			}
		}

		if (!meal) {
			return buildFallback(
				mode,
				showIngredientsCount,
				"No meal found for this selection.",
			);
		}

		return {
			title: "Recipe Roulette",
			label: "Cook tonight",
			updatedAt: formatUpdatedAt(new Date()),
			mode,
			mealTitle: meal.strMeal || "Untitled recipe",
			category: meal.strCategory || category || "Category unknown",
			area: meal.strArea || area || "Area unknown",
			imageUrl: meal.strMealThumb || "",
			ingredients: extractIngredients(meal),
			showIngredientsCount,
			note:
				mode === "random"
					? "Random pick from TheMealDB."
					: `Daily pick for ${mode === "category" ? category : area}.`,
		};
	} catch (error) {
		console.error("Error loading Recipe Roulette data:", error);
		return buildFallback(mode, showIngredientsCount);
	}
}

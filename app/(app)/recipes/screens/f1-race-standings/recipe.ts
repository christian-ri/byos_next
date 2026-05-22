import { renderF1RaceStandingsRecipeHtml } from "@/app/(app)/recipes/screens/_shared/f1-chromium";
import type { F1RaceStandingsRecipeData } from "./getData";
import getData from "./getData";

export const id = "f1-race-standings";
export const title = "F1 Driver Standings";
export const renderer = "chromium";

export { getData };

export async function renderHtml(data: F1RaceStandingsRecipeData) {
	return renderF1RaceStandingsRecipeHtml(data);
}

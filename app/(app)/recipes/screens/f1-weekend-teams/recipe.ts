import { renderF1WeekendTeamsRecipeHtml } from "@/app/(app)/recipes/screens/_shared/f1-chromium";
import type { F1RaceStandingsRecipeData } from "./getData";
import getData from "./getData";

export const id = "f1-weekend-teams";
export const title = "F1 Weekend + Constructors";
export const renderer = "chromium";

export { getData };

export async function renderHtml(data: F1RaceStandingsRecipeData) {
	return renderF1WeekendTeamsRecipeHtml(data);
}

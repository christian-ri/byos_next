import { renderCalendarRecipeHtml } from "@/app/(app)/recipes/screens/_shared/calendar-chromium";
import type { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";
import getData from "./getData";

export const id = "calendar-outlook";
export const title = "Calendar (Outlook)";
export const renderer = "chromium";

export { getData };

export function renderHtml(data: CalendarRecipeData) {
	return renderCalendarRecipeHtml(data);
}

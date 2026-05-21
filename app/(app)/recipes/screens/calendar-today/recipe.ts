import { renderCalendarTodayRecipeHtml } from "@/app/(app)/recipes/screens/_shared/calendar-chromium";
import type { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";
import getData from "./getData";

export const id = "calendar-today";
export const title = "Calendar Today";
export const renderer = "chromium";

export { getData };

export function renderHtml(data: CalendarRecipeData) {
	return renderCalendarTodayRecipeHtml(data, "standard");
}

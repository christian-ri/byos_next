import {
	CalendarRecipeData,
	loadCalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";

export const dynamic = "force-dynamic";

type CalendarParams = {
	icsUrl?: string;
	calendarName?: string;
	headers?: string;
	timezone?: string;
	maxEvents?: string | number;
};

export default async function getData(
	params?: CalendarParams,
): Promise<CalendarRecipeData> {
	return loadCalendarRecipeData("Apple", params);
}

import {
	type CalendarRecipeData,
	loadCalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";

export const dynamic = "force-dynamic";

type CalendarTodayParams = {
	icsUrl?: string;
	calendarName?: string;
	headers?: string;
	timezone?: string;
	timeFormat?: string;
	includeDescription?: string | boolean;
	includeEventTime?: string | boolean;
	ignoredPhrases?: string;
	maxEventsPerDay?: string | number;
};

export default async function getData(
	params?: CalendarTodayParams,
): Promise<CalendarRecipeData> {
	const data = await loadCalendarRecipeData("Multi", {
		...params,
		eventLayout: "default",
	});

	return {
		...data,
		providerLabel: "Kalender",
		title: "Multi-Kalender · Heute",
	};
}

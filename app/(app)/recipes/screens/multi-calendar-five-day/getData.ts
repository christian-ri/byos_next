import {
	type CalendarRecipeData,
	loadCalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";

export const dynamic = "force-dynamic";

export type MultiCalendarFiveDayData = CalendarRecipeData & {
	displayName: string;
	showCalendarLabels: boolean;
	showLocation: boolean;
	width?: number;
	height?: number;
};

type Params = {
	icsUrl?: string;
	calendarName?: string;
	headers?: string;
	timezone?: string;
	timeFormat?: string;
	includeDescription?: string | boolean;
	includeEventTime?: string | boolean;
	showCalendarLabels?: string | boolean;
	showLocation?: string | boolean;
	ignoredPhrases?: string;
	maxEventsPerDay?: string | number;
};

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	if (["false", "no", "off", "0"].includes(value.trim().toLowerCase())) {
		return false;
	}
	return true;
}

export default async function getData(
	params?: Params,
): Promise<MultiCalendarFiveDayData> {
	const displayName = String(
		params?.calendarName || "Die nächsten fünf Tage",
	).trim();
	const data = await loadCalendarRecipeData("Multi", {
		...params,
		calendarName: displayName,
		eventLayout: "default",
	});

	return {
		...data,
		title: displayName,
		subtitle: displayName,
		providerLabel: "Kalender",
		displayName,
		showCalendarLabels: parseBoolean(params?.showCalendarLabels, true),
		showLocation: parseBoolean(params?.showLocation, false),
	};
}

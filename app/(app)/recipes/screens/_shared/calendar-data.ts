import {
	fetchTextWithTimeout,
	formatDateTime,
	formatUpdatedAt,
	parseLooseHeaderString,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export type CalendarLayout = "default" | "week" | "month";

export type CalendarDayEvent = {
	id: string;
	summary: string;
	description: string;
	location: string;
	allDay: boolean;
	multiDay: boolean;
	startsToday: boolean;
	endsToday: boolean;
	continuesBefore: boolean;
	continuesAfter: boolean;
	timeLabel: string;
};

export type CalendarDay = {
	key: string;
	label: string;
	shortLabel: string;
	dayNumber: string;
	isToday: boolean;
	isCurrentMonth: boolean;
	events: CalendarDayEvent[];
};

export type CalendarRecipeData = {
	providerLabel: string;
	title: string;
	subtitle: string;
	timeZone: string;
	updatedAt: string;
	note?: string;
	eventLayout: CalendarLayout;
	includeDescription: boolean;
	includeEventTime: boolean;
	firstDay: 0 | 1;
	defaultDays: CalendarDay[];
	weekDays: CalendarDay[];
	monthWeeks: CalendarDay[][];
	monthLabel: string;
};

type CalendarParams = {
	icsUrl?: string;
	calendarName?: string;
	headers?: string;
	timezone?: string;
	eventLayout?: string;
	timeFormat?: string;
	includeDescription?: string | boolean;
	includeEventTime?: string | boolean;
	firstDay?: string;
	ignoredPhrases?: string;
	maxEventsPerDay?: string | number;
};

type ParsedProperty = {
	name: string;
	value: string;
	params: Record<string, string>;
};

type RawCalendarEvent = {
	id: string;
	summary: string;
	description: string;
	location: string;
	status: string;
	allDay: boolean;
	start: Date;
	end: Date;
	rrule?: string;
	exdates: Date[];
};

type BuildDayOptions = {
	timeZone: string;
	timeFormat: "12h" | "24h";
	includeEventTime: boolean;
	maxEventsPerDay: number;
	currentMonth?: number;
};

const DEFAULT_TIME_ZONE = "America/New_York";
const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function parseBoolean(value: string | boolean | undefined, fallback = true) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["false", "no", "off", "0"].includes(normalized)) return false;
	if (["true", "yes", "on", "1"].includes(normalized)) return true;
	return fallback;
}

function normalizeLayout(value?: string): CalendarLayout {
	switch ((value || "").trim().toLowerCase()) {
		case "week":
			return "week";
		case "month":
		case "rolling_month":
			return "month";
		default:
			return "default";
	}
}

function normalizeFirstDay(value?: string): 0 | 1 {
	return (value || "").trim().toLowerCase() === "monday" ? 1 : 0;
}

function normalizeTimeFormat(value?: string): "12h" | "24h" {
	return (value || "").trim().toLowerCase() === "24h" ? "24h" : "12h";
}

function dayKey(date: Date, timeZone: string) {
	return formatDateTime(
		date,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		},
		timeZone,
	);
}

function weekdayShort(date: Date, timeZone: string) {
	return formatDateTime(
		date,
		{
			weekday: "short",
		},
		timeZone,
	);
}

function shortDateLabel(date: Date, timeZone: string) {
	return formatDateTime(
		date,
		{
			month: "short",
			day: "numeric",
		},
		timeZone,
	);
}

function monthLabel(date: Date, timeZone: string) {
	return formatDateTime(
		date,
		{
			month: "long",
			year: "numeric",
		},
		timeZone,
	);
}

function dayNumber(date: Date, timeZone: string) {
	return formatDateTime(
		date,
		{
			day: "numeric",
		},
		timeZone,
	);
}

function formatClock(
	date: Date,
	timeZone: string,
	timeFormat: "12h" | "24h",
) {
	return formatDateTime(
		date,
		{
			hour: "numeric",
			minute: "2-digit",
			hour12: timeFormat === "12h",
		},
		timeZone,
	);
}

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

function addMonths(date: Date, months: number) {
	const next = new Date(date);
	next.setMonth(next.getMonth() + months);
	return next;
}

function startOfWeek(date: Date, firstDay: 0 | 1) {
	const next = startOfDay(date);
	while (next.getDay() !== firstDay) {
		next.setDate(next.getDate() - 1);
	}
	return next;
}

function endOfWeek(date: Date, firstDay: 0 | 1) {
	return addDays(startOfWeek(date, firstDay), 6);
}

function parseList(value?: string) {
	return (value || "")
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function buildFallbackRawEvents() {
	const now = new Date();
	return [
		{
			id: "sample-1",
			summary: "Michael OOO",
			description: "Quarterly strategy meeting",
			location: "",
			status: "confirmed",
			allDay: true,
			start: addDays(startOfDay(now), 1),
			end: addDays(startOfDay(now), 3),
			exdates: [],
		},
		{
			id: "sample-2",
			summary: "Code Review",
			description: "Hackathon planning and BYOS handoff",
			location: "GitHub",
			status: "confirmed",
			allDay: false,
			start: new Date(addDays(now, 2).setHours(10, 0, 0, 0)),
			end: new Date(addDays(now, 2).setHours(11, 0, 0, 0)),
			exdates: [],
		},
		{
			id: "sample-3",
			summary: "Sprint Planning",
			description: "One-on-one with John",
			location: "Studio",
			status: "confirmed",
			allDay: false,
			start: new Date(addDays(now, 4).setHours(13, 0, 0, 0)),
			end: new Date(addDays(now, 4).setHours(15, 0, 0, 0)),
			exdates: [],
		},
		{
			id: "sample-4",
			summary: "Weekly Review",
			description: "Team building",
			location: "",
			status: "confirmed",
			allDay: false,
			start: new Date(addDays(now, 5).setHours(9, 30, 0, 0)),
			end: new Date(addDays(now, 5).setHours(10, 30, 0, 0)),
			exdates: [],
		},
	] satisfies RawCalendarEvent[];
}

function buildFallbackData(
	providerLabel: string,
	timeZone: string,
	layout: CalendarLayout,
	firstDay: 0 | 1,
	includeDescription: boolean,
	includeEventTime: boolean,
	note: string,
	calendarName?: string,
) {
	const subtitle =
		calendarName?.trim() ||
		(providerLabel === "Apple" ? "Personal Calendar" : "Connected Calendar");
	return buildCalendarData({
		providerLabel,
		title: `${providerLabel} Calendar`,
		subtitle,
		timeZone,
		layout,
		includeDescription,
		includeEventTime,
		firstDay,
		timeFormat: "12h",
		maxEventsPerDay: 4,
		rawEvents: buildFallbackRawEvents(),
		note,
	});
}

function unfoldIcs(input: string) {
	return input.replace(/\r?\n[ \t]/g, "");
}

function unescapeIcsText(value: string) {
	return value
		.replace(/\\n/gi, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

function parseProperty(line: string): ParsedProperty | null {
	const separatorIndex = line.indexOf(":");
	if (separatorIndex === -1) {
		return null;
	}

	const key = line.slice(0, separatorIndex);
	const value = line.slice(separatorIndex + 1);
	const [name, ...paramParts] = key.split(";");
	const params = paramParts.reduce<Record<string, string>>((acc, part) => {
		const [paramKey, paramValue] = part.split("=");
		if (paramKey && paramValue) {
			acc[paramKey.toUpperCase()] = paramValue;
		}
		return acc;
	}, {});

	return {
		name: name.toUpperCase(),
		value,
		params,
	};
}

function parseDateBits(value: string) {
	const normalized = value.replace("Z", "");
	const year = Number(normalized.slice(0, 4));
	const month = Number(normalized.slice(4, 6)) - 1;
	const day = Number(normalized.slice(6, 8));
	const hour = Number(normalized.slice(9, 11) || "0");
	const minute = Number(normalized.slice(11, 13) || "0");
	const second = Number(normalized.slice(13, 15) || "0");

	return {
		year,
		month,
		day,
		hour,
		minute,
		second,
	};
}

function parseIcsDate(
	value: string,
	params: Record<string, string>,
): { date: Date; allDay: boolean } | null {
	if (!value) {
		return null;
	}

	if (params.VALUE === "DATE" || /^\d{8}$/.test(value)) {
		const { year, month, day } = parseDateBits(value);
		return {
			// Midday avoids timezone shifts when the date is later formatted
			date: new Date(Date.UTC(year, month, day, 12, 0, 0)),
			allDay: true,
		};
	}

	if (value.endsWith("Z")) {
		const { year, month, day, hour, minute, second } = parseDateBits(value);
		return {
			date: new Date(Date.UTC(year, month, day, hour, minute, second)),
			allDay: false,
		};
	}

	const { year, month, day, hour, minute, second } = parseDateBits(value);
	return {
		date: new Date(year, month, day, hour, minute, second),
		allDay: false,
	};
}

function dayCodeToIndex(code: string) {
	return DAY_NAMES.indexOf(code);
}

function parseRRule(rule: string) {
	return rule.split(";").reduce<Record<string, string>>((acc, part) => {
		const [key, value] = part.split("=");
		if (key && value) {
			acc[key.toUpperCase()] = value;
		}
		return acc;
	}, {});
}

function eventIntersectsWindow(
	event: Pick<RawCalendarEvent, "start" | "end">,
	windowStart: Date,
	windowEnd: Date,
) {
	return event.end >= windowStart && event.start <= windowEnd;
}

function cloneOccurrence(
	event: RawCalendarEvent,
	start: Date,
	end: Date,
	index: number,
) {
	return {
		...event,
		id: `${event.id}-${index}`,
		start,
		end,
	};
}

function isExcluded(start: Date, exdates: Date[]) {
	return exdates.some((excluded) => excluded.getTime() === start.getTime());
}

function expandRecurringEvent(
	event: RawCalendarEvent,
	windowStart: Date,
	windowEnd: Date,
) {
	if (!event.rrule) {
		return eventIntersectsWindow(event, windowStart, windowEnd) ? [event] : [];
	}

	const rule = parseRRule(event.rrule);
	const freq = rule.FREQ;
	const interval = Number(rule.INTERVAL || "1");
	const count = Number(rule.COUNT || "0");
	const until = rule.UNTIL ? parseIcsDate(rule.UNTIL, {})?.date : null;
	const durationMs = event.end.getTime() - event.start.getTime();
	const maxIterations = count > 0 ? count : 80;

	if (!freq || !["DAILY", "WEEKLY", "MONTHLY"].includes(freq)) {
		return eventIntersectsWindow(event, windowStart, windowEnd) ? [event] : [];
	}

	const results: RawCalendarEvent[] = [];

	if (freq === "DAILY") {
		let current = new Date(event.start);
		for (let index = 0; index < maxIterations; index += 1) {
			if (until && current > until) break;
			const end = new Date(current.getTime() + durationMs);
			if (!isExcluded(current, event.exdates)) {
				const occurrence = cloneOccurrence(event, current, end, index);
				if (eventIntersectsWindow(occurrence, windowStart, windowEnd)) {
					results.push(occurrence);
				}
			}
			if (current > windowEnd) break;
			current = addDays(current, interval);
		}
		return results;
	}

	if (freq === "MONTHLY") {
		let current = new Date(event.start);
		for (let index = 0; index < maxIterations; index += 1) {
			if (until && current > until) break;
			const end = new Date(current.getTime() + durationMs);
			if (!isExcluded(current, event.exdates)) {
				const occurrence = cloneOccurrence(event, current, end, index);
				if (eventIntersectsWindow(occurrence, windowStart, windowEnd)) {
					results.push(occurrence);
				}
			}
			if (current > windowEnd) break;
			current = addMonths(current, interval);
		}
		return results;
	}

	const parsedByDay =
		rule.BYDAY?.split(",").map(dayCodeToIndex).filter((day) => day >= 0) || [];
	const byDay = parsedByDay.length > 0 ? parsedByDay : [event.start.getDay()];
	const cursor = new Date(windowStart);
	cursor.setHours(
		event.start.getHours(),
		event.start.getMinutes(),
		event.start.getSeconds(),
		0,
	);
	const baseWeek = startOfWeek(event.start, 0).getTime();

	for (let index = 0; index < 120; index += 1) {
		if (cursor > windowEnd) break;

		const weekOffset =
			(startOfWeek(cursor, 0).getTime() - baseWeek) / (7 * 24 * 60 * 60 * 1000);
		const matchesWeek = weekOffset >= 0 && weekOffset % interval === 0;
		if (
			matchesWeek &&
			byDay.includes(cursor.getDay()) &&
			cursor >= event.start &&
			(!until || cursor <= until) &&
			!isExcluded(cursor, event.exdates)
		) {
			const end = new Date(cursor.getTime() + durationMs);
			const occurrence = cloneOccurrence(event, new Date(cursor), end, index);
			if (eventIntersectsWindow(occurrence, windowStart, windowEnd)) {
				results.push(occurrence);
			}
			if (count > 0 && results.length >= count) {
				break;
			}
		}

		cursor.setDate(cursor.getDate() + 1);
	}

	return results;
}

function parseEventsFromIcs(source: string) {
	const lines = unfoldIcs(source).split(/\r?\n/);
	const events: RawCalendarEvent[] = [];
	let inEvent = false;
	let bucket: ParsedProperty[] = [];

	for (const line of lines) {
		if (line === "BEGIN:VEVENT") {
			inEvent = true;
			bucket = [];
			continue;
		}

		if (line === "END:VEVENT") {
			inEvent = false;
			const props = bucket;
			const dtStartProp = props.find((prop) => prop.name === "DTSTART");
			const dtEndProp = props.find((prop) => prop.name === "DTEND");
			const startParsed = dtStartProp
				? parseIcsDate(dtStartProp.value, dtStartProp.params)
				: null;
			const endParsed = dtEndProp
				? parseIcsDate(dtEndProp.value, dtEndProp.params)
				: null;

			if (!startParsed) {
				continue;
			}

			const fallbackEnd = startParsed.allDay
				? addDays(startParsed.date, 1)
				: new Date(startParsed.date.getTime() + 60 * 60 * 1000);
			const exdates = props
				.filter((prop) => prop.name === "EXDATE")
				.flatMap((prop) =>
					prop.value
						.split(",")
						.map((value) => parseIcsDate(value, prop.params)?.date)
						.filter((value): value is Date => value instanceof Date),
				);

			events.push({
				id:
					props.find((prop) => prop.name === "UID")?.value ||
					`${startParsed.date.toISOString()}-${props.find((prop) => prop.name === "SUMMARY")?.value || "event"}`,
				summary:
					unescapeIcsText(
						props.find((prop) => prop.name === "SUMMARY")?.value || "Busy",
					) || "Busy",
				description: unescapeIcsText(
					props.find((prop) => prop.name === "DESCRIPTION")?.value || "",
				),
				location: unescapeIcsText(
					props.find((prop) => prop.name === "LOCATION")?.value || "",
				),
				status: props.find((prop) => prop.name === "STATUS")?.value || "",
				allDay: startParsed.allDay,
				start: startParsed.date,
				end: endParsed?.date || fallbackEnd,
				rrule: props.find((prop) => prop.name === "RRULE")?.value,
				exdates,
			});
			bucket = [];
			continue;
		}

		if (!inEvent) {
			continue;
		}

		const parsed = parseProperty(line);
		if (parsed) {
			bucket.push(parsed);
		}
	}

	return events;
}

function filterIgnoredEvents(events: RawCalendarEvent[], ignoredPhrases: string[]) {
	if (ignoredPhrases.length === 0) {
		return events;
	}

	return events.filter((event) => {
		const summary = event.summary.toLowerCase();
		const description = event.description.toLowerCase();
		return !ignoredPhrases.some((phrase) => {
			const normalized = phrase.toLowerCase();
			return summary.includes(normalized) || description.includes(normalized);
		});
	});
}

function eventEndInclusive(event: RawCalendarEvent) {
	if (event.allDay) {
		return new Date(event.end.getTime() - 1);
	}
	return event.end;
}

function buildEventForDay(
	event: RawCalendarEvent,
	dayDate: Date,
	options: BuildDayOptions,
): CalendarDayEvent {
	const dayStart = startOfDay(dayDate);
	const inclusiveEnd = eventEndInclusive(event);
	const startsToday =
		startOfDay(event.start).getTime() === dayStart.getTime();
	const endsToday =
		startOfDay(inclusiveEnd).getTime() === dayStart.getTime();
	const multiDay =
		startOfDay(event.start).getTime() !== startOfDay(inclusiveEnd).getTime();
	const continuesBefore = !startsToday;
	const continuesAfter = !endsToday;

	let timeLabel = "";
	if (options.includeEventTime) {
		if (event.allDay) {
			timeLabel = "All-day";
		} else if (!multiDay) {
			timeLabel = `${formatClock(event.start, options.timeZone, options.timeFormat)} - ${formatClock(event.end, options.timeZone, options.timeFormat)}`;
		} else if (startsToday) {
			timeLabel = `Starts ${formatClock(event.start, options.timeZone, options.timeFormat)}`;
		} else if (endsToday) {
			timeLabel = `Until ${formatClock(event.end, options.timeZone, options.timeFormat)}`;
		} else {
			timeLabel = "Continues";
		}
	}

	return {
		id: event.id,
		summary: event.summary,
		description: event.description,
		location: event.location,
		allDay: event.allDay,
		multiDay,
		startsToday,
		endsToday,
		continuesBefore,
		continuesAfter,
		timeLabel,
	};
}

function buildDay(
	dayDate: Date,
	events: RawCalendarEvent[],
	options: BuildDayOptions,
): CalendarDay {
	const dayStart = startOfDay(dayDate);
	const dayEnd = new Date(dayStart);
	dayEnd.setHours(23, 59, 59, 999);
	const now = new Date();

	const dayEvents = events
		.filter((event) => {
			const inclusiveEnd = eventEndInclusive(event);
			return inclusiveEnd >= dayStart && event.start <= dayEnd;
		})
		.sort((a, b) => a.start.getTime() - b.start.getTime())
		.slice(0, options.maxEventsPerDay)
		.map((event) => buildEventForDay(event, dayDate, options));

	return {
		key: dayKey(dayDate, options.timeZone),
		label: `${weekdayShort(dayDate, options.timeZone)} ${shortDateLabel(dayDate, options.timeZone)}`,
		shortLabel: weekdayShort(dayDate, options.timeZone),
		dayNumber: dayNumber(dayDate, options.timeZone),
		isToday: dayKey(dayDate, options.timeZone) === dayKey(now, options.timeZone),
		isCurrentMonth:
			options.currentMonth === undefined ||
			dayDate.getMonth() === options.currentMonth,
		events: dayEvents,
	};
}

function buildCalendarData({
	providerLabel,
	title,
	subtitle,
	timeZone,
	layout,
	includeDescription,
	includeEventTime,
	firstDay,
	timeFormat,
	maxEventsPerDay,
	rawEvents,
	note,
}: {
	providerLabel: string;
	title: string;
	subtitle: string;
	timeZone: string;
	layout: CalendarLayout;
	includeDescription: boolean;
	includeEventTime: boolean;
	firstDay: 0 | 1;
	timeFormat: "12h" | "24h";
	maxEventsPerDay: number;
	rawEvents: RawCalendarEvent[];
	note?: string;
}): CalendarRecipeData {
	const today = new Date();
	const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
	const monthGridStart = startOfWeek(currentMonthStart, firstDay);
	const monthGridEnd = endOfWeek(currentMonthEnd, firstDay);

	const defaultDays = Array.from({ length: 3 }, (_, index) =>
		buildDay(addDays(startOfDay(today), index), rawEvents, {
			timeZone,
			timeFormat,
			includeEventTime,
			maxEventsPerDay,
		}),
	);

	const weekDays = Array.from({ length: 7 }, (_, index) =>
		buildDay(addDays(startOfDay(today), index), rawEvents, {
			timeZone,
			timeFormat,
			includeEventTime,
			maxEventsPerDay,
		}),
	);

	const flatMonthDays: CalendarDay[] = [];
	for (
		let cursor = new Date(monthGridStart);
		cursor <= monthGridEnd;
		cursor = addDays(cursor, 1)
	) {
		flatMonthDays.push(
			buildDay(cursor, rawEvents, {
				timeZone,
				timeFormat,
				includeEventTime,
				maxEventsPerDay,
				currentMonth: today.getMonth(),
			}),
		);
	}

	const monthWeeks: CalendarDay[][] = [];
	for (let index = 0; index < flatMonthDays.length; index += 7) {
		monthWeeks.push(flatMonthDays.slice(index, index + 7));
	}

	return {
		providerLabel,
		title,
		subtitle,
		timeZone,
		updatedAt: formatUpdatedAt(new Date(), timeZone),
		note,
		eventLayout: layout,
		includeDescription,
		includeEventTime,
		firstDay,
		defaultDays,
		weekDays,
		monthWeeks,
		monthLabel: monthLabel(today, timeZone),
	};
}

async function loadIcsSources(
	icsUrlInput: string,
	headers?: string,
): Promise<string[]> {
	const urls = parseList(icsUrlInput).map((url) =>
		url.replace(/^webcal:/i, "https:"),
	);

	if (urls.length === 0) {
		return [];
	}

	const results = await Promise.allSettled(
		urls.map((url) =>
			fetchTextWithTimeout(
				url,
				{
					headers: parseLooseHeaderString(headers),
				},
				10000,
			),
		),
	);

	return results
		.filter(
			(result): result is PromiseFulfilledResult<string> =>
				result.status === "fulfilled",
		)
		.map((result) => result.value);
}

export async function loadCalendarRecipeData(
	providerLabel: string,
	params?: CalendarParams,
): Promise<CalendarRecipeData> {
	const timeZone = String(params?.timezone || DEFAULT_TIME_ZONE).trim();
	const eventLayout = normalizeLayout(params?.eventLayout);
	const includeDescription = parseBoolean(params?.includeDescription, true);
	const includeEventTime = parseBoolean(params?.includeEventTime, true);
	const firstDay = normalizeFirstDay(params?.firstDay);
	const timeFormat = normalizeTimeFormat(params?.timeFormat);
	const maxEventsPerDay = Math.max(
		1,
		Math.min(8, Number(params?.maxEventsPerDay || (eventLayout === "month" ? 4 : 6))),
	);
	const calendarName = String(params?.calendarName || "").trim();
	const title = `${providerLabel} Calendar`;
	const subtitle =
		calendarName ||
		(providerLabel === "Apple" ? "Personal Calendar" : "Connected Calendar");
	const ignoredPhrases = parseList(params?.ignoredPhrases);
	const icsUrlInput = String(params?.icsUrl || "").trim();

	if (!icsUrlInput) {
		return buildFallbackData(
			providerLabel,
			timeZone,
			eventLayout,
			firstDay,
			includeDescription,
			includeEventTime,
			"Preview - your device will show actual data once an ICS feed is configured.",
			calendarName,
		);
	}

	try {
		const sources = await loadIcsSources(icsUrlInput, params?.headers);
		if (sources.length === 0) {
			return buildFallbackData(
				providerLabel,
				timeZone,
				eventLayout,
				firstDay,
				includeDescription,
				includeEventTime,
				"No valid ICS feeds were fetched, so this preview is showing sample events.",
				calendarName,
			);
		}

		const now = new Date();
		const windowStart = addDays(startOfDay(now), -35);
		const windowEnd = addDays(startOfDay(now), 45);
		const rawEvents = filterIgnoredEvents(
			sources
				.flatMap((source) => parseEventsFromIcs(source))
				.flatMap((event) => expandRecurringEvent(event, windowStart, windowEnd))
				.filter(
					(event) =>
						event.status.toUpperCase() !== "CANCELLED" &&
						eventEndInclusive(event) >= windowStart &&
						event.start <= windowEnd,
				),
			ignoredPhrases,
		).sort((a, b) => a.start.getTime() - b.start.getTime());

		if (rawEvents.length === 0) {
			return buildFallbackData(
				providerLabel,
				timeZone,
				eventLayout,
				firstDay,
				includeDescription,
				includeEventTime,
				"No matching events were found for the selected layout window.",
				calendarName,
			);
		}

		return buildCalendarData({
			providerLabel,
			title,
			subtitle,
			timeZone,
			layout: eventLayout,
			includeDescription,
			includeEventTime,
			firstDay,
			timeFormat,
			maxEventsPerDay,
			rawEvents,
			note: "Preview - your device will show actual data",
		});
	} catch (error) {
		console.error(`Error loading ${providerLabel} calendar data:`, error);
		return buildFallbackData(
			providerLabel,
			timeZone,
			eventLayout,
			firstDay,
			includeDescription,
			includeEventTime,
			"Live calendar fetch failed, so this preview is showing sample events.",
			calendarName,
		);
	}
}

import {
	fetchTextWithTimeout,
	formatDateTime,
	formatUpdatedAt,
	parseLooseHeaderString,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export type CalendarEvent = {
	id: string;
	summary: string;
	description: string;
	location: string;
	dayLabel: string;
	timeLabel: string;
	startIso: string;
	endIso: string;
	allDay: boolean;
	isToday: boolean;
};

export type CalendarRecipeData = {
	providerLabel: string;
	title: string;
	subtitle: string;
	timeZone: string;
	updatedAt: string;
	note?: string;
	events: CalendarEvent[];
};

type CalendarParams = {
	icsUrl?: string;
	calendarName?: string;
	headers?: string;
	timezone?: string;
	maxEvents?: string | number;
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

const DEFAULT_TIME_ZONE = "America/New_York";
const DEFAULT_MAX_EVENTS = 6;
const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function buildFallbackEvents(timeZone: string): CalendarEvent[] {
	const now = new Date();
	const base = [
		{
			id: "sample-1",
			summary: "Project standup",
			description: "Quick sync with the BYOS crew.",
			location: "Studio",
			allDay: false,
			start: new Date(now.getTime() + 60 * 60 * 1000),
			end: new Date(now.getTime() + 2 * 60 * 60 * 1000),
		},
		{
			id: "sample-2",
			summary: "Ship new recipes",
			description: "Calendar, Parcel, DSN, FlightBoard, Pokemon.",
			location: "GitHub",
			allDay: false,
			start: new Date(now.getTime() + 26 * 60 * 60 * 1000),
			end: new Date(now.getTime() + 28 * 60 * 60 * 1000),
		},
		{
			id: "sample-3",
			summary: "Recharge day",
			description: "All-day block reserved for deep work.",
			location: "",
			allDay: true,
			start: new Date(now.getTime() + 48 * 60 * 60 * 1000),
			end: new Date(now.getTime() + 72 * 60 * 60 * 1000),
		},
	];

	return base.map((event) => formatCalendarEvent(event, timeZone));
}

function buildFallbackData(
	providerLabel: string,
	timeZone: string,
	note: string,
	title?: string,
): CalendarRecipeData {
	return {
		providerLabel,
		title: title || `${providerLabel} Calendar`,
		subtitle: "Next 3 events",
		timeZone,
		updatedAt: formatUpdatedAt(new Date(), timeZone),
		note,
		events: buildFallbackEvents(timeZone),
	};
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
			date: new Date(Date.UTC(year, month, day)),
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

function startOfWeek(date: Date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	next.setDate(next.getDate() - next.getDay());
	return next;
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
	const baseWeek = startOfWeek(event.start).getTime();

	for (let index = 0; index < 120; index += 1) {
		if (cursor > windowEnd) break;

		const weekOffset =
			(startOfWeek(cursor).getTime() - baseWeek) / (7 * 24 * 60 * 60 * 1000);
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

function formatCalendarEvent(
	event: Pick<
		RawCalendarEvent,
		"id" | "summary" | "description" | "location" | "allDay" | "start" | "end"
	>,
	timeZone: string,
): CalendarEvent {
	const nowDay = formatDateTime(
		new Date(),
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		},
		timeZone,
	);
	const eventDay = formatDateTime(
		event.start,
		{
			weekday: "short",
			month: "short",
			day: "numeric",
		},
		timeZone,
	);
	const dayKey = formatDateTime(
		event.start,
		{
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		},
		timeZone,
	);
	const timeLabel = event.allDay
		? "All day"
		: `${formatDateTime(event.start, {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}, timeZone)} - ${formatDateTime(event.end, {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}, timeZone)}`;

	return {
		id: event.id,
		summary: event.summary,
		description: event.description,
		location: event.location,
		dayLabel: eventDay,
		timeLabel,
		startIso: event.start.toISOString(),
		endIso: event.end.toISOString(),
		allDay: event.allDay,
		isToday: dayKey === nowDay,
	};
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
			const endParsed = dtEndProp ? parseIcsDate(dtEndProp.value, dtEndProp.params) : null;

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

export async function loadCalendarRecipeData(
	providerLabel: string,
	params?: CalendarParams,
): Promise<CalendarRecipeData> {
	const timeZone = String(params?.timezone || DEFAULT_TIME_ZONE).trim();
	const title = String(params?.calendarName || `${providerLabel} Calendar`).trim();
	const icsUrl = String(params?.icsUrl || "").trim();
	const maxEvents = Math.max(
		1,
		Math.min(12, Number(params?.maxEvents || DEFAULT_MAX_EVENTS)),
	);

	if (!icsUrl) {
		return buildFallbackData(
			providerLabel,
			timeZone,
			"Add a public ICS feed to load live events.",
			title,
		);
	}

	try {
		const ics = await fetchTextWithTimeout(
			icsUrl,
			{
				headers: parseLooseHeaderString(params?.headers),
			},
			10000,
		);

		const now = new Date();
		const windowStart = addDays(now, -1);
		const windowEnd = addDays(now, 30);

		const expandedEvents = parseEventsFromIcs(ics)
			.flatMap((event) => expandRecurringEvent(event, windowStart, windowEnd))
			.filter((event) => event.end >= now && event.status.toUpperCase() !== "CANCELLED")
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.slice(0, maxEvents)
			.map((event) => formatCalendarEvent(event, timeZone));

		if (expandedEvents.length === 0) {
			return buildFallbackData(
				providerLabel,
				timeZone,
				"No upcoming events were found in this feed.",
				title,
			);
		}

		return {
			providerLabel,
			title,
			subtitle: `Next ${expandedEvents.length} events`,
			timeZone,
			updatedAt: formatUpdatedAt(new Date(), timeZone),
			events: expandedEvents,
		};
	} catch (error) {
		console.error(`Error loading ${providerLabel} calendar data:`, error);
		return buildFallbackData(
			providerLabel,
			timeZone,
			"Live calendar fetch failed, so this preview is showing sample events.",
			title,
		);
	}
}

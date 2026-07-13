import {
	fetchTextWithTimeout,
	formatDateTime,
	formatUpdatedAt,
	parseLooseHeaderString,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export type CalendarLayout =
	| "default"
	| "two-day"
	| "week-timeline"
	| "month-overview";

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
	startDateTime: string;
	endDateTime: string;
	startMinute: number | null;
	endMinute: number | null;
	calendarLabel?: string;
};

export type CalendarDay = {
	key: string;
	isoDate: string;
	label: string;
	shortLabel: string;
	dayNumber: string;
	isToday: boolean;
	isCurrentMonth: boolean;
	eventCount: number;
	previousEventCount?: number;
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
	sourceLabels?: string[];
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
	calendarLabel?: string;
	recurrenceTimeZone: string;
	recurrenceId?: Date;
	seriesId?: string;
};

type CalendarSource = {
	label: string;
	url: string;
};

type LoadedCalendarSource = CalendarSource & {
	content: string;
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
const TIME_ZONE_ALIASES: Record<string, string> = {
	"eastern standard time": "America/New_York",
	"eastern daylight time": "America/New_York",
	"eastern time": "America/New_York",
	"eastern time (us & canada)": "America/New_York",
	"central standard time": "America/Chicago",
	"central daylight time": "America/Chicago",
	"central time": "America/Chicago",
	"central time (us & canada)": "America/Chicago",
	"mountain standard time": "America/Denver",
	"mountain daylight time": "America/Denver",
	"mountain time": "America/Denver",
	"pacific standard time": "America/Los_Angeles",
	"pacific daylight time": "America/Los_Angeles",
	"pacific time": "America/Los_Angeles",
	"pacific time (us & canada)": "America/Los_Angeles",
	"greenwich standard time": "Europe/London",
	"gmt standard time": "Europe/London",
	"w. europe standard time": "Europe/Berlin",
	"central europe standard time": "Europe/Budapest",
	"romance standard time": "Europe/Paris",
	"central european standard time": "Europe/Warsaw",
	"tokyo standard time": "Asia/Tokyo",
	"india standard time": "Asia/Kolkata",
	"aus eastern standard time": "Australia/Sydney",
	"australian eastern standard time": "Australia/Sydney",
	utc: "UTC",
	"etc/utc": "UTC",
};

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
		case "two-day":
		case "twoday":
		case "two_day":
			return "two-day";
		case "week":
			return "week-timeline";
		case "week-timeline":
		case "week_timeline":
		case "timeline-week":
		case "week-grid":
			return "week-timeline";
		case "month-overview":
		case "month_overview":
		case "monthoverview":
			return "month-overview";
		case "month":
		case "rolling_month":
			return "month-overview";
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

function normalizeTimeZoneIdentifier(
	value?: string,
	fallback = DEFAULT_TIME_ZONE,
) {
	const trimmed = String(value || "")
		.trim()
		.replace(/^"+|"+$/g, "")
		.replace(/^'+|'+$/g, "");
	if (!trimmed) {
		return DEFAULT_TIME_ZONE;
	}

	try {
		new Intl.DateTimeFormat("en-US", { timeZone: trimmed });
		return trimmed;
	} catch {
		const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, " ");
		const aliased =
			TIME_ZONE_ALIASES[normalizedKey] ||
			Object.entries(TIME_ZONE_ALIASES).find(([key]) =>
				normalizedKey.includes(key),
			)?.[1];
		if (aliased) {
			return aliased;
		}
	}

	if (fallback !== value) {
		try {
			new Intl.DateTimeFormat("en-US", { timeZone: fallback });
			return fallback;
		} catch {
			// Fall through to the guaranteed-safe default.
		}
	}

	return DEFAULT_TIME_ZONE;
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

function isoDayKey(date: Date, timeZone: string) {
	const values = zonedDateBits(date, timeZone);
	return `${values.year.toString().padStart(4, "0")}-${values.month
		.toString()
		.padStart(2, "0")}-${values.day.toString().padStart(2, "0")}`;
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

function formatClock(date: Date, timeZone: string, timeFormat: "12h" | "24h") {
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

function zonedTimeParts(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const values = parts.reduce<Record<string, string>>((acc, part) => {
		if (part.type !== "literal") {
			acc[part.type] = part.value;
		}
		return acc;
	}, {});

	return {
		hour: Number(values.hour || "0"),
		minute: Number(values.minute || "0"),
	};
}

function startOfDay(date: Date) {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		0,
		0,
		0,
		0,
	);
}

function zonedDateBits(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	const values = parts.reduce<Record<string, string>>((acc, part) => {
		if (part.type !== "literal") {
			acc[part.type] = part.value;
		}
		return acc;
	}, {});

	return {
		year: Number(values.year),
		month: Number(values.month),
		day: Number(values.day),
	};
}

function zonedCalendarDate(date: Date, timeZone: string) {
	const values = zonedDateBits(date, timeZone);

	return new Date(values.year, values.month - 1, values.day, 12, 0, 0, 0);
}

function addZonedDays(date: Date, days: number, timeZone: string) {
	return zonedCalendarDate(addDays(date, days), timeZone);
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

function parseCalendarSources(value?: string): CalendarSource[] {
	return parseList(value).map((entry, index) => {
		const separator = entry.indexOf("|");
		const hasLabel = separator > 0;
		const label = hasLabel ? entry.slice(0, separator).trim() : "";
		const rawUrl = hasLabel ? entry.slice(separator + 1).trim() : entry;

		return {
			label: label || `Kalender ${index + 1}`,
			url: rawUrl.replace(/^webcal:/i, "https:"),
		};
	});
}

function buildFallbackRawEvents() {
	const now = new Date();
	return [
		{
			id: "sample-1",
			summary: "Projektabstimmung",
			description: "Prioritäten und offene Punkte",
			location: "Teams",
			status: "confirmed",
			allDay: false,
			start: new Date(now.getTime() - 30 * 60 * 1000),
			end: new Date(now.getTime() + 45 * 60 * 1000),
			exdates: [],
			calendarLabel: "Arbeit",
			recurrenceTimeZone: DEFAULT_TIME_ZONE,
		},
		{
			id: "sample-2",
			summary: "Einkaufen",
			description: "Wochenmarkt und Apotheke",
			location: "Innenstadt",
			status: "confirmed",
			allDay: false,
			start: new Date(now.getTime() + 90 * 60 * 1000),
			end: new Date(now.getTime() + 150 * 60 * 1000),
			exdates: [],
			calendarLabel: "Privat",
			recurrenceTimeZone: DEFAULT_TIME_ZONE,
		},
		{
			id: "sample-3",
			summary: "Geburtstag Anna",
			description: "",
			location: "",
			status: "confirmed",
			allDay: true,
			start: addDays(startOfDay(now), 1),
			end: addDays(startOfDay(now), 2),
			exdates: [],
			calendarLabel: "Familie",
			recurrenceTimeZone: DEFAULT_TIME_ZONE,
		},
		{
			id: "sample-4",
			summary: "Design Review",
			description: "Freigabe des Display-Layouts",
			location: "Studio",
			status: "confirmed",
			allDay: false,
			start: new Date(addDays(now, 1).setHours(10, 0, 0, 0)),
			end: new Date(addDays(now, 1).setHours(11, 0, 0, 0)),
			exdates: [],
			calendarLabel: "Arbeit",
			recurrenceTimeZone: DEFAULT_TIME_ZONE,
		},
		{
			id: "sample-5",
			summary: "Abendessen mit Familie",
			description: "Tisch ist reserviert",
			location: "Restaurant",
			status: "confirmed",
			allDay: false,
			start: new Date(addDays(now, 1).setHours(18, 30, 0, 0)),
			end: new Date(addDays(now, 1).setHours(20, 0, 0, 0)),
			exdates: [],
			calendarLabel: "Familie",
			recurrenceTimeZone: DEFAULT_TIME_ZONE,
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
	timeFormat: "12h" | "24h" = "12h",
	maxEventsPerDay = 4,
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
		timeFormat,
		maxEventsPerDay,
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

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const values = parts.reduce<Record<string, string>>((acc, part) => {
		if (part.type !== "literal") {
			acc[part.type] = part.value;
		}
		return acc;
	}, {});

	const asUtc = Date.UTC(
		Number(values.year),
		Number(values.month) - 1,
		Number(values.day),
		Number(values.hour),
		Number(values.minute),
		Number(values.second),
	);

	return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
	parts: ReturnType<typeof parseDateBits>,
	timeZone: string,
) {
	const guess = Date.UTC(
		parts.year,
		parts.month,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second,
	);
	const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone);
	const firstPass = guess - firstOffset;
	const secondOffset = getTimeZoneOffsetMs(new Date(firstPass), timeZone);

	return new Date(
		secondOffset === firstOffset ? firstPass : guess - secondOffset,
	);
}

function zonedStartOfDayUtc(date: Date, timeZone: string) {
	const bits = zonedDateBits(date, timeZone);
	return zonedDateTimeToUtc(
		{
			year: bits.year,
			month: bits.month - 1,
			day: bits.day,
			hour: 0,
			minute: 0,
			second: 0,
		},
		timeZone,
	);
}

function zonedEndOfDayUtc(date: Date, timeZone: string) {
	const nextDayStart = zonedStartOfDayUtc(
		addZonedDays(date, 1, timeZone),
		timeZone,
	);
	return new Date(nextDayStart.getTime() - 1);
}

function parseIcsDate(
	value: string,
	params: Record<string, string>,
	fallbackTimeZone?: string,
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

	const dateBits = parseDateBits(value);
	const fallback = normalizeTimeZoneIdentifier(fallbackTimeZone);
	const timeZone = normalizeTimeZoneIdentifier(params.TZID?.trim(), fallback);

	return {
		date: timeZone
			? zonedDateTimeToUtc(dateBits, timeZone)
			: new Date(
					dateBits.year,
					dateBits.month,
					dateBits.day,
					dateBits.hour,
					dateBits.minute,
					dateBits.second,
				),
		allDay: false,
	};
}

function dayCodeToIndex(code: string) {
	return DAY_NAMES.indexOf(code.replace(/^[+-]?\d+/, ""));
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
		seriesId: event.seriesId || event.id,
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
	const until = rule.UNTIL
		? parseIcsDate(rule.UNTIL, {}, event.recurrenceTimeZone)?.date
		: null;
	const durationMs = event.end.getTime() - event.start.getTime();

	if (!freq || !["DAILY", "WEEKLY", "MONTHLY"].includes(freq)) {
		return eventIntersectsWindow(event, windowStart, windowEnd) ? [event] : [];
	}

	const results: RawCalendarEvent[] = [];
	const recurrenceZone = event.recurrenceTimeZone;
	const startBits = zonedDateBits(event.start, recurrenceZone);
	const startTime = zonedTimeParts(event.start, recurrenceZone);
	const startDate = new Date(
		startBits.year,
		startBits.month - 1,
		startBits.day,
		12,
		0,
		0,
		0,
	);
	const endBits = zonedDateBits(windowEnd, recurrenceZone);
	const finalDate = new Date(
		endBits.year,
		endBits.month - 1,
		endBits.day,
		12,
		0,
		0,
		0,
	);

	const occurrenceStart = (calendarDate: Date) => {
		if (event.allDay) {
			return new Date(
				Date.UTC(
					calendarDate.getFullYear(),
					calendarDate.getMonth(),
					calendarDate.getDate(),
					12,
				),
			);
		}

		return zonedDateTimeToUtc(
			{
				year: calendarDate.getFullYear(),
				month: calendarDate.getMonth(),
				day: calendarDate.getDate(),
				hour: startTime.hour,
				minute: startTime.minute,
				second: 0,
			},
			recurrenceZone,
		);
	};

	let occurrenceIndex = 0;
	const appendOccurrence = (calendarDate: Date) => {
		const start = occurrenceStart(calendarDate);
		if (start < event.start) return true;
		if (until && start > until) return false;
		if (count > 0 && occurrenceIndex >= count) return false;

		const index = occurrenceIndex;
		occurrenceIndex += 1;
		const end = new Date(start.getTime() + durationMs);
		if (!isExcluded(start, event.exdates)) {
			const occurrence = cloneOccurrence(event, start, end, index);
			if (eventIntersectsWindow(occurrence, windowStart, windowEnd)) {
				results.push(occurrence);
			}
		}
		return true;
	};

	if (freq === "DAILY") {
		for (
			let cursor = new Date(startDate);
			cursor <= finalDate;
			cursor = addDays(cursor, interval)
		) {
			if (!appendOccurrence(cursor)) break;
		}
		return results;
	}

	if (freq === "MONTHLY") {
		const byMonthDays = (rule.BYMONTHDAY || "")
			.split(",")
			.map(Number)
			.filter((day) => Number.isInteger(day) && day !== 0);
		const byDayRules = (rule.BYDAY || "")
			.split(",")
			.map((value) => {
				const match = value.match(/^([+-]?\d+)?([A-Z]{2})$/);
				if (!match) return null;
				const weekday = dayCodeToIndex(match[2]);
				if (weekday < 0) return null;
				return {
					ordinal: match[1] ? Number(match[1]) : null,
					weekday,
				};
			})
			.filter(
				(value): value is { ordinal: number | null; weekday: number } =>
					value !== null,
			);
		const datesForMonth = (monthCursor: Date) => {
			const year = monthCursor.getFullYear();
			const month = monthCursor.getMonth();
			const daysInMonth = new Date(year, month + 1, 0).getDate();
			const dates: Date[] = [];

			for (const monthDay of byMonthDays) {
				const resolvedDay =
					monthDay > 0 ? monthDay : daysInMonth + monthDay + 1;
				if (resolvedDay >= 1 && resolvedDay <= daysInMonth) {
					dates.push(new Date(year, month, resolvedDay, 12));
				}
			}

			for (const byDay of byDayRules) {
				const matches = Array.from(
					{ length: daysInMonth },
					(_, index) => new Date(year, month, index + 1, 12),
				).filter((date) => date.getDay() === byDay.weekday);
				if (byDay.ordinal === null) {
					dates.push(...matches);
				} else {
					const match =
						byDay.ordinal > 0
							? matches[byDay.ordinal - 1]
							: matches[matches.length + byDay.ordinal];
					if (match) dates.push(match);
				}
			}

			if (dates.length === 0) {
				const defaultDay = startDate.getDate();
				if (defaultDay <= daysInMonth) {
					dates.push(new Date(year, month, defaultDay, 12));
				}
			}

			return dates
				.filter(
					(date, index, allDates) =>
						allDates.findIndex(
							(candidate) => candidate.getTime() === date.getTime(),
						) === index,
				)
				.sort((a, b) => a.getTime() - b.getTime());
		};

		for (
			let monthCursor = new Date(
				startDate.getFullYear(),
				startDate.getMonth(),
				1,
				12,
			);
			monthCursor <= finalDate;
			monthCursor = addMonths(monthCursor, interval)
		) {
			for (const occurrenceDate of datesForMonth(monthCursor)) {
				if (!appendOccurrence(occurrenceDate)) return results;
			}
		}
		return results;
	}

	const parsedByDay =
		rule.BYDAY?.split(",")
			.map(dayCodeToIndex)
			.filter((day) => day >= 0) || [];
	const byDay = parsedByDay.length > 0 ? parsedByDay : [startDate.getDay()];
	const baseWeek = startOfWeek(startDate, 0).getTime();

	for (
		let cursor = new Date(startDate);
		cursor <= finalDate;
		cursor = addDays(cursor, 1)
	) {
		const weekOffset = Math.round(
			(startOfWeek(cursor, 0).getTime() - baseWeek) / (7 * 24 * 60 * 60 * 1000),
		);
		if (weekOffset % interval !== 0 || !byDay.includes(cursor.getDay())) {
			continue;
		}
		if (!appendOccurrence(cursor)) break;
	}

	return results;
}

function parseEventsFromIcs(
	source: string,
	calendarLabel: string | undefined,
	displayTimeZone: string,
) {
	const lines = unfoldIcs(source).split(/\r?\n/);
	const events: RawCalendarEvent[] = [];
	const calendarTimeZone = normalizeTimeZoneIdentifier(
		lines
			.map((line) => parseProperty(line))
			.find((prop) => prop?.name === "X-WR-TIMEZONE")?.value,
		displayTimeZone,
	);
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
				? parseIcsDate(dtStartProp.value, dtStartProp.params, calendarTimeZone)
				: null;
			const endParsed = dtEndProp
				? parseIcsDate(dtEndProp.value, dtEndProp.params, calendarTimeZone)
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
						.map(
							(value) =>
								parseIcsDate(value, prop.params, calendarTimeZone)?.date,
						)
						.filter((value): value is Date => value instanceof Date),
				);
			const recurrenceTimeZone = dtStartProp?.value.endsWith("Z")
				? "UTC"
				: normalizeTimeZoneIdentifier(
						dtStartProp?.params.TZID,
						calendarTimeZone,
					);
			const recurrenceIdProp = props.find(
				(prop) => prop.name === "RECURRENCE-ID",
			);
			const recurrenceId = recurrenceIdProp
				? parseIcsDate(
						recurrenceIdProp.value,
						recurrenceIdProp.params,
						calendarTimeZone,
					)?.date
				: undefined;

			const eventId =
				props.find((prop) => prop.name === "UID")?.value ||
				`${startParsed.date.toISOString()}-${props.find((prop) => prop.name === "SUMMARY")?.value || "event"}`;

			events.push({
				id: eventId,
				seriesId: eventId,
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
				calendarLabel,
				recurrenceTimeZone,
				recurrenceId,
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

function expandCalendarEvents(
	events: RawCalendarEvent[],
	windowStart: Date,
	windowEnd: Date,
) {
	const overrides = events.filter((event) => event.recurrenceId);
	const overriddenOccurrences = new Set(
		overrides.map(
			(event) => `${event.seriesId}|${event.recurrenceId?.toISOString() || ""}`,
		),
	);
	const expanded = events
		.filter((event) => !event.recurrenceId)
		.flatMap((event) => expandRecurringEvent(event, windowStart, windowEnd))
		.filter(
			(event) =>
				!overriddenOccurrences.has(
					`${event.seriesId}|${event.start.toISOString()}`,
				),
		);
	const activeOverrides = overrides.filter(
		(event) =>
			event.status.toUpperCase() !== "CANCELLED" &&
			eventIntersectsWindow(event, windowStart, windowEnd),
	);

	return [...expanded, ...activeOverrides];
}

function filterIgnoredEvents(
	events: RawCalendarEvent[],
	ignoredPhrases: string[],
) {
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
	const dayStartKey = dayKey(dayDate, options.timeZone);
	const dayStart = zonedStartOfDayUtc(dayDate, options.timeZone);
	const nextDayStart = zonedStartOfDayUtc(
		addZonedDays(dayDate, 1, options.timeZone),
		options.timeZone,
	);
	const inclusiveEnd = eventEndInclusive(event);
	const startsToday = dayKey(event.start, options.timeZone) === dayStartKey;
	const endsToday = dayKey(inclusiveEnd, options.timeZone) === dayStartKey;
	const multiDay =
		dayKey(event.start, options.timeZone) !==
		dayKey(inclusiveEnd, options.timeZone);
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

	let startMinute: number | null = null;
	let endMinute: number | null = null;

	if (!event.allDay) {
		const segmentStart =
			event.start > dayStart ? event.start : new Date(dayStart.getTime());
		const segmentEnd =
			event.end < nextDayStart
				? event.end
				: new Date(nextDayStart.getTime() - 1);
		const segmentStartParts = zonedTimeParts(segmentStart, options.timeZone);
		const segmentEndParts = zonedTimeParts(segmentEnd, options.timeZone);

		startMinute = segmentStartParts.hour * 60 + segmentStartParts.minute;
		endMinute = segmentEndParts.hour * 60 + segmentEndParts.minute;

		if (event.end >= nextDayStart) {
			endMinute = 24 * 60;
		} else if (event.end > segmentStart && endMinute <= startMinute) {
			endMinute = Math.min(24 * 60, startMinute + 15);
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
		startDateTime: event.start.toISOString(),
		endDateTime: event.end.toISOString(),
		startMinute,
		endMinute,
		calendarLabel: event.calendarLabel,
	};
}

function buildDay(
	dayDate: Date,
	events: RawCalendarEvent[],
	options: BuildDayOptions,
): CalendarDay {
	const dayStart = zonedStartOfDayUtc(dayDate, options.timeZone);
	const dayEnd = zonedEndOfDayUtc(dayDate, options.timeZone);
	const now = zonedCalendarDate(new Date(), options.timeZone);
	const isToday =
		dayKey(dayDate, options.timeZone) === dayKey(now, options.timeZone);

	const matchingEvents = events
		.filter((event) => {
			const inclusiveEnd = eventEndInclusive(event);
			return inclusiveEnd >= dayStart && event.start <= dayEnd;
		})
		.sort((a, b) => a.start.getTime() - b.start.getTime());
	const previousEventCount = isToday
		? matchingEvents.filter(
				(event) => eventEndInclusive(event).getTime() < Date.now(),
			).length
		: 0;

	const visibleSource = isToday
		? matchingEvents.filter(
				(event) => eventEndInclusive(event).getTime() >= Date.now(),
			)
		: matchingEvents;

	const dayEvents = visibleSource
		.slice(0, options.maxEventsPerDay)
		.map((event) => buildEventForDay(event, dayDate, options));

	return {
		key: dayKey(dayDate, options.timeZone),
		isoDate: isoDayKey(dayDate, options.timeZone),
		label: shortDateLabel(dayDate, options.timeZone),
		shortLabel: weekdayShort(dayDate, options.timeZone),
		dayNumber: dayNumber(dayDate, options.timeZone),
		isToday,
		isCurrentMonth:
			options.currentMonth === undefined ||
			dayDate.getMonth() === options.currentMonth,
		eventCount: matchingEvents.length,
		previousEventCount,
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
	sourceLabels,
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
	sourceLabels?: string[];
}): CalendarRecipeData {
	const today = zonedCalendarDate(new Date(), timeZone);
	const todayBits = zonedDateBits(today, timeZone);
	const currentMonthStart = new Date(
		todayBits.year,
		todayBits.month - 1,
		1,
		12,
		0,
		0,
		0,
	);
	const currentMonthEnd = new Date(
		todayBits.year,
		todayBits.month,
		0,
		12,
		0,
		0,
		0,
	);
	const monthGridStart = startOfWeek(currentMonthStart, firstDay);
	const monthGridEnd = endOfWeek(currentMonthEnd, firstDay);

	// Six days keep the existing today-based recipes intact while allowing
	// forward-looking views to render tomorrow through day +5.
	const defaultDays = Array.from({ length: 6 }, (_, index) =>
		buildDay(addZonedDays(today, index, timeZone), rawEvents, {
			timeZone,
			timeFormat,
			includeEventTime,
			maxEventsPerDay,
		}),
	);

	const weekStart = startOfWeek(today, firstDay);
	const weekDays = Array.from({ length: 7 }, (_, index) =>
		buildDay(addZonedDays(weekStart, index, timeZone), rawEvents, {
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
		cursor = addZonedDays(cursor, 1, timeZone)
	) {
		flatMonthDays.push(
			buildDay(cursor, rawEvents, {
				timeZone,
				timeFormat,
				includeEventTime,
				maxEventsPerDay,
				currentMonth: todayBits.month - 1,
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
		sourceLabels:
			sourceLabels ||
			Array.from(
				new Set(
					rawEvents
						.map((event) => event.calendarLabel)
						.filter((label): label is string => Boolean(label)),
				),
			),
	};
}

async function loadIcsSources(
	icsUrlInput: string,
	headers?: string,
): Promise<{ sources: LoadedCalendarSource[]; failedLabels: string[] }> {
	const calendarSources = parseCalendarSources(icsUrlInput);

	if (calendarSources.length === 0) {
		return { sources: [], failedLabels: [] };
	}

	const results = await Promise.allSettled(
		calendarSources.map((source) =>
			fetchTextWithTimeout(
				source.url,
				{
					headers: parseLooseHeaderString(headers),
				},
				10000,
			),
		),
	);

	const sources = results.flatMap((result, index) =>
		result.status === "fulfilled"
			? [{ ...calendarSources[index], content: result.value }]
			: [],
	);
	const failedLabels = results.flatMap((result, index) =>
		result.status === "rejected" ? [calendarSources[index].label] : [],
	);

	return { sources, failedLabels };
}

export async function loadCalendarRecipeData(
	providerLabel: string,
	params?: CalendarParams,
): Promise<CalendarRecipeData> {
	const timeZone = normalizeTimeZoneIdentifier(params?.timezone);
	const eventLayout = normalizeLayout(params?.eventLayout || "month-overview");
	const includeDescription = parseBoolean(params?.includeDescription, true);
	const includeEventTime = parseBoolean(params?.includeEventTime, true);
	const firstDay = normalizeFirstDay(params?.firstDay);
	const timeFormat = normalizeTimeFormat(params?.timeFormat);
	const maxEventsPerDay = Math.max(
		1,
		Math.min(8, Number(params?.maxEventsPerDay || 6)),
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
			timeFormat,
			maxEventsPerDay,
		);
	}

	try {
		const { sources, failedLabels } = await loadIcsSources(
			icsUrlInput,
			params?.headers,
		);
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
				timeFormat,
				maxEventsPerDay,
			);
		}

		const now = zonedCalendarDate(new Date(), timeZone);
		const windowStart = zonedStartOfDayUtc(
			addZonedDays(now, -35, timeZone),
			timeZone,
		);
		const windowEnd = zonedEndOfDayUtc(
			addZonedDays(now, 45, timeZone),
			timeZone,
		);
		const parsedEvents = sources.flatMap((source) =>
			parseEventsFromIcs(source.content, source.label, timeZone),
		);
		const rawEvents = filterIgnoredEvents(
			expandCalendarEvents(parsedEvents, windowStart, windowEnd).filter(
				(event) =>
					event.status.toUpperCase() !== "CANCELLED" &&
					eventEndInclusive(event) >= windowStart &&
					event.start <= windowEnd,
			),
			ignoredPhrases,
		)
			.filter((event, index, events) => {
				const fingerprint = `${event.start.toISOString()}|${event.end.toISOString()}|${event.summary.trim().toLowerCase()}`;
				return (
					events.findIndex(
						(candidate) =>
							`${candidate.start.toISOString()}|${candidate.end.toISOString()}|${candidate.summary.trim().toLowerCase()}` ===
							fingerprint,
					) === index
				);
			})
			.sort((a, b) => a.start.getTime() - b.start.getTime());

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
				timeFormat,
				maxEventsPerDay,
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
			note:
				failedLabels.length > 0
					? `Nicht erreichbar: ${failedLabels.join(", ")}`
					: undefined,
			sourceLabels: sources.map((source) => source.label),
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
			timeFormat,
			maxEventsPerDay,
		);
	}
}

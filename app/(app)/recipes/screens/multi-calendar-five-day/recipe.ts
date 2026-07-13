import type {
	CalendarDay,
	CalendarDayEvent,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData, { type MultiCalendarFiveDayData } from "./getData";

export const id = "multi-calendar-five-day";
export const title = "Multi-Kalender · Nächste 5 Tage";
export const renderer = "chromium";

export { getData };

function parseIsoDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`);
}

function formatClock(timeZone: string) {
	return new Intl.DateTimeFormat("de-DE", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
}

function formatDay(day: CalendarDay) {
	const date = parseIsoDate(day.isoDate);
	const weekday = new Intl.DateTimeFormat("de-DE", {
		weekday: "short",
	}).format(date);
	const fullWeekday = new Intl.DateTimeFormat("de-DE", {
		weekday: "long",
	}).format(date);
	return {
		weekday: weekday.replace(".", "").toUpperCase(),
		fullWeekday: fullWeekday.charAt(0).toUpperCase() + fullWeekday.slice(1),
		date: new Intl.DateTimeFormat("de-DE", {
			day: "2-digit",
			month: "2-digit",
		}).format(date),
	};
}

function eventTime(event: CalendarDayEvent, includeEventTime: boolean) {
	if (event.allDay) return "GANZTÄGIG";
	if (event.multiDay) return "FORTLAUFEND";
	if (!includeEventTime) return "TERMIN";
	return event.timeLabel || "TERMIN";
}

function sourceClass(label: string) {
	let hash = 0;
	for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return `source-${hash % 4}`;
}

function renderEvent(
	event: CalendarDayEvent,
	data: MultiCalendarFiveDayData,
	isNow: boolean,
) {
	const label = event.calendarLabel || "Kalender";
	const details = [
		data.includeDescription ? event.description : "",
		data.showLocation && event.location ? event.location : "",
	]
		.filter(Boolean)
		.join(" · ");

	return `
		<li class="event${isNow ? " event--now" : ""}">
			<div class="event__rail ${sourceClass(label)}"></div>
			<div class="event__body">
				<div class="event__time">${escapeHtml(eventTime(event, data.includeEventTime))}</div>
				${data.showCalendarLabels ? `<div class="source ${sourceClass(label)}">${escapeHtml(label)}</div>` : ""}
				<div class="event__title">${escapeHtml(event.summary)}</div>
				${details ? `<div class="event__details">${escapeHtml(details)}</div>` : ""}
			</div>
			${isNow ? '<div class="now-flag">JETZT</div>' : ""}
		</li>`;
}

function renderDay(day: CalendarDay, data: MultiCalendarFiveDayData) {
	const formatted = formatDay(day);
	const events = day.events.slice(0, 4);
	const previousCount = day.previousEventCount || 0;
	const remainingCount = Math.max(0, day.eventCount - previousCount);
	const hiddenCount = Math.max(0, remainingCount - events.length);
	const now = Date.now();

	return `
		<section class="day">
			<header class="day__header">
				<div class="day__topline">
					<div class="day__weekday">${escapeHtml(formatted.weekday)}</div>
					<div class="day__date">${escapeHtml(formatted.date)}</div>
				</div>
				<div class="day__name">${escapeHtml(formatted.fullWeekday)}</div>
				<div class="day__count">${remainingCount} ${remainingCount === 1 ? "TERMIN" : "TERMINE"}</div>
			</header>
			${previousCount > 0 ? `<div class="previous">↑ ${previousCount} VORHERIGE</div>` : ""}
			<ul class="events">
				${
					events.length > 0
						? events
								.map((event) =>
									renderEvent(
										event,
										data,
										day.isToday &&
											new Date(event.startDateTime).getTime() <= now &&
											new Date(event.endDateTime).getTime() >= now,
									),
								)
								.join("")
						: '<li class="empty"><span>✓</span><strong>FREI</strong></li>'
				}
			</ul>
			${hiddenCount > 0 ? `<div class="more">+${hiddenCount} WEITERE</div>` : ""}
		</section>`;
}

export function renderHtml(data: MultiCalendarFiveDayData) {
	const width = Math.max(640, Math.round(data.width || 800));
	const height = Math.max(360, Math.round(data.height || 480));
	const days = data.defaultDays.slice(1, 6);
	const sourceCount = data.sourceLabels?.length || 1;

	return buildTrmnlHtmlShell({
		title: data.displayName,
		width,
		height,
		bodyHtml: `
			<main class="screen calendar-screen">
				<header class="topbar">
					<div class="brand">
						<div class="calendar-icon"><span></span><span></span><span></span><span></span></div>
						<div class="brand__copy">
							<h1>${escapeHtml(data.displayName)}</h1>
							<div>MORGEN BIS TAG +5 · ${sourceCount} KALENDER</div>
						</div>
					</div>
					${data.note ? '<div class="status-warning">!</div>' : ""}
					<div class="clock"><span>AKTUALISIERT</span><strong>${escapeHtml(formatClock(data.timeZone))}</strong></div>
				</header>
				<div class="days">${days.map((day) => renderDay(day, data)).join("")}</div>
			</main>`,
		extraCss: `
			:root { --ink: #090909; --paper: #fff; }
			.calendar-screen { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 9px; font-variant-numeric: tabular-nums; }
			.topbar { height: 49px; flex: 0 0 49px; border-bottom: 3px solid var(--ink); display: flex; align-items: center; justify-content: space-between; padding: 0 3px 7px; background: var(--paper); }
			.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
			.calendar-icon { width: 32px; height: 32px; border: 3px solid var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 7px 5px 4px; position: relative; flex: 0 0 auto; }
			.calendar-icon::before { content: ""; position: absolute; left: -3px; right: -3px; top: 6px; height: 3px; background: var(--ink); }
			.calendar-icon span { width: 4px; height: 4px; background: var(--ink); align-self: end; justify-self: center; }
			.brand__copy { min-width: 0; }
			.brand h1 { margin: 0; max-width: 515px; font-size: 23px; line-height: 24px; font-weight: 800; letter-spacing: -.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.brand__copy > div { font-size: 9px; line-height: 11px; font-weight: 900; letter-spacing: 1px; }
			.clock { display: flex; align-items: baseline; gap: 8px; flex: 0 0 auto; }
			.clock span { font-size: 9px; font-weight: 900; letter-spacing: .9px; }
			.clock strong { font-size: 28px; line-height: 29px; letter-spacing: -1px; }
			.status-warning { width: 21px; height: 21px; border-radius: 50%; background: var(--ink); color: white; font-size: 14px; font-weight: 900; display: grid; place-items: center; margin-left: auto; margin-right: 12px; }
			.days { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
			.day { min-width: 0; border: 2px solid var(--ink); background: var(--paper); display: flex; flex-direction: column; overflow: hidden; }
			.day__header { height: 65px; flex: 0 0 65px; padding: 6px 7px 5px; border-bottom: 2px solid var(--ink); overflow: hidden; }
			.day__topline { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
			.day__weekday { padding: 3px 5px 2px; background: var(--ink); color: white; font-size: 9px; line-height: 10px; font-weight: 900; letter-spacing: .8px; }
			.day__date { font-size: 12px; line-height: 13px; font-weight: 900; }
			.day__name { margin-top: 4px; font-size: 15px; line-height: 16px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.day__count { margin-top: 1px; font-size: 8px; line-height: 9px; font-weight: 900; letter-spacing: .6px; }
			.previous { height: 18px; flex: 0 0 18px; border-bottom: 2px solid var(--ink); padding: 0 6px; font-size: 8px; line-height: 16px; font-weight: 900; letter-spacing: .4px; white-space: nowrap; background-image: repeating-linear-gradient(135deg, #fff 0 3px, #e5e5e5 3px 4px); }
			.events { margin: 0; padding: 0; list-style: none; flex: 1; min-height: 0; display: flex; flex-direction: column; }
			.event { position: relative; flex: 1 1 0; min-height: 62px; display: grid; grid-template-columns: 6px minmax(0, 1fr); border-bottom: 1px solid var(--ink); overflow: hidden; }
			.event:last-child { border-bottom: 0; }
			.event--now { outline: 3px solid var(--ink); outline-offset: -3px; }
			.event__rail { border-right: 1px solid var(--ink); }
			.event__body { min-width: 0; align-self: center; padding: 5px 6px; }
			.event__time { font-size: 9px; line-height: 11px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.source { display: block; width: fit-content; max-width: 100%; margin-top: 3px; border: 1px solid var(--ink); padding: 1px 3px; font-size: 7px; line-height: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: .35px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.event__title { margin-top: 3px; font-size: 12px; line-height: 13px; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
			.event__details { margin-top: 2px; font-size: 8px; line-height: 9px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.now-flag { position: absolute; right: 4px; top: 4px; background: var(--ink); color: white; padding: 2px 3px 1px; font-size: 7px; line-height: 8px; font-weight: 900; letter-spacing: .5px; }
			.event--now .event__time { padding-right: 34px; }
			.source-0 { background: var(--ink); color: white; }
			.event__rail.source-0 { background: var(--ink); }
			.source-1 { background-image: repeating-linear-gradient(135deg, var(--ink) 0 1px, white 1px 4px); }
			.source-2 { background-image: radial-gradient(var(--ink) 1px, white 1px); background-size: 4px 4px; }
			.source-3 { background-image: repeating-linear-gradient(0deg, var(--ink) 0 1px, white 1px 4px); }
			.source.source-1, .source.source-2, .source.source-3 { background: white; color: var(--ink); }
			.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
			.empty span { width: 28px; height: 28px; border: 2px solid var(--ink); border-radius: 50%; display: grid; place-items: center; font-size: 17px; font-weight: 900; }
			.empty strong { font-size: 11px; letter-spacing: .8px; }
			.more { height: 18px; flex: 0 0 18px; border-top: 2px solid var(--ink); text-align: center; font-size: 8px; line-height: 16px; font-weight: 900; letter-spacing: .5px; }
		`,
	});
}

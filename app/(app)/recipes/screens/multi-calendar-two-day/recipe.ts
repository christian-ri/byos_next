import type {
	CalendarDay,
	CalendarDayEvent,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import getData, { type MultiCalendarTwoDayData } from "./getData";

export const id = "multi-calendar-two-day";
export const title = "Multi-Kalender · Zwei Tage";
export const renderer = "chromium";

export { getData };

function dateFromIso(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`);
}

function formatDay(day: CalendarDay, tomorrow: boolean) {
	const date = dateFromIso(day.isoDate);
	const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(
		date,
	);
	const calendarDate = new Intl.DateTimeFormat("de-DE", {
		day: "2-digit",
		month: "2-digit",
	}).format(date);
	return {
		label: tomorrow ? "Morgen" : "Heute",
		weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
		calendarDate,
	};
}

function formatClock(timeZone: string) {
	return new Intl.DateTimeFormat("de-DE", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
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
	data: MultiCalendarTwoDayData,
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
			<div class="event__time">${escapeHtml(eventTime(event, data.includeEventTime))}</div>
			<div class="event__content">
				<div class="event__topline">
					${data.showCalendarLabels ? `<div class="source ${sourceClass(label)}">${escapeHtml(label)}</div>` : ""}
					<div class="event__title">${escapeHtml(event.summary)}</div>
				</div>
				${details ? `<div class="event__details">${escapeHtml(details)}</div>` : ""}
			</div>
			${isNow ? '<div class="now-flag">JETZT</div>' : ""}
		</li>`;
}

function renderDay(
	day: CalendarDay | undefined,
	data: MultiCalendarTwoDayData,
	tomorrow: boolean,
) {
	if (!day) return "";
	const date = formatDay(day, tomorrow);
	const now = Date.now();
	const visible = day.events.slice(0, 5);
	const hidden = Math.max(0, day.eventCount - visible.length);

	return `
		<section class="day${tomorrow ? " day--tomorrow" : ""}">
			<header class="day__header">
				<div class="day__identity">
					<div class="day__badge">${date.label.toUpperCase()}</div>
					<div class="day__name">${escapeHtml(date.weekday)}</div>
				</div>
				<div class="day__meta">
					<div class="day__date">${escapeHtml(date.calendarDate)}</div>
					<div class="day__count">${day.eventCount} ${day.eventCount === 1 ? "Termin" : "Termine"}</div>
				</div>
			</header>
			<ul class="events">
				${
					visible.length > 0
						? visible
								.map((event) =>
									renderEvent(
										event,
										data,
										!tomorrow &&
											new Date(event.startDateTime).getTime() <= now &&
											new Date(event.endDateTime).getTime() >= now,
									),
								)
								.join("")
						: '<li class="empty"><div class="empty__mark">✓</div><div><strong>Keine Termine</strong><span>Dieser Tag ist frei.</span></div></li>'
				}
			</ul>
			${hidden > 0 ? `<div class="overflow-note">+ ${hidden} weitere ${hidden === 1 ? "Termin" : "Termine"}</div>` : ""}
		</section>`;
}

export function renderHtml(data: MultiCalendarTwoDayData) {
	const sourceNames = data.sourceLabels || [];
	const width = Math.max(640, Math.round(data.width || 800));
	const height = Math.max(320, Math.round(data.height || 480));

	return buildTrmnlHtmlShell({
		title: data.displayName,
		width,
		height: height,
		bodyHtml: `
			<main class="screen calendar-screen">
				<header class="topbar">
					<div class="brand">
						<div class="calendar-icon"><span></span><span></span><span></span><span></span></div>
						<div class="brand__copy">
							<h1>${escapeHtml(data.displayName)}</h1>
							<div>${sourceNames.length || 1} KALENDER VERBUNDEN</div>
						</div>
					</div>
					${data.note ? `<div class="status-warning">!</div>` : ""}
					<div class="clock"><span>AKTUALISIERT</span><strong>${escapeHtml(formatClock(data.timeZone))}</strong></div>
				</header>
				<div class="days">
					${renderDay(data.defaultDays[0], data, false)}
					${renderDay(data.defaultDays[1], data, true)}
				</div>
			</main>`,
		extraCss: `
			:root { --ink: #0a0a0a; --paper: #fff; }
			.calendar-screen { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 9px; font-variant-numeric: tabular-nums; }
			.topbar { height: 49px; flex: 0 0 49px; border-bottom: 3px solid var(--ink); display: flex; align-items: center; justify-content: space-between; padding: 0 3px 7px; }
			.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
			.calendar-icon { width: 32px; height: 32px; border: 3px solid var(--ink); display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 7px 5px 4px; position: relative; flex: 0 0 auto; }
			.calendar-icon::before { content: ""; position: absolute; left: -3px; right: -3px; top: 6px; height: 3px; background: var(--ink); }
			.calendar-icon span { width: 4px; height: 4px; background: var(--ink); align-self: end; justify-self: center; }
			.brand__copy { min-width: 0; }
			.brand h1 { font-size: 23px; line-height: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px; max-width: 560px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.brand__copy > div { font-size: 10px; line-height: 12px; font-weight: 800; letter-spacing: 1.2px; }
			.clock { display: flex; align-items: baseline; gap: 9px; flex: 0 0 auto; }
			.clock span { font-size: 10px; font-weight: 800; letter-spacing: 1px; }
			.clock strong { font-size: 29px; line-height: 30px; letter-spacing: -1px; }
			.status-warning { width: 22px; height: 22px; border-radius: 50%; background: var(--ink); color: white; font-size: 15px; font-weight: 900; display: grid; place-items: center; margin-left: auto; margin-right: 14px; }
			.days { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
			.day { min-width: 0; border: 2px solid var(--ink); display: flex; flex-direction: column; overflow: hidden; }
			.day--tomorrow { border-left-width: 3px; }
			.day__header { height: 54px; flex: 0 0 54px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--ink); padding: 7px 9px; background: white; }
			.day__identity { display: flex; align-items: center; gap: 9px; min-width: 0; }
			.day__badge { padding: 5px 7px 4px; background: var(--ink); color: white; font-size: 10px; line-height: 11px; font-weight: 900; letter-spacing: 1px; }
			.day--tomorrow .day__badge { background: white; color: var(--ink); border: 2px solid var(--ink); padding: 3px 5px 2px; }
			.day__name { font-size: 21px; line-height: 23px; font-weight: 800; letter-spacing: -0.4px; white-space: nowrap; }
			.day__meta { text-align: right; flex: 0 0 auto; }
			.day__date { font-size: 15px; line-height: 16px; font-weight: 800; }
			.day__count { font-size: 9px; line-height: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; }
			.events { margin: 0; padding: 0; list-style: none; flex: 1; min-height: 0; display: flex; flex-direction: column; }
			.event { position: relative; min-height: 50px; flex: 1 1 0; display: grid; grid-template-columns: 7px 83px minmax(0, 1fr); align-items: stretch; border-bottom: 1px solid var(--ink); overflow: hidden; }
			.event:last-child { border-bottom: 0; }
			.event--now { outline: 3px solid var(--ink); outline-offset: -3px; }
			.event__rail { border-right: 1px solid var(--ink); }
			.event__time { padding: 9px 6px; font-size: 11px; line-height: 13px; font-weight: 900; display: flex; align-items: center; border-right: 1px solid var(--ink); overflow: hidden; }
			.event__content { min-width: 0; align-self: center; padding: 5px 7px; }
			.event__topline { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0; }
			.event__title { width: 100%; min-width: 0; font-size: 15px; line-height: 17px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.event__details { margin-top: 2px; font-size: 10px; line-height: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.source { max-width: 78px; flex: 0 0 auto; border: 1px solid var(--ink); padding: 2px 4px 1px; font-size: 8px; line-height: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
			.source-0 { background: var(--ink); color: white; }
			.event__rail.source-0 { background: var(--ink); }
			.source-1 { background-image: repeating-linear-gradient(135deg, var(--ink) 0 1px, white 1px 4px); }
			.source-2 { background-image: radial-gradient(var(--ink) 1px, white 1px); background-size: 4px 4px; }
			.source-3 { background-image: repeating-linear-gradient(0deg, var(--ink) 0 1px, white 1px 4px); }
			.source.source-1, .source.source-2, .source.source-3 { background: white; color: var(--ink); }
			.now-flag { position: absolute; right: 7px; bottom: 3px; background: var(--ink); color: white; padding: 2px 4px; font-size: 8px; line-height: 9px; font-weight: 900; letter-spacing: .7px; }
			.event--now .event__details { padding-right: 44px; }
			.empty { flex: 1; display: flex; align-items: center; justify-content: center; gap: 14px; }
			.empty__mark { width: 42px; height: 42px; border: 3px solid var(--ink); border-radius: 50%; display: grid; place-items: center; font-size: 23px; font-weight: 900; }
			.empty strong, .empty span { display: block; }
			.empty strong { font-size: 20px; line-height: 23px; }
			.empty span { font-size: 12px; line-height: 15px; font-weight: 600; }
			.overflow-note { flex: 0 0 20px; height: 20px; border-top: 2px solid var(--ink); text-align: center; font-size: 9px; line-height: 18px; font-weight: 900; letter-spacing: .8px; text-transform: uppercase; }
		`,
	});
}

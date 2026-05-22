import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

type TodayVariant = "standard" | "pixel-perfect";

function parseIsoDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`);
}

function titleCase(value: string) {
	return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatHeaderDate(day?: CalendarDay) {
	if (!day) return "";
	return titleCase(
		new Intl.DateTimeFormat("de-DE", {
			weekday: "long",
			day: "numeric",
			month: "long",
		}).format(parseIsoDate(day.isoDate)),
	);
}

function formatDayTitle(day?: CalendarDay) {
	if (!day) return "Heute";
	return titleCase(
		new Intl.DateTimeFormat("de-DE", {
			weekday: "long",
		}).format(parseIsoDate(day.isoDate)),
	);
}

function formatDayDate(day?: CalendarDay) {
	if (!day) return "";
	return titleCase(
		new Intl.DateTimeFormat("de-DE", {
			day: "numeric",
			month: "long",
		}).format(parseIsoDate(day.isoDate)),
	);
}

function formatTodayClock(timeZone: string) {
	return new Intl.DateTimeFormat("de-DE", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
}

function eventCountLabel(count: number) {
	if (count === 0) return "Keine Termine";
	if (count === 1) return "1 Termin";
	return `${count} Termine`;
}

function eventTimeLabel(event: CalendarDayEvent, includeEventTime: boolean) {
	if (event.allDay) return "Ganztägig";
	if (event.multiDay) return "Fortlaufend";
	if (!includeEventTime) return "Termin";
	return event.timeLabel || "Termin";
}

function isEventActive(event: CalendarDayEvent, now: Date) {
	const start = new Date(event.startDateTime);
	const end = new Date(event.endDateTime);
	return start <= now && end >= now;
}

function isEventUpcoming(event: CalendarDayEvent, now: Date) {
	return new Date(event.startDateTime) > now;
}

function buildDisplayTitle(title: string, subtitle: string) {
	const trimmedSubtitle = subtitle.trim();
	if (
		trimmedSubtitle &&
		!/^(personal|connected)\s+calendar$/i.test(trimmedSubtitle)
	) {
		return /kalender|calendar/i.test(trimmedSubtitle)
			? trimmedSubtitle
			: `${trimmedSubtitle} Kalender`;
	}

	return title.trim() || "Kalender";
}

function renderCalendarGlyph() {
	return `
		<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
			<rect x="3" y="4.5" width="18" height="16" rx="1.5" fill="none" stroke="#111" stroke-width="1.8"></rect>
			<path d="M7 2.8v4.4M17 2.8v4.4M3 9.4h18" stroke="#111" stroke-width="1.8"></path>
			<circle cx="8" cy="13" r="1.1" fill="#111"></circle>
			<circle cx="12" cy="13" r="1.1" fill="#111"></circle>
			<circle cx="16" cy="13" r="1.1" fill="#111"></circle>
			<circle cx="8" cy="17" r="1.1" fill="#111"></circle>
			<circle cx="12" cy="17" r="1.1" fill="#111"></circle>
		</svg>
	`;
}

function renderBadge(label: string, inverted = true) {
	return `<span class="cal-badge${inverted ? " cal-badge--inverted" : ""}">${escapeHtml(label.toUpperCase())}</span>`;
}

function renderEventList(
	events: CalendarDayEvent[],
	includeDescription: boolean,
	includeEventTime: boolean,
	maxEvents: number,
) {
	if (events.length === 0) {
		return `<div class="cal-empty">Keine Termine</div>`;
	}

	return events
		.slice(0, maxEvents)
		.map((event) => {
			const description =
				includeDescription && event.description
					? `<div class="cal-event-description">${escapeHtml(event.description)}</div>`
					: "";
			return `
				<div class="cal-event">
					<div class="cal-event-time">${escapeHtml(eventTimeLabel(event, includeEventTime))}</div>
					<div class="cal-event-content">
						<div class="cal-event-summary">${escapeHtml(event.summary)}</div>
						${description}
					</div>
				</div>
			`;
		})
		.join("");
}

function renderDefaultDays(
	data: CalendarRecipeData,
	visibleDays: CalendarDay[],
	titlePrefix: string,
) {
	return `
		<div class="cal-strip">
			<div class="cal-strip__left">
				${renderCalendarGlyph()}
				<div class="cal-strip__titles">
					<div class="meta">${escapeHtml(titlePrefix)}</div>
					<div class="value">${escapeHtml(formatTodayClock(data.timeZone))}</div>
				</div>
			</div>
			<div class="cal-strip__right">${escapeHtml(visibleDays[0] ? formatHeaderDate(visibleDays[0]) : data.updatedAt)}</div>
		</div>
		<div class="cal-day-grid cal-day-grid--${visibleDays.length}">
			${visibleDays
				.map((day) => {
					return `
						<section class="cal-day-card">
							<div class="cal-day-card__header">
								<div class="cal-day-card__date">
									<div class="title title--small">${escapeHtml(formatDayTitle(day))}</div>
									<div class="description">${escapeHtml(formatDayDate(day))}</div>
								</div>
								<div class="cal-day-card__meta">
									${day.isToday ? renderBadge("Heute") : ""}
									<div class="meta">${escapeHtml(eventCountLabel(day.eventCount))}</div>
								</div>
							</div>
							<div class="cal-day-card__body">
								${renderEventList(
									day.events,
									data.includeDescription,
									data.includeEventTime,
									3,
								)}
							</div>
						</section>
					`;
				})
				.join("")}
		</div>
	`;
}

function renderWeekTimeline(data: CalendarRecipeData) {
	return `
		<div class="cal-header">
			<div class="cal-header__main">
				${renderCalendarGlyph()}
				<div class="cal-header__titles">
					<div class="meta">${escapeHtml(data.providerLabel)} Kalender</div>
					<div class="title">${escapeHtml(buildDisplayTitle(data.title, data.subtitle))}</div>
				</div>
			</div>
			<div class="cal-header__aside">
				<div class="meta">${escapeHtml(data.timeZone)}</div>
				<div class="meta">${escapeHtml(data.updatedAt)}</div>
			</div>
		</div>
		<div class="cal-week">
			${data.weekDays
				.slice(0, 7)
				.map((day) => {
					return `
						<section class="cal-week__day${day.isToday ? " cal-week__day--today" : ""}">
							<div class="cal-week__day-header">
								<div class="title title--small">${escapeHtml(day.shortLabel)}</div>
								<div class="value">${escapeHtml(day.dayNumber)}</div>
							</div>
							<div class="cal-week__day-events">
								${
									day.events.length > 0
										? day.events
												.slice(0, 4)
												.map((event) => {
													return `
													<div class="cal-week__event">
														<div class="cal-week__event-time">${escapeHtml(eventTimeLabel(event, data.includeEventTime))}</div>
														<div class="cal-week__event-summary">${escapeHtml(event.summary)}</div>
													</div>
												`;
												})
												.join("")
										: `<div class="cal-empty cal-empty--small">frei</div>`
								}
							</div>
						</section>
					`;
				})
				.join("")}
		</div>
	`;
}

function renderMonthOverview(data: CalendarRecipeData) {
	const headerRow =
		data.monthWeeks
			.find((week) => week.length > 0)
			?.map((day) => day.shortLabel) ?? [];

	return `
		<div class="cal-header">
			<div class="cal-header__main">
				${renderCalendarGlyph()}
				<div class="cal-header__titles">
					<div class="meta">${escapeHtml(data.providerLabel)} Kalender</div>
					<div class="title">${escapeHtml(data.monthLabel || buildDisplayTitle(data.title, data.subtitle))}</div>
				</div>
			</div>
			<div class="cal-header__aside">
				<div class="meta">${escapeHtml(buildDisplayTitle(data.title, data.subtitle))}</div>
				<div class="meta">${escapeHtml(data.updatedAt)}</div>
			</div>
		</div>
		<div class="cal-month">
			<div class="cal-month__weekday-row">
				${headerRow
					.map(
						(label) =>
							`<div class="cal-month__weekday">${escapeHtml(label)}</div>`,
					)
					.join("")}
			</div>
			${data.monthWeeks
				.map((week) => {
					return `
						<div class="cal-month__week">
							${week
								.map((day) => {
									return `
										<section class="cal-month__day${day.isToday ? " cal-month__day--today" : ""}${day.isCurrentMonth ? "" : " cal-month__day--muted"}">
											<div class="cal-month__day-head">
												<div class="cal-month__day-number">${escapeHtml(day.dayNumber)}</div>
												<div class="meta">${escapeHtml(day.shortLabel)}</div>
											</div>
											<div class="cal-month__day-body">
												<div class="cal-month__count">${escapeHtml(String(day.eventCount))}</div>
												<div class="cal-month__dots">
													${Array.from({ length: Math.min(day.eventCount, 4) })
														.map(() => `<span class="cal-dot"></span>`)
														.join("")}
												</div>
											</div>
										</section>
									`;
								})
								.join("")}
						</div>
					`;
				})
				.join("")}
		</div>
	`;
}

function renderCalendarPluginBody(data: CalendarRecipeData) {
	const body =
		data.eventLayout === "two-day"
			? renderDefaultDays(
					data,
					data.defaultDays.slice(0, 2),
					`${data.providerLabel.toUpperCase()} KALENDER`,
				)
			: data.eventLayout === "week-timeline"
				? renderWeekTimeline(data)
				: data.eventLayout === "month-overview"
					? renderMonthOverview(data)
					: renderDefaultDays(
							data,
							data.defaultDays.slice(0, 3),
							`${data.providerLabel.toUpperCase()} KALENDER`,
						);

	return `
		<section class="screen cal-screen">
			<div class="cal-frame">
				${body}
			</div>
		</section>
	`;
}

function renderTodayBody(data: CalendarRecipeData, variant: TodayVariant) {
	const today = data.defaultDays[0];
	const allEvents = today?.events ?? [];
	const now = new Date();
	const currentEvent = allEvents.find((event) => isEventActive(event, now));
	const nextEvent = allEvents.find((event) => isEventUpcoming(event, now));
	const featuredEvent = currentEvent || nextEvent;
	const displayTitle =
		variant === "pixel-perfect"
			? buildDisplayTitle(data.title, data.subtitle)
			: buildDisplayTitle(data.title, data.subtitle) || "Mein Kalender";

	return `
		<section class="screen cal-screen">
			<div class="cal-frame cal-frame--today">
				<div class="cal-today-hero${variant === "pixel-perfect" ? " cal-today-hero--pp" : ""}">
					<div class="cal-today-hero__left">
						<div class="meta">${escapeHtml(displayTitle)}</div>
						<div class="title">${escapeHtml(formatDayTitle(today))}</div>
						<div class="description">${escapeHtml(formatDayDate(today))}</div>
						<div class="footer">${escapeHtml(formatTodayClock(data.timeZone))}</div>
					</div>
					<div class="cal-today-hero__middle">
						<div class="meta">${escapeHtml(currentEvent ? "Aktuell" : nextEvent ? "Als Nächstes" : "Heute")}</div>
						<div class="value">${escapeHtml(featuredEvent?.summary || "Keine anstehenden Termine")}</div>
						<div class="description">${escapeHtml(featuredEvent ? eventTimeLabel(featuredEvent, data.includeEventTime) : eventCountLabel(today?.eventCount || 0))}</div>
					</div>
					<div class="cal-today-hero__right">
						${renderCalendarGlyph()}
						<div class="value">${escapeHtml(String(today?.eventCount || 0))}</div>
						<div class="meta">${escapeHtml(eventCountLabel(today?.eventCount || 0))}</div>
					</div>
				</div>
				<div class="cal-today-list">
					${
						allEvents.length > 0
							? allEvents
									.slice(0, 5)
									.map((event, index) => {
										return `
										<div class="cal-today-row${isEventActive(event, now) ? " cal-today-row--active" : ""}${index === allEvents.length - 1 ? " cal-today-row--last" : ""}">
											<div class="cal-today-row__time">${escapeHtml(eventTimeLabel(event, data.includeEventTime))}</div>
											<div class="cal-today-row__dot"></div>
											<div class="cal-today-row__content">
												${isEventActive(event, now) ? renderBadge("Aktuell") : ""}
												<div class="cal-today-row__summary">${escapeHtml(event.summary)}</div>
											</div>
										</div>
									`;
									})
									.join("")
							: `<div class="cal-empty">Keine Termine für heute</div>`
					}
				</div>
			</div>
		</section>
	`;
}

const CALENDAR_CSS = `
	.cal-screen {
		padding: 16px;
	}

	.cal-frame {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		border: 2px solid #111;
		padding: 16px;
		gap: 14px;
	}

	.cal-frame--today {
		gap: 18px;
	}

	.cal-header,
	.cal-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-bottom: 10px;
		border-bottom: 2px solid #111;
	}

	.cal-header__main,
	.cal-strip__left {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.cal-header__titles,
	.cal-strip__titles {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.cal-header__aside,
	.cal-strip__right {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: right;
		font-size: 14px;
		line-height: 1.25;
		font-weight: 600;
	}

	.cal-day-grid {
		display: grid;
		flex: 1;
		gap: 12px;
	}

	.cal-day-grid--2 {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.cal-day-grid--3 {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.cal-day-card,
	.cal-week__day,
	.cal-month__day {
		border: 2px solid #111;
		background: #fff;
	}

	.cal-day-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.cal-day-card__header {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding: 12px;
		border-bottom: 2px solid #111;
		background: #f8f8f8;
	}

	.cal-day-card__meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.cal-day-card__body {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 10px 12px;
	}

	.cal-event {
		display: grid;
		grid-template-columns: 110px minmax(0, 1fr);
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px solid #d5d5d5;
	}

	.cal-event:last-child {
		border-bottom: none;
	}

	.cal-event-time,
	.cal-week__event-time,
	.cal-today-row__time {
		font-size: 14px;
		line-height: 1.25;
		font-weight: 700;
	}

	.cal-event-summary,
	.cal-week__event-summary,
	.cal-today-row__summary {
		font-size: 16px;
		line-height: 1.25;
		font-weight: 700;
	}

	.cal-event-description {
		font-size: 13px;
		line-height: 1.3;
		font-weight: 500;
		color: #333;
		margin-top: 4px;
	}

	.cal-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		font-size: 18px;
		line-height: 1.3;
		font-weight: 700;
		color: #777;
	}

	.cal-empty--small {
		font-size: 13px;
	}

	.cal-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 3px 8px;
		border: 2px solid #111;
		font-size: 12px;
		line-height: 1;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.cal-badge--inverted {
		background: #111;
		color: #fff;
	}

	.cal-week {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 8px;
		flex: 1;
	}

	.cal-week__day {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.cal-week__day--today {
		background: #f5f5f5;
	}

	.cal-week__day-header {
		padding: 8px;
		border-bottom: 2px solid #111;
	}

	.cal-week__day-events {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
		min-height: 0;
	}

	.cal-week__event {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid #d5d5d5;
	}

	.cal-month {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.cal-month__weekday-row,
	.cal-month__week {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 6px;
	}

	.cal-month__weekday {
		text-align: center;
		font-size: 12px;
		line-height: 1;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.cal-month__day {
		display: flex;
		flex-direction: column;
		min-height: 53px;
		padding: 6px;
	}

	.cal-month__day--today {
		background: #f2f2f2;
	}

	.cal-month__day--muted {
		color: #888;
	}

	.cal-month__day-head,
	.cal-month__day-body {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cal-month__day-number,
	.cal-month__count {
		font-size: 16px;
		line-height: 1;
		font-weight: 700;
	}

	.cal-month__dots {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.cal-dot {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: #111;
	}

	.cal-today-hero {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr) 128px;
		gap: 16px;
		padding-bottom: 16px;
		border-bottom: 2px solid #111;
	}

	.cal-today-hero--pp {
		background: linear-gradient(180deg, #fff 0%, #f7f7f7 100%);
		padding: 12px;
		border: 2px solid #111;
	}

	.cal-today-hero__left,
	.cal-today-hero__middle,
	.cal-today-hero__right {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.cal-today-hero__right {
		align-items: center;
		justify-content: center;
		text-align: center;
		border-left: 2px solid #111;
		padding-left: 16px;
	}

	.cal-today-list {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.cal-today-row {
		display: grid;
		grid-template-columns: 160px 36px minmax(0, 1fr);
		gap: 10px;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid #d5d5d5;
	}

	.cal-today-row--active {
		background: #f6f6f6;
	}

	.cal-today-row__dot {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 2px solid #111;
		background: #fff;
		justify-self: center;
	}

	.cal-today-row--active .cal-today-row__dot {
		background: #111;
	}

	.cal-today-row__content {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
`;

export function renderCalendarRecipeHtml(data: CalendarRecipeData) {
	return buildTrmnlHtmlShell({
		title: data.title,
		bodyHtml: renderCalendarPluginBody(data),
		extraCss: CALENDAR_CSS,
	});
}

export function renderCalendarTodayRecipeHtml(
	data: CalendarRecipeData,
	variant: TodayVariant = "standard",
) {
	return buildTrmnlHtmlShell({
		title: data.title,
		bodyHtml: renderTodayBody(data, variant),
		extraCss: CALENDAR_CSS,
	});
}

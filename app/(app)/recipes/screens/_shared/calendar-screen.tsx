import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import {
	META_TEXT,
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";

type Props = CalendarRecipeData & {
	width?: number;
	height?: number;
};

const MONTH_OVERVIEW_WEEKDAYS = {
	0: ["SO", "MO", "DI", "MI", "DO", "FR", "SA"],
	1: ["MO", "DI", "MI", "DO", "FR", "SA", "SO"],
} as const;
const GERMAN_WEEKDAY_LABELS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const MONTH_OVERVIEW_DAY_WIDTH = 88;
const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 22;
const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
const TIMELINE_LABEL_WIDTH = 64;
const TIMELINE_DAY_WIDTH = 92;
const TIMELINE_BODY_HEIGHT = 284;
const TIMELINE_BLOCK_GAP = 4;

function CalendarGlyph({
	size = 28,
	accent = false,
}: {
	size?: number;
	accent?: boolean;
}) {
	const dotFill = accent ? "#111" : "#8f8f8f";

	return (
		<svg
			viewBox="0 0 22 22"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M4 3h14c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1Z"
				fill="none"
				stroke="#111"
				strokeWidth="1.8"
			/>
			<circle cx="7.1" cy="7.2" r="1.15" fill={dotFill} />
			<circle cx="11" cy="7.2" r="1.15" fill={dotFill} />
			<circle cx="14.9" cy="7.2" r="1.15" fill={dotFill} />
			<circle cx="7.1" cy="14.7" r="1.15" fill={dotFill} />
		</svg>
	);
}

function Header({
	providerLabel,
	title,
	subtitle,
	timeZone,
	updatedAt,
}: {
	providerLabel: string;
	title: string;
	subtitle: string;
	timeZone: string;
	updatedAt: string;
}) {
	const mainTitle = subtitle?.trim() || title;
	const provider = title?.trim() || `${providerLabel} Calendar`;

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: 16,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					width: 470,
				}}
			>
				<CalendarGlyph size={24} accent={true} />
				<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<MetaText>{provider}</MetaText>
					<SafeTitle size={32} lines={2}>
						{mainTitle}
					</SafeTitle>
				</div>
			</div>
			<div
				style={{
					width: 240,
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					textAlign: "right",
					gap: 6,
				}}
			>
				<MetaText align="right">{timeZone}</MetaText>
				<MetaText align="right">Updated {updatedAt}</MetaText>
			</div>
		</div>
	);
}

function agendaRightDateLabel(day: CalendarDay) {
	const date = parseIsoDate(day.isoDate);
	const weekday = GERMAN_WEEKDAY_LABELS[date.getDay()];
	const month = new Intl.DateTimeFormat("de-DE", {
		month: "long",
	}).format(date);

	return `${weekday} ${date.getDate()}. ${month}`;
}

function agendaEventTimeLabel(
	event: CalendarDayEvent,
	includeEventTime: boolean,
) {
	if (event.allDay) return "Ganztägig";
	if (event.multiDay) return "Fortlaufend";
	if (!includeEventTime) return null;
	return event.timeLabel || null;
}

function eventCountLabel(count: number) {
	return count === 1 ? "1 Termin" : `${count} Termine`;
}

function DefaultView({
	providerLabel,
	timeZone,
	defaultDays,
	includeDescription,
	includeEventTime,
}: {
	providerLabel: string;
	timeZone: string;
	defaultDays: CalendarDay[];
	includeDescription: boolean;
	includeEventTime: boolean;
}) {
	const visibleDays = defaultDays.slice(0, 3);
	const clockLabel = zonedClockLabel(timeZone);
	const rightLabel = visibleDays[0] ? agendaRightDateLabel(visibleDays[0]) : "";

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 10,
				flex: 1,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 10,
					paddingBottom: 8,
					borderBottom: "2px solid #111",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						width: 260,
					}}
				>
					<CalendarGlyph size={26} accent={true} />
					<SafeTitle size={28} lines={1}>
						{`${providerLabel.toUpperCase()} KALENDER`}
					</SafeTitle>
				</div>
				<ReadableText size={40} weight={700} style={{ lineHeight: 1 }}>
					{clockLabel}
				</ReadableText>
				<div
					style={{
						width: 220,
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					<ReadableText size={22} weight={700}>
						{rightLabel}
					</ReadableText>
				</div>
			</div>
			{visibleDays.map((day) => {
				const dayDate = parseIsoDate(day.isoDate);
				const monthLabel = new Intl.DateTimeFormat("de-DE", {
					month: "short",
				}).format(dayDate);

				return (
					<div
						key={day.isoDate}
						style={{
							display: "flex",
							minHeight: 108,
							border: "2px solid #111",
							backgroundColor: "#fff",
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								width: 150,
								padding: "12px 14px",
								borderRight: "2px solid #111",
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								gap: 10,
								boxSizing: "border-box",
								backgroundColor: day.isToday ? "#f5f5f5" : "#fff",
							}}
						>
							<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
								<ReadableText
									size={36}
									weight={700}
									style={{ lineHeight: 0.95 }}
								>
									{GERMAN_WEEKDAY_LABELS[dayDate.getDay()]}
								</ReadableText>
								<ReadableText size={18} weight={700}>
									{`${dayDate.getDate()}. ${monthLabel}`}
								</ReadableText>
								{day.isToday ? (
									<div
										style={{
											alignSelf: "flex-start",
											border: "2px solid #111",
											backgroundColor: "#111",
											padding: "2px 8px",
											boxSizing: "border-box",
										}}
									>
										<ReadableText size={13} weight={700} color="#fff">
											HEUTE
										</ReadableText>
									</div>
								) : null}
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
								<ReadableText size={17} weight={700}>
									{eventCountLabel(day.eventCount)}
								</ReadableText>
								<DayCountMarker
									eventCount={day.eventCount}
									dotSize={7}
									gap={6}
									textSize={14}
								/>
							</div>
						</div>
						<div
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								padding: "0 12px",
								boxSizing: "border-box",
							}}
						>
							{day.events.length === 0 ? (
								<div
									style={{
										flex: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<ReadableText size={22} weight={700} color="#777">
										Keine Termine
									</ReadableText>
								</div>
							) : (
								day.events.slice(0, 3).map((event, index) => {
									const timeLabel = agendaEventTimeLabel(
										event,
										includeEventTime,
									);

									return (
										<div
											key={event.id}
											style={{
												minHeight: 34,
												display: "flex",
												alignItems: "stretch",
												padding: "10px 0",
												borderBottom:
													index < Math.min(day.events.length, 3) - 1
														? "2px solid #d0d0d0"
														: "none",
												boxSizing: "border-box",
												gap: 12,
											}}
										>
											<div
												style={{
													width: 92,
													display: "flex",
													alignItems: "flex-start",
													paddingTop: 2,
												}}
											>
												<ReadableText size={17} weight={700}>
													{timeLabel || "Termin"}
												</ReadableText>
											</div>
											<div
												style={{
													width: 2,
													backgroundColor: "#111",
													flexShrink: 0,
												}}
											/>
											<div
												style={{
													width: 14,
													display: "flex",
													alignItems: "flex-start",
													justifyContent: "center",
													paddingTop: 5,
													flexShrink: 0,
												}}
											>
												<div
													style={{
														width: 10,
														height: 10,
														borderRadius: 999,
														backgroundColor: "#111",
													}}
												/>
											</div>
											<div
												style={{
													flex: 1,
													display: "flex",
													flexDirection: "column",
													gap: 4,
													minWidth: 0,
												}}
											>
												<ReadableText
													size={18}
													weight={700}
													style={{
														lineHeight: 1.05,
														whiteSpace: "nowrap",
														overflow: "hidden",
														textOverflow: "ellipsis",
													}}
												>
													{event.summary}
												</ReadableText>
												{includeDescription && event.description ? (
													<ReadableText
														size={16}
														style={{
															lineHeight: 1.05,
															whiteSpace: "nowrap",
															overflow: "hidden",
															textOverflow: "ellipsis",
														}}
													>
														{event.description}
													</ReadableText>
												) : null}
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function monthOverviewClock(timeZone: string) {
	return new Intl.DateTimeFormat("de-DE", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
}

function monthOverviewLabel(monthLabel: string) {
	if (!monthLabel.trim()) {
		return "";
	}

	try {
		const parsed = new Date(`${monthLabel} 1`);
		if (!Number.isNaN(parsed.getTime())) {
			return new Intl.DateTimeFormat("de-DE", {
				month: "long",
				year: "numeric",
			})
				.format(parsed)
				.toUpperCase();
		}
	} catch {}

	return monthLabel.toUpperCase();
}

function DayCountMarker({
	eventCount,
	dotSize = 8,
	gap = 8,
	textSize = 18,
}: {
	eventCount: number;
	dotSize?: number;
	gap?: number;
	textSize?: number;
}) {
	if (eventCount <= 0) return null;

	if (eventCount >= 5) {
		return (
			<ReadableText size={textSize} weight={700} style={{ lineHeight: 1 }}>
				5+
			</ReadableText>
		);
	}

	const dotCount = eventCount <= 2 ? eventCount : 3;

	return (
		<div style={{ display: "flex", gap, alignItems: "center" }}>
			{Array.from({ length: dotCount }, (_, index) => (
				<div
					key={`dot-${index}`}
					style={{
						width: dotSize,
						height: dotSize,
						borderRadius: 999,
						backgroundColor: "#111",
						flexShrink: 0,
					}}
				/>
			))}
		</div>
	);
}

function parseIsoDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`);
}

function zonedClockLabel(timeZone: string) {
	return new Intl.DateTimeFormat("de-DE", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
}

function zonedCurrentMinute(timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(new Date());

	const values = parts.reduce<Record<string, string>>((acc, part) => {
		if (part.type !== "literal") {
			acc[part.type] = part.value;
		}
		return acc;
	}, {});

	return Number(values.hour || "0") * 60 + Number(values.minute || "0");
}

function weekRangeLabel(weekDays: CalendarDay[]) {
	const firstDay = weekDays[0];
	const lastDay = weekDays.at(-1);

	if (!firstDay || !lastDay) {
		return "";
	}

	const firstDate = parseIsoDate(firstDay.isoDate);
	const lastDate = parseIsoDate(lastDay.isoDate);

	if (firstDate.getFullYear() === lastDate.getFullYear()) {
		if (firstDate.getMonth() === lastDate.getMonth()) {
			return `${new Intl.DateTimeFormat("de-DE", {
				day: "numeric",
			}).format(firstDate)}. – ${new Intl.DateTimeFormat("de-DE", {
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(lastDate)}`;
		}

		return `${new Intl.DateTimeFormat("de-DE", {
			day: "numeric",
			month: "short",
		}).format(firstDate)} – ${new Intl.DateTimeFormat("de-DE", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(lastDate)}`;
	}

	return `${new Intl.DateTimeFormat("de-DE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(firstDate)} – ${new Intl.DateTimeFormat("de-DE", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(lastDate)}`;
}

function dayFullLabel(day: CalendarDay) {
	const date = parseIsoDate(day.isoDate);
	const weekday = GERMAN_WEEKDAY_LABELS[date.getDay()];
	const month = new Intl.DateTimeFormat("de-DE", {
		month: "long",
	}).format(date);

	return `${weekday} ${date.getDate()}. ${month} ${date.getFullYear()}`;
}

function twoDayEventTimeLabel(event: CalendarDayEvent) {
	if (event.allDay) return "Ganztägig";
	if (event.multiDay) return "Fortlaufend";
	return event.timeLabel || "Zeit folgt";
}

function isoWeekNumber(isoDate: string) {
	const date = parseIsoDate(isoDate);
	const day = date.getDay() || 7;
	date.setDate(date.getDate() + 4 - day);
	const yearStart = new Date(date.getFullYear(), 0, 1);

	return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function timelineMinuteToOffset(minute: number, bodyHeight: number) {
	return (
		((minute - TIMELINE_START_HOUR * 60) / TIMELINE_TOTAL_MINUTES) * bodyHeight
	);
}

function visibleTimedEvents(day: CalendarDay) {
	return day.events.filter((event) => {
		if (event.allDay || event.multiDay) {
			return false;
		}

		if (event.startMinute === null || event.endMinute === null) {
			return false;
		}

		return (
			event.endMinute > TIMELINE_START_HOUR * 60 &&
			event.startMinute < TIMELINE_END_HOUR * 60
		);
	});
}

function eventLanes(events: CalendarDayEvent[]) {
	const placements = events
		.map((event) => ({
			event,
			start: Math.max(event.startMinute || 0, TIMELINE_START_HOUR * 60),
			end: Math.min(
				event.endMinute || TIMELINE_END_HOUR * 60,
				TIMELINE_END_HOUR * 60,
			),
		}))
		.sort((a, b) => (a.start === b.start ? a.end - b.end : a.start - b.start));

	const laneEnds: number[] = [];
	const assigned: Array<{
		event: CalendarDayEvent;
		start: number;
		end: number;
		lane: number;
	}> = [];

	for (const placement of placements) {
		let lane = laneEnds.findIndex((end) => end <= placement.start);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(placement.end);
		} else {
			laneEnds[lane] = placement.end;
		}

		assigned.push({
			...placement,
			lane,
		});
	}

	return assigned.map((placement) => ({
		...placement,
		laneCount: Math.max(1, laneEnds.length),
	}));
}

function TimelineEventBlocks({
	day,
	bodyHeight,
}: {
	day: CalendarDay;
	bodyHeight: number;
}) {
	const placements = eventLanes(visibleTimedEvents(day));
	const usableWidth = TIMELINE_DAY_WIDTH - TIMELINE_BLOCK_GAP * 2;

	return (
		<>
			{placements.map(({ event, start, end, lane, laneCount }) => {
				const top = timelineMinuteToOffset(start, bodyHeight);
				const bottom = timelineMinuteToOffset(end, bodyHeight);
				const height = Math.max(14, bottom - top);
				const laneWidth = usableWidth / laneCount;

				return (
					<div
						key={event.id}
						style={{
							position: "absolute",
							top,
							left: TIMELINE_BLOCK_GAP + lane * laneWidth,
							width: Math.max(12, laneWidth - TIMELINE_BLOCK_GAP),
							height,
							backgroundColor: "#d9d9d9",
							border: "2px solid #111",
							boxSizing: "border-box",
						}}
					/>
				);
			})}
		</>
	);
}

function TimelineHourGuides() {
	return (
		<>
			{Array.from(
				{ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
				(_, index) => TIMELINE_START_HOUR + index,
			).map((hour) => {
				if (hour === TIMELINE_START_HOUR) {
					return null;
				}

				const top = timelineMinuteToOffset(hour * 60, TIMELINE_BODY_HEIGHT);

				return (
					<div
						key={`hour-line-${hour}`}
						style={{
							position: "absolute",
							top,
							left: 0,
							right: 0,
							borderTop: "1px solid #cfcfcf",
						}}
					/>
				);
			})}
		</>
	);
}

function WeekTimeline({
	providerLabel,
	timeZone,
	weekDays,
}: {
	providerLabel: string;
	timeZone: string;
	weekDays: CalendarDay[];
}) {
	const clockLabel = zonedClockLabel(timeZone);
	const weekNumber = weekDays[0] ? isoWeekNumber(weekDays[0].isoDate) : null;
	const rangeLabel = weekRangeLabel(weekDays);
	const currentMinute = zonedCurrentMinute(timeZone);
	const showCurrentMarker =
		currentMinute >= TIMELINE_START_HOUR * 60 &&
		currentMinute <= TIMELINE_END_HOUR * 60;
	const markerTop = showCurrentMarker
		? timelineMinuteToOffset(currentMinute, TIMELINE_BODY_HEIGHT)
		: 0;
	const timeLabels = Array.from(
		{ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
		(_, index) => TIMELINE_START_HOUR + index,
	);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				border: "2px solid #111",
				padding: 12,
				backgroundColor: "#fff",
				boxSizing: "border-box",
				gap: 12,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
					paddingBottom: 10,
					borderBottom: "2px solid #111",
				}}
			>
				<div
					style={{ display: "flex", alignItems: "center", gap: 12, width: 250 }}
				>
					<CalendarGlyph size={28} accent={true} />
					<SafeTitle size={28} lines={1}>
						{`${providerLabel.toUpperCase()} KALENDER`}
					</SafeTitle>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 4,
					}}
				>
					<ReadableText size={42} weight={700} style={{ lineHeight: 1 }}>
						{clockLabel}
					</ReadableText>
					<ReadableText size={16} weight={700}>
						{`Aktualisiert: ${clockLabel}`}
					</ReadableText>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 4,
						width: 250,
					}}
				>
					<SafeTitle size={26} lines={1}>
						{weekNumber ? `KW ${weekNumber}` : ""}
					</SafeTitle>
					<ReadableText size={16} weight={700}>
						{rangeLabel}
					</ReadableText>
				</div>
			</div>
			<div style={{ display: "flex", marginLeft: TIMELINE_LABEL_WIDTH }}>
				{weekDays.slice(0, 7).map((day, index) => {
					const dateLabel = `${day.isoDate.slice(8, 10)}.${day.isoDate.slice(
						5,
						7,
					)}.`;

					return (
						<div
							key={`header-${day.isoDate}`}
							style={{
								width: TIMELINE_DAY_WIDTH,
								height: 58,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 4,
								borderLeft: index === 0 ? "2px solid #111" : "none",
								borderTop: "2px solid #111",
								borderRight: "2px solid #111",
								backgroundColor: day.isToday ? "#111" : "#fff",
								boxSizing: "border-box",
							}}
						>
							<ReadableText
								size={18}
								weight={700}
								color={day.isToday ? "#fff" : "#111"}
							>
								{GERMAN_WEEKDAY_LABELS[parseIsoDate(day.isoDate).getDay()]}
							</ReadableText>
							<ReadableText
								size={14}
								weight={700}
								color={day.isToday ? "#fff" : "#111"}
							>
								{dateLabel}
							</ReadableText>
							<DayCountMarker
								eventCount={day.eventCount}
								dotSize={6}
								gap={5}
								textSize={14}
							/>
						</div>
					);
				})}
			</div>
			<div style={{ display: "flex", flex: 1 }}>
				<div
					style={{
						position: "relative",
						width: TIMELINE_LABEL_WIDTH,
						height: TIMELINE_BODY_HEIGHT,
						borderLeft: "2px solid #111",
						borderTop: "2px solid #111",
						borderBottom: "2px solid #111",
						backgroundColor: "#fff",
						boxSizing: "border-box",
					}}
				>
					{timeLabels.map((hour) => {
						const top =
							hour === TIMELINE_END_HOUR
								? TIMELINE_BODY_HEIGHT - 22
								: timelineMinuteToOffset(hour * 60, TIMELINE_BODY_HEIGHT) + 6;

						return (
							<ReadableText
								key={`label-${hour}`}
								size={13}
								weight={600}
								style={{
									position: "absolute",
									top,
									left: 6,
									lineHeight: 1,
								}}
							>
								{`${hour.toString().padStart(2, "0")}:00`}
							</ReadableText>
						);
					})}
					{showCurrentMarker ? (
						<ReadableText
							size={13}
							weight={700}
							style={{
								position: "absolute",
								top: Math.max(0, markerTop - 8),
								left: 6,
								lineHeight: 1,
								backgroundColor: "#fff",
							}}
						>
							{clockLabel}
						</ReadableText>
					) : null}
				</div>
				<div
					style={{
						position: "relative",
						display: "flex",
						height: TIMELINE_BODY_HEIGHT,
						borderTop: "2px solid #111",
						borderRight: "2px solid #111",
						borderBottom: "2px solid #111",
						backgroundColor: "#fff",
						boxSizing: "border-box",
					}}
				>
					<TimelineHourGuides />
					{showCurrentMarker ? (
						<div
							style={{
								position: "absolute",
								top: markerTop,
								left: 0,
								right: 0,
								borderTop: "3px solid #111",
								zIndex: 3,
							}}
						/>
					) : null}
					{weekDays.slice(0, 7).map((day, index) => (
						<div
							key={`column-${day.isoDate}`}
							style={{
								position: "relative",
								width: TIMELINE_DAY_WIDTH,
								height: TIMELINE_BODY_HEIGHT,
								borderLeft:
									index === 0
										? day.isToday
											? "3px solid #111"
											: "2px solid #111"
										: day.isToday
											? "3px solid #111"
											: "1px solid #111",
								backgroundColor: day.isToday ? "#f2f2f2" : "#fff",
								boxSizing: "border-box",
							}}
						>
							<TimelineEventBlocks
								day={day}
								bodyHeight={TIMELINE_BODY_HEIGHT}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function TwoDayTimeline({
	providerLabel,
	timeZone,
	defaultDays,
	weekDays,
}: {
	providerLabel: string;
	timeZone: string;
	defaultDays: CalendarDay[];
	weekDays: CalendarDay[];
}) {
	const twoDays = defaultDays.slice(0, 2);
	const clockLabel = zonedClockLabel(timeZone);
	const weekSource = weekDays.length > 0 ? weekDays : twoDays;
	const weekNumber = weekSource[0]
		? isoWeekNumber(weekSource[0].isoDate)
		: null;
	const rangeLabel = weekRangeLabel(weekSource);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				padding: "6px 0 0",
				backgroundColor: "#fff",
				boxSizing: "border-box",
				gap: 10,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 10,
					paddingBottom: 8,
					borderBottom: "2px solid #111",
				}}
			>
				<div
					style={{ display: "flex", alignItems: "center", gap: 10, width: 260 }}
				>
					<CalendarGlyph size={26} accent={true} />
					<SafeTitle size={28} lines={1}>
						{`${providerLabel.toUpperCase()} KALENDER`}
					</SafeTitle>
				</div>
				<ReadableText size={40} weight={700} style={{ lineHeight: 1 }}>
					{clockLabel}
				</ReadableText>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						gap: 2,
						width: 260,
					}}
				>
					<SafeTitle size={24} lines={1}>
						{weekNumber ? `KW ${weekNumber}` : ""}
					</SafeTitle>
					<ReadableText size={15} weight={700}>
						{rangeLabel}
					</ReadableText>
				</div>
			</div>
			<div style={{ display: "flex", gap: 10, flex: 1 }}>
				{twoDays.map((day) => (
					<div
						key={day.key}
						style={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							border: "2px solid #111",
							boxSizing: "border-box",
							backgroundColor: "#fff",
							minWidth: 0,
						}}
					>
						<div
							style={{
								minHeight: 56,
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "space-between",
								padding: "10px 12px 8px",
								borderBottom: "2px solid #111",
								boxSizing: "border-box",
								backgroundColor: day.isToday ? "#f3f3f3" : "#fff",
								gap: 10,
							}}
						>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 4,
									minWidth: 0,
								}}
							>
								<ReadableText size={20} weight={700}>
									{dayFullLabel(day)}
								</ReadableText>
								<ReadableText size={15} weight={700}>
									{eventCountLabel(day.eventCount)}
								</ReadableText>
							</div>
							{day.isToday ? (
								<div
									style={{
										border: "2px solid #111",
										backgroundColor: "#111",
										padding: "2px 8px",
										boxSizing: "border-box",
									}}
								>
									<ReadableText size={13} weight={700} color="#fff">
										HEUTE
									</ReadableText>
								</div>
							) : null}
						</div>
						<div
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								padding: "4px 12px 8px",
								boxSizing: "border-box",
								minWidth: 0,
								overflow: "hidden",
							}}
						>
							{day.events.length === 0 ? (
								<div
									style={{
										flex: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<ReadableText size={22} weight={700} color="#777">
										Keine Termine
									</ReadableText>
								</div>
							) : (
								day.events.slice(0, 4).map((event, index) => (
									<div
										key={event.id}
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 4,
											padding: "12px 0 10px",
											borderBottom:
												index < Math.min(day.events.length, 4) - 1
													? "2px solid #d0d0d0"
													: "none",
											minWidth: 0,
										}}
									>
										<ReadableText size={14} weight={700} color="#666">
											{twoDayEventTimeLabel(event)}
										</ReadableText>
										<ReadableText
											size={22}
											weight={700}
											style={{
												lineHeight: 1.05,
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											{event.summary}
										</ReadableText>
									</div>
								))
							)}
							<div
								style={{
									marginTop: "auto",
									paddingTop: 8,
									display: "flex",
									justifyContent: "flex-start",
								}}
							>
								<DayCountMarker
									eventCount={day.eventCount}
									dotSize={7}
									gap={6}
									textSize={15}
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function MonthOverviewCell({ day }: { day: CalendarDay }) {
	const dayColor = day.isCurrentMonth ? "#111" : "#9a9a9a";

	return (
		<div
			style={{
				width: MONTH_OVERVIEW_DAY_WIDTH,
				borderRight: "2px solid #111",
				borderBottom: "2px solid #111",
				padding: "10px 10px 8px",
				height: 52,
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				boxSizing: "border-box",
				backgroundColor: "#fff",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					minHeight: 24,
				}}
			>
				<ReadableText size={28} weight={700} color={dayColor}>
					{day.dayNumber}
				</ReadableText>
				{day.isToday ? (
					<div
						style={{
							border: "3px solid #111",
							padding: "2px 6px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							boxSizing: "border-box",
						}}
					>
						<ReadableText size={12} weight={700}>
							HEUTE
						</ReadableText>
					</div>
				) : null}
			</div>
			<DayCountMarker
				eventCount={day.eventCount}
				dotSize={6}
				gap={5}
				textSize={14}
			/>
		</div>
	);
}

function MonthOverview({
	providerLabel,
	subtitle,
	timeZone,
	firstDay,
	monthLabel,
	monthWeeks,
}: {
	providerLabel: string;
	subtitle: string;
	timeZone: string;
	firstDay: 0 | 1;
	monthLabel: string;
	monthWeeks: CalendarDay[][];
}) {
	const weekdayLabels = MONTH_OVERVIEW_WEEKDAYS[firstDay];
	const clockLabel = monthOverviewClock(timeZone);
	const monthHeading = monthOverviewLabel(monthLabel);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				border: "2px solid #111",
				padding: 14,
				backgroundColor: "#fff",
				boxSizing: "border-box",
				gap: 12,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 12,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<CalendarGlyph size={30} accent={true} />
					<SafeTitle size={30} lines={1}>
						{`${providerLabel.toUpperCase()} KALENDER`}
					</SafeTitle>
				</div>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<ReadableText size={42} weight={700} style={{ lineHeight: 1 }}>
						{clockLabel}
					</ReadableText>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<SafeTitle size={30} lines={1}>
						{monthHeading}
					</SafeTitle>
				</div>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					borderTop: "2px solid #111",
				}}
			>
				<div style={{ display: "flex", borderLeft: "2px solid #111" }}>
					{weekdayLabels.map((label) => (
						<div
							key={label}
							style={{
								width: MONTH_OVERVIEW_DAY_WIDTH,
								height: 40,
								borderRight: "2px solid #111",
								borderBottom: "2px solid #111",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								boxSizing: "border-box",
							}}
						>
							<ReadableText size={20} weight={700}>
								{label}
							</ReadableText>
						</div>
					))}
				</div>
				{monthWeeks.map((week, index) => (
					<div
						key={`month-overview-week-${index}`}
						style={{ display: "flex", borderLeft: "2px solid #111" }}
					>
						{week.map((day) => (
							<MonthOverviewCell key={day.key} day={day} />
						))}
					</div>
				))}
			</div>
			<div
				style={{
					marginTop: "auto",
					paddingTop: 2,
					display: "flex",
					justifyContent: "flex-start",
				}}
			>
				<ReadableText size={17} weight={700}>
					{subtitle}
				</ReadableText>
			</div>
		</div>
	);
}

export default function CalendarScreen({
	providerLabel = "Calendar",
	title = "Calendar",
	subtitle = "Personal Calendar",
	timeZone = "America/New_York",
	updatedAt = "",
	note,
	eventLayout = "month-overview",
	includeDescription = true,
	includeEventTime = true,
	firstDay = 0,
	defaultDays = [],
	weekDays = [],
	monthWeeks = [],
	monthLabel = "",
	width = 800,
	height = 480,
}: Props) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f3f1ee",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 14,
				}}
			>
				{eventLayout === "month-overview" && monthWeeks.length > 0 ? (
					<MonthOverview
						providerLabel={providerLabel}
						subtitle={subtitle}
						timeZone={timeZone}
						firstDay={firstDay}
						monthLabel={monthLabel}
						monthWeeks={monthWeeks}
					/>
				) : eventLayout === "week-timeline" && weekDays.length > 0 ? (
					<WeekTimeline
						providerLabel={providerLabel}
						timeZone={timeZone}
						weekDays={weekDays}
					/>
				) : eventLayout === "two-day" ? (
					<TwoDayTimeline
						providerLabel={providerLabel}
						timeZone={timeZone}
						defaultDays={defaultDays}
						weekDays={weekDays}
					/>
				) : (
					<>
						<Header
							providerLabel={providerLabel}
							title={title}
							subtitle={subtitle}
							timeZone={timeZone}
							updatedAt={updatedAt}
						/>
						<DefaultView
							providerLabel={providerLabel}
							timeZone={timeZone}
							defaultDays={defaultDays}
							includeDescription={includeDescription}
							includeEventTime={includeEventTime}
						/>
						{note ? (
							<div style={{ marginTop: "auto" }}>
								<MetaText size={META_TEXT}>{note}</MetaText>
							</div>
						) : null}
					</>
				)}
			</div>
		</PreSatori>
	);
}

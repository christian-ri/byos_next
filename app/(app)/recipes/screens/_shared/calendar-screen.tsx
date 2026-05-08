import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import {
	BORDER_WIDTH,
	EInkCard,
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

function eventTimeLabel(event: CalendarDayEvent) {
	if (event.allDay) return "All day";
	if (event.multiDay && !event.timeLabel) return "Multi-day";
	return event.timeLabel || "TBA";
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
				alignItems: "flex-start",
				gap: 16,
			}}
		>
			<div
				style={{ display: "flex", flexDirection: "column", gap: 8, width: 470 }}
			>
				<MetaText>{provider}</MetaText>
				<SafeTitle size={32} lines={2}>
					{mainTitle}
				</SafeTitle>
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

function DayHeader({ day }: { day: CalendarDay }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<ReadableText size={18} weight={700}>
				{day.label}
			</ReadableText>
			<MetaText>{day.shortLabel}</MetaText>
		</div>
	);
}

function EventList({
	events,
	maxEvents,
	cardWidth,
	compact = false,
}: {
	events: CalendarDayEvent[];
	maxEvents: number;
	cardWidth: number;
	compact?: boolean;
}) {
	const visibleEvents = events.slice(0, maxEvents);
	const remaining = Math.max(0, events.length - visibleEvents.length);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 10,
				width: "100%",
			}}
		>
			{visibleEvents.map((event) => (
				<EInkCard
					key={event.id}
					padding={compact ? 10 : 12}
					radius={compact ? 12 : 14}
					style={{
						width: cardWidth,
						minHeight: compact ? 64 : 74,
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						gap: compact ? 6 : 8,
						flexShrink: 0,
					}}
				>
					<ReadableText
						size={compact ? 15 : 16}
						weight={700}
						style={{ lineHeight: 1 }}
					>
						{eventTimeLabel(event)}
					</ReadableText>
					<ReadableText
						size={compact ? 18 : 20}
						style={{ lineHeight: compact ? 1.04 : 1.08 }}
					>
						{event.summary}
					</ReadableText>
				</EInkCard>
			))}
			{remaining > 0 ? (
				<ReadableText size={18} weight={700}>
					+{remaining} more
				</ReadableText>
			) : null}
		</div>
	);
}

function DefaultView({ defaultDays }: { defaultDays: CalendarDay[] }) {
	const columnWidth = 244;
	const cardWidth = 234;
	return (
		<div
			style={{
				display: "flex",
				gap: 10,
				alignItems: "stretch",
				justifyContent: "space-between",
			}}
		>
			{defaultDays.map((day, index) => (
				<div
					key={day.key}
					style={{
						width: columnWidth,
						display: "flex",
						flexDirection: "column",
						gap: 14,
						paddingRight: index < defaultDays.length - 1 ? 10 : 0,
						borderRight:
							index < defaultDays.length - 1 ? "2px solid #111" : "none",
						boxSizing: "border-box",
					}}
				>
					<DayHeader day={day} />
					<EventList
						events={day.events}
						maxEvents={day.events.length}
						cardWidth={cardWidth}
					/>
				</div>
			))}
		</div>
	);
}

function TwoDayView({ defaultDays }: { defaultDays: CalendarDay[] }) {
	const twoDays = defaultDays.slice(0, 2);
	const cardWidth = 372;

	return (
		<div
			style={{
				display: "flex",
				gap: 16,
				alignItems: "stretch",
				justifyContent: "space-between",
			}}
		>
			{twoDays.map((day) => (
				<div
					key={day.key}
					style={{
						width: 372,
						display: "flex",
						flexDirection: "column",
						gap: 16,
						boxSizing: "border-box",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 4,
							paddingBottom: 8,
							borderBottom: "2px solid #111",
						}}
					>
						<ReadableText size={22} weight={700}>
							{day.label}
						</ReadableText>
						<MetaText size={16}>{day.shortLabel}</MetaText>
					</div>
					<EventList
						events={day.events}
						maxEvents={day.events.length}
						cardWidth={cardWidth}
						compact={true}
					/>
				</div>
			))}
		</div>
	);
}

function WeekView({ weekDays }: { weekDays: CalendarDay[] }) {
	const cardWidth = 90;
	return (
		<div
			style={{
				display: "flex",
				gap: 8,
			}}
		>
			{weekDays.slice(0, 7).map((day) => (
				<div
					key={day.key}
					style={{
						width: 96,
						minHeight: 286,
						display: "flex",
						flexDirection: "column",
						gap: 12,
						paddingRight: 6,
						borderRight: "2px solid #111",
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<ReadableText size={16} weight={700}>
							{day.shortLabel}
						</ReadableText>
						<MetaText>{day.dayNumber}</MetaText>
					</div>
					<EventList
						events={day.events}
						maxEvents={day.events.length}
						cardWidth={cardWidth}
					/>
				</div>
			))}
		</div>
	);
}

function MonthCell({ day }: { day: CalendarDay }) {
	const firstEvent = day.events[0];
	const remaining = Math.max(0, day.events.length - (firstEvent ? 1 : 0));

	return (
		<div
			style={{
				border: `${BORDER_WIDTH}px solid ${day.isCurrentMonth ? "#111" : "#d4d4d4"}`,
				padding: 8,
				minHeight: 88,
				backgroundColor: day.isToday ? "#111" : "#fff",
				color: day.isToday ? "#fff" : day.isCurrentMonth ? "#111" : "#7a7a7a",
				display: "flex",
				flexDirection: "column",
				gap: 6,
				boxSizing: "border-box",
			}}
		>
			<ReadableText
				size={16}
				weight={700}
				color={day.isToday ? "#fff" : day.isCurrentMonth ? "#111" : "#7a7a7a"}
			>
				{day.dayNumber}
			</ReadableText>
			{firstEvent ? (
				<>
					<ReadableText
						size={14}
						weight={700}
						color={day.isToday ? "#fff" : "#111"}
					>
						{eventTimeLabel(firstEvent)}
					</ReadableText>
					<ReadableText size={14} color={day.isToday ? "#fff" : "#111"}>
						{firstEvent.summary}
					</ReadableText>
				</>
			) : null}
			{remaining > 0 ? (
				<ReadableText
					size={14}
					weight={700}
					color={day.isToday ? "#fff" : "#111"}
				>
					+{remaining} more
				</ReadableText>
			) : null}
		</div>
	);
}

function MonthView({
	monthLabel,
	monthWeeks,
}: {
	monthLabel: string;
	monthWeeks: CalendarDay[][];
}) {
	const weekdayHeader = monthWeeks[0]?.map((day) => day.shortLabel) || [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat",
	];

	return (
		<EInkCard
			padding={14}
			radius={18}
			style={{ display: "flex", flexDirection: "column", gap: 12 }}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<SafeTitle size={30} lines={2}>
					{monthLabel}
				</SafeTitle>
				<MetaText>{monthWeeks.length} weeks</MetaText>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
				<div style={{ display: "flex", gap: 6 }}>
					{weekdayHeader.map((label) => (
						<div key={label} style={{ width: 96, textAlign: "center" }}>
							<ReadableText size={14} weight={700}>
								{label}
							</ReadableText>
						</div>
					))}
				</div>
				{monthWeeks.map((week, index) => (
					<div key={`week-${index}`} style={{ display: "flex", gap: 6 }}>
						{week.map((day) => (
							<div key={day.key} style={{ width: 96 }}>
								<MonthCell day={day} />
							</div>
						))}
					</div>
				))}
			</div>
		</EInkCard>
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

function DayCountMarker({ eventCount }: { eventCount: number }) {
	if (eventCount <= 0) return null;

	if (eventCount >= 5) {
		return (
			<ReadableText size={18} weight={700} style={{ lineHeight: 1 }}>
				5+
			</ReadableText>
		);
	}

	const dotCount = eventCount <= 2 ? eventCount : 3;

	return (
		<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
			{Array.from({ length: dotCount }, (_, index) => (
				<div
					key={`dot-${index}`}
					style={{
						width: 8,
						height: 8,
						borderRadius: 999,
						backgroundColor: "#111",
						flexShrink: 0,
					}}
				/>
			))}
		</div>
	);
}

function MonthOverviewCell({ day }: { day: CalendarDay }) {
	const dayColor = day.isCurrentMonth ? "#111" : "#9a9a9a";

	return (
		<div
			style={{
				borderRight: "2px solid #111",
				borderBottom: "2px solid #111",
				padding: "10px 10px 8px",
				minHeight: 50,
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
					minHeight: 30,
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
							minWidth: 22,
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							boxSizing: "border-box",
						}}
					>
						<ReadableText size={14} weight={700}>
							HEUTE
						</ReadableText>
					</div>
				) : null}
			</div>
			<DayCountMarker eventCount={day.eventCount} />
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
					display: "grid",
					gridTemplateColumns: "1.2fr 1fr 1.2fr",
					alignItems: "center",
					columnGap: 12,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							width: 30,
							height: 30,
							border: "3px solid #111",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							boxSizing: "border-box",
							flexShrink: 0,
						}}
					>
						<div
							style={{
								width: 12,
								height: 12,
								border: "3px solid #111",
								boxSizing: "border-box",
							}}
						/>
					</div>
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
					display: "grid",
					gridTemplateColumns: "repeat(7, 1fr)",
					borderTop: "2px solid #111",
					borderLeft: "2px solid #111",
				}}
			>
				{weekdayLabels.map((label) => (
					<div
						key={label}
						style={{
							height: 40,
							borderRight: "2px solid #111",
							borderBottom: "2px solid #111",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<ReadableText size={20} weight={700}>
							{label}
						</ReadableText>
					</div>
				))}
				{monthWeeks.flatMap((week) =>
					week.map((day) => <MonthOverviewCell key={day.key} day={day} />),
				)}
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
	eventLayout = "month",
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
				) : (
					<>
						<Header
							providerLabel={providerLabel}
							title={title}
							subtitle={subtitle}
							timeZone={timeZone}
							updatedAt={updatedAt}
						/>
						{eventLayout === "month" && monthWeeks.length > 0 ? (
							<MonthView monthLabel={monthLabel} monthWeeks={monthWeeks} />
						) : eventLayout === "two-day" ? (
							<TwoDayView defaultDays={defaultDays} />
						) : eventLayout === "week" ? (
							<WeekView weekDays={weekDays} />
						) : (
							<DefaultView defaultDays={defaultDays} />
						)}
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

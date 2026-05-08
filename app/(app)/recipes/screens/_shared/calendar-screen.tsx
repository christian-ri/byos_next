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

export default function CalendarScreen({
	providerLabel = "Calendar",
	title = "Calendar",
	subtitle = "Personal Calendar",
	timeZone = "America/New_York",
	updatedAt = "",
	note,
	eventLayout = "month",
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
			</div>
		</PreSatori>
	);
}

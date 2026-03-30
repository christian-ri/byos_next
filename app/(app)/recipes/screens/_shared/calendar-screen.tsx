import { PreSatori } from "@/utils/pre-satori";
import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";

type Props = CalendarRecipeData & {
	width?: number;
	height?: number;
};

function EventChip({
	event,
	includeDescription,
	includeEventTime,
	compact = false,
}: {
	event: CalendarDayEvent;
	includeDescription: boolean;
	includeEventTime: boolean;
	compact?: boolean;
}) {
	const emphasize = event.allDay || event.multiDay;
	return (
		<div
			className={`flex flex-col rounded-sm px-1.5 py-0.5 ${emphasize ? "bg-black text-white" : "bg-transparent text-black"} ${compact ? "min-h-[18px]" : ""}`}
		>
			<span
				className={`${compact ? "text-[10px]" : "text-[11px]"} leading-none font-medium truncate`}
			>
				{event.summary}
			</span>
			{includeEventTime && event.timeLabel && !compact && (
				<span className="text-[9px] leading-none mt-0.5 opacity-80">
					{event.timeLabel}
				</span>
			)}
			{includeDescription && event.description && !compact && (
				<span className="text-[9px] leading-tight mt-0.5 line-clamp-2">
					{event.description}
				</span>
			)}
		</div>
	);
}

function MonthCell({
	day,
	includeEventTime,
}: {
	day: CalendarDay;
	includeEventTime: boolean;
}) {
	const visibleEvents = day.events.slice(0, 4);
	const remaining = Math.max(0, day.events.length - visibleEvents.length);

	return (
		<div
			className={`flex flex-col border-r border-b border-dashed border-black px-1.5 py-1 ${day.isCurrentMonth ? "text-black" : "text-gray-400"}`}
		>
			<div className="flex justify-end">
				<span
					className={`text-[11px] leading-none ${day.isToday ? "bg-black text-white rounded-full px-1.5 py-0.5" : ""}`}
				>
					{day.dayNumber}
				</span>
			</div>

			<div className="mt-1 flex flex-col gap-1">
				{visibleEvents.map((event) => (
					<EventChip
						key={`${day.key}-${event.id}`}
						event={event}
						includeDescription={false}
						includeEventTime={includeEventTime}
						compact
					/>
				))}
				{remaining > 0 && (
					<span className="text-[10px] leading-none px-1.5">+{remaining} more</span>
				)}
			</div>
		</div>
	);
}

function DefaultColumn({
	day,
	includeDescription,
	includeEventTime,
}: {
	day: CalendarDay;
	includeDescription: boolean;
	includeEventTime: boolean;
}) {
	return (
		<div className="flex-1 border-r border-black last:border-r-0 px-3 py-3">
			<div className="border-b border-dashed border-black pb-2">
				<div className="text-lg font-medium">{day.shortLabel}</div>
				<div className="text-sm">{day.label}</div>
			</div>
			<div className="flex flex-col gap-2 pt-2">
				{day.events.length > 0 ? (
					day.events.map((event) => (
						<EventChip
							key={`${day.key}-${event.id}`}
							event={event}
							includeDescription={includeDescription}
							includeEventTime={includeEventTime}
						/>
					))
				) : (
					<span className="text-xs text-gray-500">No events</span>
				)}
			</div>
		</div>
	);
}

function WeekColumn({
	day,
	includeEventTime,
}: {
	day: CalendarDay;
	includeEventTime: boolean;
}) {
	return (
		<div className="flex-1 border-r border-black last:border-r-0 flex flex-col">
			<div className="border-b border-dashed border-black px-2 py-2 text-center">
				<div className="text-[12px] font-medium">{day.shortLabel}</div>
				<div className="text-[11px]">{day.dayNumber}</div>
			</div>
			<div className="flex-1 px-1.5 py-2 flex flex-col gap-1">
				{day.events.length > 0 ? (
					day.events.map((event) => (
						<EventChip
							key={`${day.key}-${event.id}`}
							event={event}
							includeDescription={false}
							includeEventTime={includeEventTime}
							compact
						/>
					))
				) : (
					<span className="text-[10px] text-gray-400">-</span>
				)}
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
	includeDescription = true,
	includeEventTime = true,
	defaultDays = [],
	weekDays = [],
	monthWeeks = [],
	monthLabel = "",
	width = 800,
	height = 480,
}: Props) {
	const isMonth = eventLayout === "month";
	const isWeek = eventLayout === "week";
	const weekdayHeader =
		monthWeeks[0]?.map((day) => day.shortLabel) || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-[#efefed] text-black p-4 flex flex-col">
				<div className="flex items-start justify-between px-2">
					<div className="flex flex-col">
						<div className="text-[34px] font-blockkie leading-none">{title}</div>
						<div className="text-[18px] text-gray-500 mt-1">{subtitle}</div>
					</div>
					<div className="flex flex-col items-end text-[11px] text-gray-500">
						<span>{timeZone}</span>
						<span>{updatedAt}</span>
					</div>
				</div>

				<div className="mt-3 flex-1 bg-white rounded-2xl border border-gray-300 overflow-hidden flex flex-col">
					<div className="flex items-center justify-between px-4 py-2">
						<div className="text-[18px] font-medium">
							{isMonth ? monthLabel : `${providerLabel} Calendar`}
						</div>
						<div className="rounded-full bg-[#dbe8ff] text-[#4f79d8] text-[11px] px-3 py-1">
							{note || "Preview - your device will show actual data"}
						</div>
					</div>

					{isMonth && (
						<>
							<div className="grid grid-cols-7 px-2 text-[12px] font-medium">
								{weekdayHeader.map((label) => (
									<div key={label} className="px-1 pb-2 text-center">
										{label}
									</div>
								))}
							</div>
							<div className="flex-1 flex flex-col border-t border-dashed border-black/40">
								{monthWeeks.map((week, weekIndex) => (
									<div
										key={`week-${weekIndex}`}
										className="grid grid-cols-7 min-h-0 flex-1"
									>
										{week.map((day) => (
											<MonthCell
												key={day.key}
												day={day}
												includeEventTime={includeEventTime}
											/>
										))}
									</div>
								))}
							</div>
						</>
					)}

					{isWeek && (
						<div className="flex-1 border-t border-dashed border-black/40 flex">
							{weekDays.map((day) => (
								<WeekColumn
									key={day.key}
									day={day}
									includeEventTime={includeEventTime}
								/>
							))}
						</div>
					)}

					{!isMonth && !isWeek && (
						<div className="flex-1 border-t border-dashed border-black/40 flex">
							{defaultDays.map((day) => (
								<DefaultColumn
									key={day.key}
									day={day}
									includeDescription={includeDescription}
									includeEventTime={includeEventTime}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</PreSatori>
	);
}

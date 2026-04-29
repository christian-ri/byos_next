import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import { PreSatori } from "@/utils/pre-satori";

type Props = CalendarRecipeData & {
	width?: number;
	height?: number;
};

type BoxStyle = {
	position: "absolute";
	left: number;
	top: number;
	width: number;
	height?: number;
};

const innerPadding = 32;
const panelTop = 98;
const panelRadius = 18;

function eventLabel(event: CalendarDayEvent, includeEventTime: boolean) {
	if (!includeEventTime || !event.timeLabel) return event.summary;
	return `${event.summary} (${event.timeLabel})`;
}

function fitText(value: string, maxChars: number) {
	if (value.length <= maxChars) return value;
	return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

function EventLine({
	event,
	includeEventTime,
	left,
	top,
	width,
	fontSize,
	maxChars,
}: {
	event: CalendarDayEvent;
	includeEventTime: boolean;
	left: number;
	top: number;
	width: number;
	fontSize: number;
	maxChars: number;
}) {
	const label = fitText(eventLabel(event, includeEventTime), maxChars);
	const style: BoxStyle = {
		position: "absolute",
		left,
		top,
		width,
	};

	return (
		<div
			style={style}
			className={`${event.allDay || event.multiDay ? "bg-black text-white rounded-sm px-1" : "text-black"} leading-none`}
		>
			<span style={{ fontSize }}>{label}</span>
		</div>
	);
}

function Header({
	title,
	subtitle,
	timeZone,
	updatedAt,
	width,
}: {
	title: string;
	subtitle: string;
	timeZone: string;
	updatedAt: string;
	width: number;
}) {
	return (
		<>
			<div
				style={{
					position: "absolute",
					left: innerPadding + 14,
					top: 18,
					width: width - 330,
				}}
			>
				<div className="font-blockkie leading-none" style={{ fontSize: 34 }}>
					{title}
				</div>
				<div
					className="text-gray-500 leading-none mt-2"
					style={{ fontSize: 17 }}
				>
					{subtitle}
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					right: innerPadding + 14,
					top: 20,
					width: 210,
				}}
				className="text-right text-gray-500 leading-tight"
			>
				<div style={{ fontSize: 12 }}>{timeZone}</div>
				<div style={{ fontSize: 12 }}>{updatedAt}</div>
			</div>
		</>
	);
}

function PanelHeader({
	label,
	note,
	width,
}: {
	label: string;
	note?: string;
	width: number;
}) {
	return (
		<>
			<div
				style={{
					position: "absolute",
					left: innerPadding + 20,
					top: panelTop + 18,
					width: 260,
				}}
				className="font-medium leading-none"
			>
				<span style={{ fontSize: 20 }}>{label}</span>
			</div>
			<div
				style={{
					position: "absolute",
					right: innerPadding + 20,
					top: panelTop + 14,
					width: Math.min(340, width - 420),
					backgroundColor: "#dbe8ff",
					borderRadius: 16,
					padding: "6px 12px",
				}}
				className="text-[#4f79d8] leading-none text-center"
			>
				<span style={{ fontSize: 11 }}>
					{fitText(note || "Preview - your device will show actual data", 54)}
				</span>
			</div>
		</>
	);
}

function MonthView({
	monthWeeks,
	monthLabel,
	note,
	includeEventTime,
	width,
	height,
}: {
	monthWeeks: CalendarDay[][];
	monthLabel: string;
	note?: string;
	includeEventTime: boolean;
	width: number;
	height: number;
}) {
	const panelLeft = innerPadding;
	const panelWidth = width - innerPadding * 2;
	const panelHeight = height - panelTop - innerPadding;
	const contentTop = panelTop + 58;
	const dayHeaderHeight = 26;
	const gridTop = contentTop + dayHeaderHeight;
	const gridHeight = panelTop + panelHeight - gridTop;
	const colWidth = panelWidth / 7;
	const rowHeight = gridHeight / Math.max(1, monthWeeks.length);
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
		<>
			<PanelHeader label={monthLabel} note={note} width={width} />
			{weekdayHeader.map((label, index) => (
				<div
					key={label}
					style={{
						position: "absolute",
						left: panelLeft + index * colWidth,
						top: contentTop + 5,
						width: colWidth,
					}}
					className="text-center font-medium leading-none"
				>
					<span style={{ fontSize: 12 }}>{label}</span>
				</div>
			))}
			{monthWeeks.map((week, weekIndex) =>
				week.map((day, dayIndex) => {
					const left = panelLeft + dayIndex * colWidth;
					const top = gridTop + weekIndex * rowHeight;
					const textColor = day.isCurrentMonth ? "text-black" : "text-gray-400";
					const visibleEvents = day.events.slice(0, 2);

					return (
						<div key={`${weekIndex}-${day.key}`}>
							<div
								style={{
									position: "absolute",
									left,
									top,
									width: colWidth,
									height: rowHeight,
									borderRight: "1px solid #000",
									borderBottom: "1px dashed #000",
								}}
							/>
							<div
								style={{
									position: "absolute",
									left: left + colWidth - 26,
									top: top + 8,
									width: 20,
								}}
								className={`text-right leading-none ${textColor}`}
							>
								<span style={{ fontSize: 12 }}>{day.dayNumber}</span>
							</div>
							{visibleEvents.map((event, eventIndex) => (
								<EventLine
									key={`${day.key}-${event.id}`}
									event={event}
									includeEventTime={includeEventTime}
									left={left + 7}
									top={top + 28 + eventIndex * 16}
									width={colWidth - 14}
									fontSize={9}
									maxChars={13}
								/>
							))}
						</div>
					);
				}),
			)}
		</>
	);
}

function WeekView({
	weekDays,
	note,
	providerLabel,
	includeEventTime,
	width,
	height,
}: {
	weekDays: CalendarDay[];
	note?: string;
	providerLabel: string;
	includeEventTime: boolean;
	width: number;
	height: number;
}) {
	const panelLeft = innerPadding;
	const panelWidth = width - innerPadding * 2;
	const panelHeight = height - panelTop - innerPadding;
	const contentTop = panelTop + 58;
	const colWidth = panelWidth / 7;

	return (
		<>
			<PanelHeader
				label={`${providerLabel} Calendar`}
				note={note}
				width={width}
			/>
			{weekDays.map((day, dayIndex) => {
				const left = panelLeft + dayIndex * colWidth;
				const maxEvents = day.events.slice(0, 5);
				return (
					<div key={day.key}>
						<div
							style={{
								position: "absolute",
								left,
								top: contentTop,
								width: colWidth,
								height: panelTop + panelHeight - contentTop,
								borderRight: "1px solid #000",
								borderTop: "1px dashed #000",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left,
								top: contentTop + 12,
								width: colWidth,
							}}
							className="text-center leading-none"
						>
							<div style={{ fontSize: 12 }}>{day.shortLabel}</div>
							<div className="mt-1" style={{ fontSize: 12 }}>
								{day.dayNumber}
							</div>
						</div>
						{maxEvents.length > 0 ? (
							maxEvents.map((event, eventIndex) => (
								<EventLine
									key={`${day.key}-${event.id}`}
									event={event}
									includeEventTime={includeEventTime}
									left={left + 8}
									top={contentTop + 62 + eventIndex * 22}
									width={colWidth - 16}
									fontSize={10}
									maxChars={12}
								/>
							))
						) : (
							<div
								style={{
									position: "absolute",
									left: left + 10,
									top: contentTop + 62,
									width: colWidth - 20,
								}}
								className="text-gray-400 leading-none"
							>
								<span style={{ fontSize: 10 }}>-</span>
							</div>
						)}
					</div>
				);
			})}
		</>
	);
}

function DefaultView({
	defaultDays,
	note,
	providerLabel,
	includeDescription,
	includeEventTime,
	width,
	height,
}: {
	defaultDays: CalendarDay[];
	note?: string;
	providerLabel: string;
	includeDescription: boolean;
	includeEventTime: boolean;
	width: number;
	height: number;
}) {
	const panelLeft = innerPadding;
	const panelWidth = width - innerPadding * 2;
	const panelHeight = height - panelTop - innerPadding;
	const contentTop = panelTop + 58;
	const colWidth = panelWidth / 3;

	return (
		<>
			<PanelHeader
				label={`${providerLabel} Calendar`}
				note={note}
				width={width}
			/>
			{defaultDays.map((day, dayIndex) => {
				const left = panelLeft + dayIndex * colWidth;
				return (
					<div key={day.key}>
						<div
							style={{
								position: "absolute",
								left,
								top: contentTop,
								width: colWidth,
								height: panelTop + panelHeight - contentTop,
								borderRight: "1px solid #000",
								borderTop: "1px dashed #000",
							}}
						/>
						<div
							style={{
								position: "absolute",
								left: left + 14,
								top: contentTop + 16,
								width: colWidth - 28,
							}}
							className="leading-tight"
						>
							<div className="font-medium" style={{ fontSize: 16 }}>
								{day.shortLabel}
							</div>
							<div style={{ fontSize: 13 }}>{day.label}</div>
						</div>
						{day.events.slice(0, 6).map((event, eventIndex) => (
							<div key={`${day.key}-${event.id}`}>
								<EventLine
									event={event}
									includeEventTime={includeEventTime}
									left={left + 14}
									top={contentTop + 68 + eventIndex * 34}
									width={colWidth - 28}
									fontSize={12}
									maxChars={28}
								/>
								{includeDescription && event.description && (
									<div
										style={{
											position: "absolute",
											left: left + 14,
											top: contentTop + 84 + eventIndex * 34,
											width: colWidth - 28,
										}}
										className="text-gray-500 leading-none"
									>
										<span style={{ fontSize: 9 }}>
											{fitText(event.description, 36)}
										</span>
									</div>
								)}
							</div>
						))}
					</div>
				);
			})}
		</>
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
	const panelWidth = width - innerPadding * 2;
	const panelHeight = height - panelTop - innerPadding;

	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-[#efefed] text-black relative overflow-hidden">
				<Header
					title={title}
					subtitle={subtitle}
					timeZone={timeZone}
					updatedAt={updatedAt}
					width={width}
				/>
				<div
					style={{
						position: "absolute",
						left: innerPadding,
						top: panelTop,
						width: panelWidth,
						height: panelHeight,
						backgroundColor: "#fff",
						border: "1px solid #d1d5db",
						borderRadius: panelRadius,
					}}
				/>
				{isMonth ? (
					<MonthView
						monthWeeks={monthWeeks}
						monthLabel={monthLabel}
						note={note}
						includeEventTime={includeEventTime}
						width={width}
						height={height}
					/>
				) : isWeek ? (
					<WeekView
						weekDays={weekDays}
						note={note}
						providerLabel={providerLabel}
						includeEventTime={includeEventTime}
						width={width}
						height={height}
					/>
				) : (
					<DefaultView
						defaultDays={defaultDays}
						note={note}
						providerLabel={providerLabel}
						includeDescription={includeDescription}
						includeEventTime={includeEventTime}
						width={width}
						height={height}
					/>
				)}
			</div>
		</PreSatori>
	);
}

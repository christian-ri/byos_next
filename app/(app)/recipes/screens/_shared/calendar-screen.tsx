import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import {
	type BitmapLayoutProfile,
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
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

function eventLabel(event: CalendarDayEvent, includeEventTime: boolean) {
	if (!includeEventTime || !event.timeLabel) return event.summary;
	return `${event.summary} (${event.timeLabel})`;
}

function getPanelTop(profile: BitmapLayoutProfile) {
	return Math.max(
		74,
		profile.padding +
			scaleText(60, profile, {
				compactBase: 66,
				denseBase: 58,
				min: 58,
				max: 74,
			}),
	);
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
	const label = clampText(eventLabel(event, includeEventTime), maxChars);
	const style: BoxStyle = {
		position: "absolute",
		left,
		top,
		width,
	};

	return (
		<div
			style={style}
			className={`${event.allDay || event.multiDay ? "bg-black text-white rounded-sm px-1" : "text-black"} leading-tight font-geneva9 overflow-hidden`}
		>
			<span style={{ fontSize, maxWidth: width }}>{label}</span>
		</div>
	);
}

function Header({
	title,
	subtitle,
	timeZone,
	updatedAt,
	width,
	profile,
}: {
	title: string;
	subtitle: string;
	timeZone: string;
	updatedAt: string;
	width: number;
	profile: BitmapLayoutProfile;
}) {
	const headerTop = profile.padding - 2;
	const leftWidth = Math.max(180, width - (profile.isDense ? 160 : 260));
	const metaWidth = profile.isDense ? 132 : 190;

	return (
		<>
			<div
				style={{
					position: "absolute",
					left: profile.padding + 10,
					top: headerTop,
					width: leftWidth,
				}}
			>
				<div
					className="font-blockkie leading-none"
					style={{
						fontSize: scaleText(34, profile, {
							compactBase: 28,
							denseBase: 21,
							min: 18,
							max: 34,
						}),
					}}
				>
					{title}
				</div>
				<div
					className="mt-2 font-geneva9 leading-none text-gray-500"
					style={{
						fontSize: scaleText(17, profile, {
							compactBase: 14,
							denseBase: 11,
							min: 10,
							max: 17,
						}),
					}}
				>
					{clampText(subtitle, profile.isDense ? 24 : 42)}
				</div>
			</div>
			<div
				style={{
					position: "absolute",
					right: profile.padding + 10,
					top: headerTop + 2,
					width: metaWidth,
				}}
				className="text-right font-geneva9 leading-tight text-gray-500"
			>
				<div
					style={{
						fontSize: scaleText(12, profile, {
							compactBase: 10,
							denseBase: 9,
							min: 8,
							max: 12,
						}),
					}}
				>
					{clampText(timeZone, profile.isDense ? 18 : 24)}
				</div>
				<div
					style={{
						fontSize: scaleText(12, profile, {
							compactBase: 10,
							denseBase: 9,
							min: 8,
							max: 12,
						}),
					}}
				>
					{updatedAt}
				</div>
			</div>
		</>
	);
}

function PanelHeader({
	label,
	note,
	width,
	profile,
}: {
	label: string;
	note?: string;
	width: number;
	profile: BitmapLayoutProfile;
}) {
	const panelTop = getPanelTop(profile);

	return (
		<>
			<div
				style={{
					position: "absolute",
					left: profile.padding + 18,
					top: panelTop + 14,
					width: Math.max(120, width * 0.28),
				}}
				className="font-blockkie leading-none"
			>
				<span
					style={{
						fontSize: scaleText(20, profile, {
							compactBase: 16,
							denseBase: 13,
							min: 11,
							max: 20,
						}),
					}}
				>
					{label}
				</span>
			</div>
			{note ? (
				<div
					style={{
						position: "absolute",
						right: profile.padding + 18,
						top: panelTop + 12,
						width: Math.min(profile.isDense ? 168 : 340, width * 0.46),
						backgroundColor: "#dbe8ff",
						borderRadius: 16,
						padding: profile.isDense ? "4px 8px" : "6px 12px",
					}}
					className="text-center font-geneva9 leading-none text-[#4f79d8]"
				>
					<span
						style={{
							fontSize: scaleText(11, profile, {
								compactBase: 10,
								denseBase: 8,
								min: 8,
								max: 11,
							}),
						}}
					>
						{clampText(note, profile.isDense ? 28 : 54)}
					</span>
				</div>
			) : null}
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
	profile,
}: {
	monthWeeks: CalendarDay[][];
	monthLabel: string;
	note?: string;
	includeEventTime: boolean;
	width: number;
	height: number;
	profile: BitmapLayoutProfile;
}) {
	const panelTop = getPanelTop(profile);
	const panelLeft = profile.padding;
	const panelWidth = width - profile.padding * 2;
	const panelHeight = height - panelTop - profile.padding;
	const contentTop = panelTop + (profile.isDense ? 44 : 56);
	const dayHeaderHeight = profile.isDense ? 20 : 24;
	const gridTop = contentTop + dayHeaderHeight;
	const gridHeight = panelTop + panelHeight - gridTop;
	const colWidth = panelWidth / 7;
	const rowHeight = gridHeight / Math.max(1, monthWeeks.length);
	const eventLineHeight = profile.isDense ? 14 : 16;
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
			<PanelHeader
				label={monthLabel}
				note={note}
				width={width}
				profile={profile}
			/>
			{weekdayHeader.map((label, index) => (
				<div
					key={label}
					style={{
						position: "absolute",
						left: panelLeft + index * colWidth,
						top: contentTop + 5,
						width: colWidth,
					}}
					className="text-center font-geneva9 leading-none"
				>
					<span
						style={{
							fontSize: scaleText(12, profile, {
								compactBase: 11,
								denseBase: 8,
								min: 8,
								max: 12,
							}),
						}}
					>
						{label}
					</span>
				</div>
			))}
			{monthWeeks.map((week, weekIndex) =>
				week.map((day, dayIndex) => {
					const left = panelLeft + dayIndex * colWidth;
					const top = gridTop + weekIndex * rowHeight;
					const textColor = day.isCurrentMonth ? "text-black" : "text-gray-400";
					const visibleEvents = day.events.slice(0, profile.isDense ? 1 : 2);

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
								className={`text-right font-geneva9 leading-none ${textColor}`}
							>
								<span
									style={{
										fontSize: scaleText(12, profile, {
											compactBase: 11,
											denseBase: 8,
											min: 8,
											max: 12,
										}),
									}}
								>
									{day.dayNumber}
								</span>
							</div>
							{visibleEvents.map((event, eventIndex) => (
								<EventLine
									key={`${day.key}-${event.id}`}
									event={event}
									includeEventTime={includeEventTime}
									left={left + 7}
									top={top + 28 + eventIndex * eventLineHeight}
									width={colWidth - 14}
									fontSize={scaleText(10, profile, {
										compactBase: 9,
										denseBase: 8,
										min: 7,
										max: 10,
									})}
									maxChars={profile.isDense ? 9 : 12}
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
	includeEventTime,
	width,
	height,
	profile,
}: {
	weekDays: CalendarDay[];
	note?: string;
	includeEventTime: boolean;
	width: number;
	height: number;
	profile: BitmapLayoutProfile;
}) {
	const panelTop = getPanelTop(profile);
	const panelLeft = profile.padding;
	const panelWidth = width - profile.padding * 2;
	const panelHeight = height - panelTop - profile.padding;
	const contentTop = panelTop + (profile.isDense ? 44 : 56);
	const colWidth = panelWidth / 7;

	return (
		<>
			<PanelHeader
				label="This Week"
				note={note}
				width={width}
				profile={profile}
			/>
			{weekDays.map((day, dayIndex) => {
				const left = panelLeft + dayIndex * colWidth;
				const maxEvents = day.events.slice(0, profile.isDense ? 3 : 4);
				const eventTop = contentTop + (profile.isDense ? 54 : 62);
				const eventSpacing = profile.isDense ? 18 : 22;

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
							className="text-center font-geneva9 leading-none"
						>
							<div
								style={{
									fontSize: scaleText(12, profile, {
										compactBase: 11,
										denseBase: 8,
										min: 8,
										max: 12,
									}),
								}}
							>
								{day.shortLabel}
							</div>
							<div
								className="mt-1"
								style={{
									fontSize: scaleText(11, profile, {
										compactBase: 10,
										denseBase: 8,
										min: 8,
										max: 11,
									}),
								}}
							>
								{day.label}
							</div>
						</div>
						{maxEvents.length > 0 ? (
							maxEvents.map((event, eventIndex) => (
								<EventLine
									key={`${day.key}-${event.id}`}
									event={event}
									includeEventTime={includeEventTime}
									left={left + 8}
									top={eventTop + eventIndex * eventSpacing}
									width={colWidth - 16}
									fontSize={scaleText(13, profile, {
										compactBase: 11,
										denseBase: 9,
										min: 8,
										max: 13,
									})}
									maxChars={profile.isDense ? 11 : 16}
								/>
							))
						) : (
							<div
								style={{
									position: "absolute",
									left: left + 10,
									top: eventTop,
									width: colWidth - 20,
								}}
								className="font-geneva9 leading-none text-gray-400"
							>
								<span
									style={{
										fontSize: scaleText(10, profile, {
											compactBase: 9,
											denseBase: 8,
											min: 8,
											max: 10,
										}),
									}}
								>
									-
								</span>
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
	includeDescription,
	includeEventTime,
	width,
	height,
	profile,
}: {
	defaultDays: CalendarDay[];
	note?: string;
	includeDescription: boolean;
	includeEventTime: boolean;
	width: number;
	height: number;
	profile: BitmapLayoutProfile;
}) {
	const panelTop = getPanelTop(profile);
	const panelLeft = profile.padding;
	const panelWidth = width - profile.padding * 2;
	const panelHeight = height - panelTop - profile.padding;
	const contentTop = panelTop + (profile.isDense ? 44 : 56);
	const colWidth = panelWidth / 3;

	return (
		<>
			<PanelHeader
				label="Upcoming"
				note={note}
				width={width}
				profile={profile}
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
							className="font-geneva9 leading-tight"
						>
							<div
								className="font-blockkie leading-none"
								style={{
									fontSize: scaleText(16, profile, {
										compactBase: 14,
										denseBase: 11,
										min: 10,
										max: 16,
									}),
								}}
							>
								{day.shortLabel}
							</div>
							<div
								style={{
									fontSize: scaleText(13, profile, {
										compactBase: 12,
										denseBase: 9,
										min: 9,
										max: 13,
									}),
								}}
							>
								{day.label}
							</div>
						</div>
						{day.events.slice(0, 5).map((event, eventIndex) => (
							<div key={`${day.key}-${event.id}`}>
								<EventLine
									event={event}
									includeEventTime={includeEventTime}
									left={left + 14}
									top={contentTop + 68 + eventIndex * 34}
									width={colWidth - 28}
									fontSize={scaleText(15, profile, {
										compactBase: 13,
										denseBase: 10,
										min: 8,
										max: 15,
									})}
									maxChars={profile.isDense ? 18 : 28}
								/>
								{includeDescription && event.description ? (
									<div
										style={{
											position: "absolute",
											left: left + 14,
											top: contentTop + 84 + eventIndex * 34,
											width: colWidth - 28,
										}}
										className="font-geneva9 leading-none text-gray-500"
									>
										<span
											style={{
												fontSize: scaleText(10, profile, {
													compactBase: 9,
													denseBase: 8,
													min: 8,
													max: 10,
												}),
											}}
										>
											{clampText(event.description, profile.isDense ? 22 : 34)}
										</span>
									</div>
								) : null}
							</div>
						))}
					</div>
				);
			})}
		</>
	);
}

export default function CalendarScreen({
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
	const profile = getBitmapLayoutProfile(width, height);
	const isMonth = eventLayout === "month";
	const isWeek = eventLayout === "week";
	const panelTop = getPanelTop(profile);
	const panelWidth = width - profile.padding * 2;
	const panelHeight = height - panelTop - profile.padding;

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="relative h-full w-full overflow-hidden bg-[#efefed] text-black">
				<Header
					title={title}
					subtitle={subtitle}
					timeZone={timeZone}
					updatedAt={updatedAt}
					width={width}
					profile={profile}
				/>
				<div
					style={{
						position: "absolute",
						left: profile.padding,
						top: panelTop,
						width: panelWidth,
						height: panelHeight,
						backgroundColor: "#fff",
						border: "1px solid #d1d5db",
						borderRadius: profile.panelRadius,
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
						profile={profile}
					/>
				) : isWeek ? (
					<WeekView
						weekDays={weekDays}
						note={note}
						includeEventTime={includeEventTime}
						width={width}
						height={height}
						profile={profile}
					/>
				) : (
					<DefaultView
						defaultDays={defaultDays}
						note={note}
						includeDescription={includeDescription}
						includeEventTime={includeEventTime}
						width={width}
						height={height}
						profile={profile}
					/>
				)}
			</div>
		</PreSatori>
	);
}

import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";

function parseIsoDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`);
}

function formatHeaderDate(day?: CalendarDay) {
	if (!day) return "";
	const date = parseIsoDate(day.isoDate);
	return new Intl.DateTimeFormat("de-DE", {
		weekday: "short",
		day: "numeric",
		month: "long",
	}).format(date);
}

function formatDayTitle(day?: CalendarDay) {
	if (!day) return "HEUTE";
	const date = parseIsoDate(day.isoDate);
	return new Intl.DateTimeFormat("de-DE", {
		weekday: "long",
	}).format(date);
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

function TodayEventRow({
	event,
	includeDescription,
	includeEventTime,
}: {
	event: CalendarDayEvent;
	includeDescription: boolean;
	includeEventTime: boolean;
}) {
	return (
		<div
			style={{
				border: "2px solid #111",
				padding: "12px 14px",
				display: "flex",
				flexDirection: "column",
				gap: 5,
				backgroundColor: "#fff",
				boxSizing: "border-box",
			}}
		>
			<ReadableText size={16} weight={700} color="#666">
				{eventTimeLabel(event, includeEventTime)}
			</ReadableText>
			<ReadableText
				size={24}
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
					size={17}
					style={{
						lineHeight: 1.08,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{event.description}
				</ReadableText>
			) : null}
		</div>
	);
}

export default function CalendarToday(
	props: CalendarRecipeData & { width?: number; height?: number },
) {
	const {
		title,
		subtitle,
		timeZone,
		note,
		includeDescription,
		includeEventTime,
		defaultDays,
		width = 800,
		height = 480,
	} = props;
	const profile = getBitmapLayoutProfile(width, height);
	const today = defaultDays[0];
	const visibleEvents = today?.events.slice(0, 6) || [];
	const remainingEvents = Math.max(
		0,
		(today?.eventCount || 0) - visibleEvents.length,
	);
	const clockLabel = formatTodayClock(timeZone);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f4f2ee",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						gap: 10,
						paddingBottom: 10,
						borderBottom: "2px solid #111",
					}}
				>
					<div
						style={{
							width: 240,
							display: "flex",
							flexDirection: "column",
							gap: 6,
						}}
					>
						<MetaText>{title}</MetaText>
						<SafeTitle size={28} lines={1}>
							{subtitle}
						</SafeTitle>
					</div>
					<ReadableText size={42} weight={700} style={{ lineHeight: 1 }}>
						{clockLabel}
					</ReadableText>
					<div
						style={{
							width: 220,
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<ReadableText size={22} weight={700} align="right">
							{formatHeaderDate(today)}
						</ReadableText>
					</div>
				</div>
				<div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
					<div
						style={{
							width: 210,
							border: "2px solid #111",
							padding: "14px 16px",
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							backgroundColor: "#fff",
							boxSizing: "border-box",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<MetaText uppercase={true}>Heute</MetaText>
							<SafeTitle size={46} lines={2}>
								{formatDayTitle(today).toUpperCase()}
							</SafeTitle>
							<ReadableText size={24} weight={700}>
								{formatHeaderDate(today)}
							</ReadableText>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
							<div
								style={{
									alignSelf: "flex-start",
									border: "2px solid #111",
									backgroundColor: "#111",
									padding: "4px 10px",
								}}
							>
								<ReadableText size={14} weight={700} color="#fff">
									HEUTE
								</ReadableText>
							</div>
							<ReadableText size={20} weight={700}>
								{eventCountLabel(today?.eventCount || 0)}
							</ReadableText>
						</div>
					</div>
					<div
						style={{
							flex: 1,
							border: "2px solid #111",
							padding: "12px 14px",
							display: "flex",
							flexDirection: "column",
							gap: 10,
							backgroundColor: "#fff",
							boxSizing: "border-box",
							minWidth: 0,
						}}
					>
						{visibleEvents.length === 0 ? (
							<div
								style={{
									flex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<SafeTitle size={34} lines={2} align="center">
									Keine Termine heute
								</SafeTitle>
							</div>
						) : (
							<>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 10 }}
								>
									{visibleEvents.map((event) => (
										<TodayEventRow
											key={event.id}
											event={event}
											includeDescription={includeDescription}
											includeEventTime={includeEventTime}
										/>
									))}
								</div>
								{remainingEvents > 0 ? (
									<ReadableText size={18} weight={700}>
										{`+${remainingEvents} weitere Termine`}
									</ReadableText>
								) : null}
							</>
						)}
						<div
							style={{
								marginTop: "auto",
								display: "flex",
								justifyContent: "space-between",
								gap: 12,
							}}
						>
							<MetaText>{note || "Nur heutige Termine"}</MetaText>
							<MetaText align="right">{timeZone}</MetaText>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

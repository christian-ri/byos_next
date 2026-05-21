import type {
	CalendarDay,
	CalendarDayEvent,
	CalendarRecipeData,
} from "@/app/(app)/recipes/screens/_shared/calendar-data";
import { PixelPerfectText } from "@/app/(app)/recipes/screens/_shared/pixel-perfect";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";

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

	if (/^pp calendar today$/i.test(title.trim())) {
		return "Christians Kalender";
	}

	return title.trim() || "Kalender";
}

function CalendarGlyph({ size = 26 }: { size?: number }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<rect
				x="3"
				y="4.5"
				width="18"
				height="16"
				rx="1.5"
				fill="none"
				stroke="#111"
				strokeWidth="1.8"
			/>
			<path d="M7 2.8v4.4M17 2.8v4.4M3 9.4h18" stroke="#111" strokeWidth="1.8" />
			<circle cx="8" cy="13" r="1.1" fill="#111" />
			<circle cx="12" cy="13" r="1.1" fill="#111" />
			<circle cx="16" cy="13" r="1.1" fill="#111" />
			<circle cx="8" cy="17" r="1.1" fill="#111" />
			<circle cx="12" cy="17" r="1.1" fill="#111" />
		</svg>
	);
}

function Badge({
	label,
	width,
}: {
	label: string;
	width: number;
}) {
	return (
		<div
			data-pixel-perfect="true"
			style={{
				width,
				padding: "4px 8px",
				border: "2px solid #111",
				backgroundColor: "#111",
				boxSizing: "border-box",
			}}
		>
			<PixelPerfectText
				text={label}
				width={width - 16}
				fontSize={12}
				fontWeight={700}
				align="center"
				uppercase={true}
				color="#fff"
			/>
		</div>
	);
}

function TimelineRow({
	event,
	includeEventTime,
	isCurrent,
	isLast,
}: {
	event: CalendarDayEvent;
	includeEventTime: boolean;
	isCurrent: boolean;
	isLast: boolean;
}) {
	return (
		<div
			style={{
				minHeight: 44,
				display: "flex",
				alignItems: "stretch",
				borderBottom: isLast ? "none" : "1px solid #111",
			}}
		>
			<div
				style={{
					width: 160,
					padding: "8px 10px 8px 12px",
					boxSizing: "border-box",
					display: "flex",
					alignItems: "center",
					flexShrink: 0,
				}}
			>
				<PixelPerfectText
					text={eventTimeLabel(event, includeEventTime)}
					width={138}
					fontSize={16}
					fontWeight={700}
				/>
			</div>
			<div
				style={{
					width: 44,
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						bottom: 0,
						left: "50%",
						width: 2,
						backgroundColor: "#999",
						transform: "translateX(-50%)",
					}}
				/>
				<div
					style={{
						width: isCurrent ? 18 : 12,
						height: isCurrent ? 18 : 12,
						borderRadius: 999,
						border: "2px solid #111",
						backgroundColor: isCurrent ? "#111" : "#fff",
						position: "relative",
						zIndex: 1,
					}}
				/>
			</div>
			<div
				style={{
					flex: 1,
					minWidth: 0,
					padding: "8px 12px",
					boxSizing: "border-box",
					display: "flex",
					alignItems: "center",
					gap: 10,
				}}
			>
				{isCurrent ? <Badge label="Aktuell" width={112} /> : null}
				<PixelPerfectText
					text={event.summary}
					width={isCurrent ? 230 : 342}
					fontSize={18}
					fontWeight={isCurrent ? 700 : 500}
				/>
			</div>
		</div>
	);
}

export default function PpCalendarToday(
	props: CalendarRecipeData & { width?: number; height?: number },
) {
	const {
		title,
		subtitle,
		timeZone,
		includeEventTime,
		defaultDays,
		width = 800,
		height = 480,
	} = props;
	const profile = getBitmapLayoutProfile(width, height);
	const today = defaultDays[0];
	const now = new Date();
	const displayTitle = buildDisplayTitle(title, subtitle);
	const clockLabel = formatTodayClock(timeZone);
	const allEvents = today?.events || [];
	const maxTimelineRows = height <= 480 ? 4 : 5;
	const timelineEvents = allEvents.slice(0, maxTimelineRows);
	const currentEvent = timelineEvents.find((event) => isEventActive(event, now));
	const nextEvent = timelineEvents.find((event) => isEventUpcoming(event, now));
	const featuredEvent = currentEvent || nextEvent;
	const featuredLabel = currentEvent
		? "Aktuell"
		: nextEvent
			? "Als Nächstes"
			: "Frei";
	const hiddenCount = Math.max(0, (today?.eventCount || 0) - timelineEvents.length);
	const emptyStateLabel =
		(today?.eventCount || 0) > 0
			? "Alle verbleibenden Termine für heute sind vorbei."
			: "Keine Termine heute";

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					padding: profile.padding,
					backgroundColor: "#f5f3ef",
					display: "flex",
					flexDirection: "column",
					gap: 10,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 12,
						paddingBottom: 8,
						borderBottom: "2px solid #111",
					}}
				>
					<div
						style={{
							width: 380,
							display: "flex",
							alignItems: "center",
							gap: 12,
							minWidth: 0,
						}}
					>
						<CalendarGlyph size={28} />
						<PixelPerfectText
							text={displayTitle}
							width={336}
							fontSize={26}
							fontWeight={700}
						/>
					</div>
					<PixelPerfectText
						text={formatHeaderDate(today)}
						width={250}
						fontSize={20}
						fontWeight={500}
						align="center"
					/>
					<PixelPerfectText
						text={clockLabel}
						width={142}
						fontSize={40}
						fontWeight={700}
						align="right"
					/>
				</div>

				<div
					style={{
						backgroundColor: "#111",
						borderRadius: 14,
						padding: 2,
					}}
				>
					<div
						style={{
							borderRadius: 12,
							backgroundColor: "#fff",
							padding: "12px 16px",
							display: "flex",
							alignItems: "stretch",
							gap: 16,
							width: "100%",
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								width: 210,
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								paddingRight: 18,
								boxSizing: "border-box",
							}}
						>
							<Badge label="Heute" width={72} />
							<PixelPerfectText
								text={formatDayTitle(today)}
								width={180}
								fontSize={34}
								fontWeight={700}
								maxLines={2}
							/>
							<PixelPerfectText
								text={formatDayDate(today)}
								width={180}
								fontSize={22}
								fontWeight={500}
							/>
						</div>
						<div style={{ width: 2, backgroundColor: "#111", flexShrink: 0 }} />

						<div
							style={{
								flex: 1,
								minWidth: 0,
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								gap: 8,
							}}
						>
							<PixelPerfectText
								text={featuredLabel}
								width={252}
								fontSize={16}
								fontWeight={700}
								uppercase={true}
							/>
							<PixelPerfectText
								text={featuredEvent?.summary || "Keine anstehenden Termine"}
								width={332}
								fontSize={28}
								fontWeight={700}
							/>
							<PixelPerfectText
								text={
									featuredEvent
										? eventTimeLabel(featuredEvent, includeEventTime)
										: "Der Rest des Tages ist frei"
								}
								width={320}
								fontSize={20}
								fontWeight={500}
							/>
						</div>

						<div
							style={{
								width: 142,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: 6,
								paddingLeft: 18,
								boxSizing: "border-box",
							}}
						>
							<CalendarGlyph size={32} />
							<PixelPerfectText
								text={String(today?.eventCount || 0)}
								width={72}
								fontSize={32}
								fontWeight={700}
								align="center"
							/>
							<PixelPerfectText
								text={eventCountLabel(today?.eventCount || 0)}
								width={110}
								fontSize={16}
								fontWeight={500}
								maxLines={2}
								align="center"
							/>
						</div>
					</div>
				</div>

				<div
					style={{
						flex: 1,
						minHeight: 0,
						backgroundColor: "#111",
						borderRadius: 14,
						padding: 2,
					}}
				>
					<div
						style={{
							borderRadius: 12,
							backgroundColor: "#fff",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							height: "100%",
							width: "100%",
							flex: 1,
						}}
					>
						<div
							style={{
								padding: "10px 16px",
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 12,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<CalendarGlyph size={22} />
								<PixelPerfectText
									text="Tagesübersicht"
									width={210}
									fontSize={20}
									fontWeight={700}
								/>
							</div>
							{hiddenCount > 0 ? (
								<PixelPerfectText
									text={`${hiddenCount} Termine ausgeblendet`}
									width={220}
									fontSize={16}
									fontWeight={500}
									align="right"
								/>
							) : null}
						</div>
						<div style={{ height: 2, backgroundColor: "#111", flexShrink: 0 }} />

						<div
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
							}}
						>
							{timelineEvents.length === 0 ? (
								<div
									style={{
										flex: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										padding: "0 24px",
									}}
								>
									<PixelPerfectText
										text={emptyStateLabel}
										width={420}
										fontSize={24}
										fontWeight={700}
										maxLines={2}
										align="center"
									/>
								</div>
							) : (
								timelineEvents.map((event, index) => (
									<TimelineRow
										key={event.id}
										event={event}
										includeEventTime={includeEventTime}
										isCurrent={isEventActive(event, now)}
										isLast={index === timelineEvents.length - 1}
									/>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

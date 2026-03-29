import { PreSatori } from "@/utils/pre-satori";
import { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";

type Props = CalendarRecipeData & {
	width?: number;
	height?: number;
};

export default function CalendarScreen({
	providerLabel,
	title,
	subtitle,
	timeZone,
	updatedAt,
	note,
	events,
	width = 800,
	height = 480,
}: Props) {
	const isPortrait = height > width;
	const visibleEvents = events.slice(0, isPortrait ? 5 : 6);

	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full bg-white border border-black flex flex-col p-5">
				<div
					className={`flex ${isPortrait ? "flex-col gap-4" : "flex-row items-start justify-between gap-6"} border-b border-black pb-4`}
				>
					<div className="flex flex-col">
						<div className="text-lg tracking-[0.3em] uppercase">
							{providerLabel}
						</div>
						<div
							className={`${isPortrait ? "text-5xl" : "text-6xl"} font-blockkie leading-none mt-2`}
						>
							{title}
						</div>
						<div className="text-xl mt-2">{subtitle}</div>
					</div>

					<div
						className={`border border-black rounded-xl px-4 py-3 ${isPortrait ? "w-full" : "min-w-[180px]"} flex flex-col`}
					>
						<span className="text-base uppercase tracking-[0.25em]">
							Time zone
						</span>
						<span className="text-2xl mt-1">{timeZone}</span>
						<span className="text-base mt-3">Updated {updatedAt}</span>
					</div>
				</div>

				<div className="flex-1 grid grid-cols-1 gap-3 py-4">
					{visibleEvents.map((event) => (
						<div
							key={event.id}
							className={`border border-black rounded-xl px-4 py-3 flex ${isPortrait ? "flex-col gap-2" : "flex-row items-center gap-4"} ${event.isToday ? "bg-black text-white" : "bg-white text-black"}`}
						>
							<div
								className={`${isPortrait ? "w-full border-b pb-2" : "w-[180px] border-r pr-4"} flex flex-col`}
							>
								<span className="text-base uppercase tracking-[0.2em]">
									{event.isToday ? "Today" : event.dayLabel}
								</span>
								<span className="text-2xl mt-1">{event.timeLabel}</span>
							</div>

							<div className="flex-1 flex flex-col">
								<span className="text-3xl leading-none">{event.summary}</span>
								{event.location && (
									<span className="text-lg mt-2">at {event.location}</span>
								)}
								{event.description && (
									<span className="text-base mt-2 leading-tight">
										{event.description}
									</span>
								)}
							</div>
						</div>
					))}
				</div>

				<div className="border-t border-black pt-3 flex justify-between items-center text-base">
					<span>{note || "Public ICS feeds work best for this import."}</span>
					<span>{visibleEvents.length} events shown</span>
				</div>
			</div>
		</PreSatori>
	);
}

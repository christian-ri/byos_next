import {
	clampText,
	getBitmapLayoutProfile,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { LpWeatherRecipeData } from "./getData";

export default function LpWeather({
	title,
	locationLabel,
	currentTemp,
	feelsLike,
	condition,
	windSpeed,
	precipitation,
	sunrise,
	sunset,
	updatedAt,
	note,
	days,
	width = 800,
	height = 480,
}: LpWeatherRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full flex-col border border-black bg-white"
				style={{ padding: profile.padding }}
			>
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div>
						<div className="font-blockkie leading-none text-[30px]">
							{title}
						</div>
						<div className="mt-2 font-geneva9 text-[16px]">
							{clampText(locationLabel, 34)}
						</div>
					</div>
					<div className="text-right font-geneva9 text-[14px]">
						<div>Updated {updatedAt}</div>
						<div className="mt-2">{condition}</div>
					</div>
				</div>

				<div className="flex flex-1 gap-4 py-4">
					<div className="flex flex-[0.95] flex-col rounded-2xl border border-black p-4">
						<div className="font-blockkie leading-none text-[72px]">
							{currentTemp}°
						</div>
						<div className="mt-3 font-geneva9 text-[18px]">
							Feels like {feelsLike}°
						</div>
						<div className="mt-6 grid grid-cols-2 gap-3 font-geneva9 text-[14px]">
							<div className="rounded-xl border border-black p-3">
								<div className="uppercase text-gray-500">Wind</div>
								<div className="mt-1">{windSpeed}</div>
							</div>
							<div className="rounded-xl border border-black p-3">
								<div className="uppercase text-gray-500">Precip</div>
								<div className="mt-1">{precipitation}</div>
							</div>
							<div className="rounded-xl border border-black p-3">
								<div className="uppercase text-gray-500">Sunrise</div>
								<div className="mt-1">{sunrise}</div>
							</div>
							<div className="rounded-xl border border-black p-3">
								<div className="uppercase text-gray-500">Sunset</div>
								<div className="mt-1">{sunset}</div>
							</div>
						</div>
					</div>

					<div className="grid flex-1 grid-cols-2 gap-3">
						{days.map((day) => (
							<div
								key={day.label}
								className="flex flex-col rounded-2xl border border-black p-4"
							>
								<div className="font-blockkie leading-none text-[24px]">
									{day.label}
								</div>
								<div className="mt-2 font-geneva9 text-[16px]">
									{day.condition}
								</div>
								<div className="mt-auto flex items-end justify-between pt-6">
									<span className="font-blockkie text-[28px]">{day.high}°</span>
									<span className="font-geneva9 text-[18px] text-gray-500">
										{day.low}°
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="border-t border-black pt-3 font-geneva9 text-[12px]">
					{clampText(note || "", profile.isDense ? 42 : 84)}
				</div>
			</div>
		</PreSatori>
	);
}

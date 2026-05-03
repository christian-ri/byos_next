import { PreSatori } from "@/utils/pre-satori";

export default function NotFoundScreen({
	slug,
	reason,
	detail,
	width = 800,
	height = 480,
}: {
	slug?: string;
	reason?: string;
	detail?: string;
	width?: number;
	height?: number;
}) {
	return (
		<PreSatori width={width} height={height}>
			<div className="w-full h-full p-6 bg-white flex flex-col items-center justify-center text-black">
				<div className="text-5xl text-center">Screen Not Found</div>
				{slug && (
					<div className="text-xl mt-4 text-center">
						Could not find screen: {slug}
					</div>
				)}
				{reason && (
					<div className="mt-8 w-full max-w-[720px] border-2 border-black px-4 py-3 text-center">
						<div className="text-lg font-bold">Last refresh failed</div>
						<div className="text-xl mt-2">{reason}</div>
					</div>
				)}
				{detail && (
					<div className="mt-4 max-w-[720px] text-base text-center leading-tight break-words">
						{detail}
					</div>
				)}
				<div className="text-xl mt-8 text-center">
					Check the BYOS device identity and refresh configuration.
				</div>
			</div>
		</PreSatori>
	);
}

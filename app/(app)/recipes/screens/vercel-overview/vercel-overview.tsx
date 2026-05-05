import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { VercelOverviewRecipeData } from "./getData";

function StatusPill({ label }: { label: string }) {
	const normalized = label.toUpperCase();
	const isReady = normalized === "READY";
	const isBuilding = normalized === "BUILDING" || normalized === "QUEUED";

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minWidth: 78,
				padding: "4px 10px",
				border: "1px solid #111",
				borderRadius: "999px",
				backgroundColor: isReady ? "#111" : isBuilding ? "#d1d5db" : "#fff",
				color: isReady ? "#fff" : "#111",
			}}
			className="font-geneva9"
		>
			<span style={{ fontSize: 12 }}>{normalized}</span>
		</div>
	);
}

export default function VercelOverview({
	title,
	accountLabel,
	updatedAt,
	projects,
	deployments,
	note,
	width = 800,
	height = 480,
}: VercelOverviewRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const leftWidth = profile.isCompact ? 296 : 312;
	const rightWidth = width - profile.padding * 2 - leftWidth - profile.gap;
	const rowTitleSize = scaleText(17, profile, {
		compactBase: 15,
		denseBase: 13,
		min: 12,
		max: 17,
	});

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				className="flex h-full w-full flex-col border border-black bg-[#f3f1ee]"
				style={{ padding: profile.padding }}
			>
				<div
					className="flex items-start justify-between border-b border-black"
					style={{ paddingBottom: 12 }}
				>
					<div>
						<div
							className="font-blockkie leading-none"
							style={{
								fontSize: scaleText(30, profile, {
									compactBase: 24,
									denseBase: 20,
									min: 18,
									max: 30,
								}),
							}}
						>
							{title}
						</div>
						<div
							className="mt-2 font-geneva9 text-[#4b5563]"
							style={{
								fontSize: scaleText(14, profile, {
									compactBase: 13,
									denseBase: 11,
									min: 10,
									max: 14,
								}),
							}}
						>
							{clampText(accountLabel, 28)}
						</div>
					</div>
					<div className="font-geneva9 text-[13px] text-[#4b5563]">
						Updated {updatedAt}
					</div>
				</div>

				<div
					className="flex flex-1"
					style={{ gap: profile.gap, paddingTop: 14, overflow: "hidden" }}
				>
					<div
						className="flex h-full flex-col rounded-2xl bg-white"
						style={{
							width: leftWidth,
							border: "1px solid #111",
							padding: 16,
							overflow: "hidden",
							flexShrink: 0,
						}}
					>
						<div className="font-blockkie text-[22px] leading-none">
							Projects
						</div>
						<div className="mt-4 flex flex-1 flex-col">
							{projects.map((project, index) => (
								<div
									key={project.name}
									className="flex items-center justify-between"
									style={{
										padding: "11px 0",
										gap: 10,
										borderBottom:
											index === projects.length - 1
												? "none"
												: "1px solid #e5e7eb",
									}}
								>
									<div
										className="font-blockkie leading-none"
										style={{
											fontSize: rowTitleSize,
											maxWidth: leftWidth - 122,
										}}
									>
										{clampText(project.name, 16)}
									</div>
									<StatusPill label={project.status} />
								</div>
							))}
						</div>
					</div>

					<div
						className="flex h-full flex-col rounded-2xl bg-white"
						style={{
							width: rightWidth,
							border: "1px solid #111",
							padding: 16,
							overflow: "hidden",
						}}
					>
						<div className="font-blockkie text-[22px] leading-none">
							Recent Deployments
						</div>
						<div className="mt-4 flex flex-1 flex-col">
							{deployments.map((deployment, index) => (
								<div
									key={`${deployment.name}-${deployment.target}-${index}`}
									className="flex items-center justify-between"
									style={{
										padding: "11px 0",
										gap: 10,
										borderBottom:
											index === deployments.length - 1
												? "none"
												: "1px solid #e5e7eb",
									}}
								>
									<div
										className="flex flex-col"
										style={{ maxWidth: rightWidth - 118, minWidth: 0 }}
									>
										<div
											className="font-blockkie leading-none"
											style={{ fontSize: rowTitleSize }}
										>
											{clampText(deployment.name, 16)}
										</div>
										<div
											className="mt-2 font-geneva9 text-[#4b5563]"
											style={{ fontSize: 11 }}
										>
											{clampText(deployment.target, 12)}
										</div>
									</div>
									<StatusPill label={deployment.state} />
								</div>
							))}
						</div>
					</div>
				</div>

				<div
					className="mt-3 border-t border-black pt-3 font-geneva9 text-[#4b5563]"
					style={{ fontSize: 10 }}
				>
					{clampText(note || "", 96)}
				</div>
			</div>
		</PreSatori>
	);
}

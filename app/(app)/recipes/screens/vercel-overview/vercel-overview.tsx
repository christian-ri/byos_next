import { PreSatori } from "@/utils/pre-satori";
import type { VercelOverviewRecipeData } from "./getData";

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
	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div className="flex h-full w-full flex-col border border-black bg-white p-6">
				<div className="flex items-start justify-between border-b border-black pb-4">
					<div>
						<div className="font-blockkie text-[30px] leading-none">
							{title}
						</div>
						<div className="mt-2 font-geneva9 text-[18px]">{accountLabel}</div>
					</div>
					<div className="font-geneva9 text-[14px]">Updated {updatedAt}</div>
				</div>

				<div className="flex flex-1 gap-4 py-4">
					<div className="flex flex-1 flex-col rounded-2xl border border-black p-4">
						<div className="font-blockkie text-[22px] leading-none">
							Projects
						</div>
						<div className="mt-4 flex flex-col gap-3">
							{projects.map((project) => (
								<div
									key={project.name}
									className="flex items-center justify-between border-b border-gray-100 pb-2"
								>
									<span className="font-geneva9 text-[16px]">
										{project.name}
									</span>
									<span className="font-blockkie text-[18px]">
										{project.status}
									</span>
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-1 flex-col rounded-2xl border border-black p-4">
						<div className="font-blockkie text-[22px] leading-none">
							Recent Deployments
						</div>
						<div className="mt-4 flex flex-col gap-3">
							{deployments.map((deployment) => (
								<div
									key={`${deployment.name}-${deployment.target}`}
									className="border-b border-gray-100 pb-2"
								>
									<div className="flex items-center justify-between">
										<span className="font-geneva9 text-[16px]">
											{deployment.name}
										</span>
										<span className="font-blockkie text-[18px]">
											{deployment.state}
										</span>
									</div>
									<div className="mt-1 font-geneva9 text-[12px] text-gray-500">
										{deployment.target}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="border-t border-black pt-3 font-geneva9 text-[12px]">
					{note}
				</div>
			</div>
		</PreSatori>
	);
}

import {
	BORDER_WIDTH,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { PreSatori } from "@/utils/pre-satori";
import type { VercelOverviewRecipeData } from "./getData";

type Metric = VercelOverviewRecipeData["metrics"][number];
type DeploymentRow = VercelOverviewRecipeData["latestDeployments"][number];
type ProductionRow = VercelOverviewRecipeData["currentProduction"][number];

function statusFill(status: VercelOverviewRecipeData["globalStatus"]) {
	if (status === "error") {
		return "#111";
	}
	if (status === "warning") {
		return "#888";
	}
	return "#fff";
}

function statusTextColor(status: string) {
	return status === "Error" || status === "Canceled" ? "#111" : "#555";
}

function VercelMark() {
	return (
		<svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
			<path d="M14 1 27 23H1L14 1Z" fill="#111" />
		</svg>
	);
}

function MetricCard({ metric }: { metric: Metric }) {
	return (
		<div
			style={{
				width: 118,
				height: 78,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 12,
				backgroundColor: "#fff",
				padding: 8,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<ReadableText
				size={18}
				weight={700}
				style={{ lineHeight: 1, letterSpacing: -0.2 }}
			>
				{metric.label}
			</ReadableText>
			<div
				className="font-blockkie"
				style={{ fontSize: 34, lineHeight: 0.9, marginTop: 4 }}
			>
				{metric.value}
			</div>
			{metric.secondary ? (
				<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
					{metric.secondary}
				</ReadableText>
			) : (
				<div />
			)}
		</div>
	);
}

function DeploymentsPanel({ rows }: { rows: DeploymentRow[] }) {
	return (
		<div
			style={{
				width: 474,
				height: 206,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 12,
				backgroundColor: "#fff",
				padding: 12,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<ReadableText size={24} weight={700} style={{ marginBottom: 8 }}>
				Latest Deployments
			</ReadableText>
			<div
				style={{
					display: "flex",
					paddingBottom: 6,
					borderBottom: "2px solid #111",
				}}
			>
				<ReadableText size={18} weight={700} style={{ width: 132 }}>
					Project
				</ReadableText>
				<ReadableText size={18} weight={700} style={{ width: 86 }}>
					Branch
				</ReadableText>
				<ReadableText size={18} weight={700} style={{ width: 104 }}>
					Status
				</ReadableText>
				<ReadableText size={18} weight={700} style={{ width: 64 }}>
					Time
				</ReadableText>
				<ReadableText size={18} weight={700} style={{ width: 56 }}>
					Dur.
				</ReadableText>
			</div>
			<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
				{rows.map((row, index) => (
					<div
						key={`${row.project}-${row.branch}-${row.time}-${index}`}
						style={{
							display: "flex",
							alignItems: "center",
							height: 24,
							borderBottom:
								index === rows.length - 1 ? "none" : "1px solid #bdbdbd",
						}}
					>
						<ReadableText
							size={18}
							weight={700}
							style={{ width: 132, lineHeight: 1 }}
						>
							{row.project}
						</ReadableText>
						<ReadableText size={18} style={{ width: 86, lineHeight: 1 }}>
							{row.branch}
						</ReadableText>
						<ReadableText
							size={18}
							style={{
								width: 104,
								lineHeight: 1,
								color: statusTextColor(row.status),
							}}
						>
							{row.status}
						</ReadableText>
						<ReadableText size={18} style={{ width: 64, lineHeight: 1 }}>
							{row.time}
						</ReadableText>
						<ReadableText size={18} style={{ width: 56, lineHeight: 1 }}>
							{row.duration}
						</ReadableText>
					</div>
				))}
			</div>
		</div>
	);
}

function ProductionPanel({ rows, note }: { rows: ProductionRow[]; note?: string }) {
	const visibleRows = rows.slice(0, 3);

	return (
		<div
			style={{
				width: 280,
				height: 206,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 12,
				backgroundColor: "#fff",
				padding: 12,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<ReadableText size={24} weight={700} style={{ marginBottom: 8 }}>
				Current Production
			</ReadableText>
			<div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
				{visibleRows.map((row, index) => (
					<div
						key={`${row.project}-${row.sha}-${index}`}
						style={{
							display: "flex",
							justifyContent: "space-between",
							gap: 10,
							paddingBottom: 6,
							borderBottom:
								index === visibleRows.length - 1 ? "none" : "1px solid #bdbdbd",
						}}
					>
						<div
							style={{
								width: 172,
								display: "flex",
								flexDirection: "column",
								gap: 3,
							}}
						>
							<ReadableText size={20} weight={700} style={{ lineHeight: 1 }}>
								{row.project}
							</ReadableText>
							<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
								{row.domain}
							</ReadableText>
						</div>
						<div
							style={{
								width: 70,
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
								gap: 3,
							}}
						>
							<ReadableText size={18} style={{ lineHeight: 1 }}>
								{row.age}
							</ReadableText>
							<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
								{row.sha}
							</ReadableText>
						</div>
					</div>
				))}
			</div>
			{note && visibleRows.length === 0 ? (
				<ReadableText size={16} color="#555" style={{ marginTop: 4, lineHeight: 1.1 }}>
					{note}
				</ReadableText>
			) : null}
		</div>
	);
}

function FooterMetric({ metric, showDivider }: { metric: Metric; showDivider: boolean }) {
	return (
		<div
			style={{
				width: 187,
				height: 46,
				paddingLeft: 12,
				paddingRight: 12,
				boxSizing: "border-box",
				borderRight: showDivider ? "2px solid #111" : "none",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				gap: 2,
			}}
		>
			<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
				{metric.label}
			</ReadableText>
			<div className="font-blockkie" style={{ fontSize: 24, lineHeight: 0.95 }}>
				{metric.value}
			</div>
		</div>
	);
}

export default function VercelOverview({
	title,
	currentTime,
	updatedAt,
	globalStatus,
	globalStatusLabel,
	metrics,
	latestDeployments,
	currentProduction,
	footer,
	note,
	width = 800,
	height = 480,
}: VercelOverviewRecipeData & { width?: number; height?: number }) {
	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f4f2ef",
					color: "#111",
					padding: 10,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: 8,
				}}
			>
				<div
					style={{
						height: 52,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						borderBottom: "2px solid #111",
						paddingBottom: 8,
					}}
				>
					<div style={{ width: 250, display: "flex", alignItems: "center", gap: 10 }}>
						<VercelMark />
						<SafeTitle size={28} style={{ lineHeight: 1 }}>
							{title}
						</SafeTitle>
					</div>

					<div
						style={{
							width: 200,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 4,
						}}
					>
						<div className="font-blockkie" style={{ fontSize: 32, lineHeight: 0.95 }}>
							{currentTime}
						</div>
						<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
							Last updated {updatedAt}
						</ReadableText>
					</div>

					<div
						style={{
							width: 240,
							display: "flex",
							justifyContent: "flex-end",
							alignItems: "center",
							gap: 10,
						}}
					>
						<div
							style={{
								width: 18,
								height: 18,
								borderRadius: 9,
								border: "2px solid #111",
								backgroundColor: statusFill(globalStatus),
							}}
						/>
						<ReadableText size={20} weight={700}>
							{globalStatusLabel}
						</ReadableText>
					</div>
				</div>

				<div style={{ display: "flex", gap: 10 }}>
					{metrics.map((metric) => (
						<MetricCard key={metric.label} metric={metric} />
					))}
				</div>

				<div style={{ display: "flex", gap: 12 }}>
					<DeploymentsPanel rows={latestDeployments} />
					<ProductionPanel rows={currentProduction} note={note} />
				</div>

				<div
					style={{
						height: 58,
						border: `${BORDER_WIDTH}px solid #111`,
						borderRadius: 12,
						backgroundColor: "#fff",
						display: "flex",
						alignItems: "center",
					}}
				>
					{footer.map((metric, index) => (
						<FooterMetric
							key={metric.label}
							metric={metric}
							showDivider={index < footer.length - 1}
						/>
					))}
				</div>

			</div>
		</PreSatori>
	);
}

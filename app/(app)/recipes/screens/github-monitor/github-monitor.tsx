import {
	BORDER_WIDTH,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { githubMonitorDisplayStrings } from "@/lib/github-monitor/service";
import type { GitHubMonitorData } from "@/lib/github-monitor/types";
import { PreSatori } from "@/utils/pre-satori";

function shorten(value: string, max: number) {
	return value.length > max
		? `${value.slice(0, Math.max(1, max - 3))}...`
		: value;
}

function compactReleaseLabel(value: string | null) {
	if (!value) {
		return "n/a";
	}
	const parts = value.trim().split(/\s+/);
	return shorten(parts[parts.length - 1] || value, 12);
}

function GitHubLogo() {
	return (
		<svg
			width="28"
			height="28"
			viewBox="0 0 1024 1024"
			aria-hidden="true"
			focusable="false"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
				transform="scale(64)"
				fill="#111"
			/>
		</svg>
	);
}

function metricCards(data: GitHubMonitorData) {
	return [
		{
			label: "REPOS",
			value: String(data.metrics.repositories),
			secondary: data.meta.owner,
		},
		{
			label: "PRS",
			value: String(data.metrics.openPullRequests),
			secondary: "offen",
		},
		{
			label: "ISSUES",
			value: String(data.metrics.openIssues),
			secondary: "offen",
		},
		{
			label: "ACTIONS",
			value:
				data.metrics.actionsSuccessRate7d === null
					? "n/a"
					: `${data.metrics.actionsSuccessRate7d}%`,
			secondary: "7 Tage",
		},
		{
			label: "SICHERHEIT",
			value:
				data.metrics.securityAlerts === null
					? "n/a"
					: String(data.metrics.securityAlerts),
			secondary:
				data.metrics.criticalSecurityAlerts === null
					? "n/a"
					: `${data.metrics.criticalSecurityAlerts} kritisch`,
		},
		{
			label: "LETZTER COMMIT",
			value: data.metrics.latestCommitAge || "n/a",
			secondary: "aktuell",
		},
	];
}

function statusFill(level: GitHubMonitorData["status"]["level"]) {
	if (level === "error") {
		return "#111";
	}
	if (level === "warning") {
		return "#777";
	}
	return "#fff";
}

function MetricCard({
	label,
	value,
	secondary,
}: {
	label: string;
	value: string;
	secondary: string;
}) {
	return (
		<div
			style={{
				width: 122,
				height: 92,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 6,
				backgroundColor: "#fff",
				padding: 10,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<ReadableText
				size={16}
				weight={700}
				uppercase={true}
				style={{ lineHeight: 1 }}
			>
				{label}
			</ReadableText>
			<div
				className="font-blockkie"
				style={{ fontSize: value.length > 6 ? 32 : 40, lineHeight: 0.9 }}
			>
				{value}
			</div>
			<ReadableText size={16} color="#444" style={{ lineHeight: 1 }}>
				{secondary}
			</ReadableText>
		</div>
	);
}

function WorkflowsPanel({ data }: { data: GitHubMonitorData }) {
	return (
		<div
			style={{
				width: 474,
				height: 204,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 6,
				backgroundColor: "#fff",
				padding: 10,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<ReadableText
				size={22}
				weight={700}
				uppercase={true}
				style={{ marginBottom: 8 }}
			>
				Aktuelle Workflows
			</ReadableText>
			<div
				style={{
					display: "flex",
					paddingBottom: 6,
					borderBottom: "2px solid #111",
				}}
			>
				<ReadableText size={16} weight={700} style={{ width: 106 }}>
					Repo
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 104 }}>
					Workflow
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 64 }}>
					Status
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 72 }}>
					Zweig
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 66 }}>
					Dauer
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 34 }}>
					Alt
				</ReadableText>
			</div>
			<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
				{data.workflowRuns.slice(0, 5).map((run, index) => (
					<div
						key={`${run.repository}-${run.workflow}-${index}`}
						style={{
							display: "flex",
							alignItems: "center",
							height: 24,
							borderBottom:
								index === Math.min(data.workflowRuns.length, 5) - 1
									? "none"
									: "1px solid #bdbdbd",
						}}
					>
						<ReadableText
							size={18}
							weight={700}
							style={{ width: 106, lineHeight: 1 }}
						>
							{shorten(run.repository, 12)}
						</ReadableText>
						<ReadableText size={18} style={{ width: 104, lineHeight: 1 }}>
							{shorten(run.workflow, 12)}
						</ReadableText>
						<ReadableText size={18} style={{ width: 64, lineHeight: 1 }}>
							{run.status}
						</ReadableText>
						<ReadableText size={18} style={{ width: 72, lineHeight: 1 }}>
							{run.branch}
						</ReadableText>
						<ReadableText size={18} style={{ width: 66, lineHeight: 1 }}>
							{run.duration || "n/a"}
						</ReadableText>
						<ReadableText size={18} style={{ width: 34, lineHeight: 1 }}>
							{run.age}
						</ReadableText>
					</div>
				))}
			</div>
		</div>
	);
}

function RepoHealthPanel({ data }: { data: GitHubMonitorData }) {
	return (
		<div
			style={{
				width: 290,
				height: 204,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 6,
				backgroundColor: "#fff",
				padding: 10,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<ReadableText
				size={22}
				weight={700}
				uppercase={true}
				style={{ marginBottom: 8 }}
			>
				Repo Health
			</ReadableText>
			<div
				style={{
					display: "flex",
					paddingBottom: 6,
					borderBottom: "2px solid #111",
				}}
			>
				<ReadableText size={16} weight={700} style={{ width: 116 }}>
					Repo
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 28 }}>
					PR
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 34 }}>
					Iss
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 44 }}>
					Last
				</ReadableText>
				<ReadableText size={16} weight={700} style={{ width: 36 }}>
					Stat
				</ReadableText>
			</div>
			<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
				{data.repositoryHealth.slice(0, 6).map((repo, index) => (
					<div
						key={`${repo.repository}-${index}`}
						style={{
							display: "flex",
							alignItems: "center",
							height: 20,
							borderBottom:
								index === Math.min(data.repositoryHealth.length, 6) - 1
									? "none"
									: "1px solid #bdbdbd",
						}}
					>
						<ReadableText
							size={18}
							weight={700}
							style={{ width: 116, lineHeight: 1 }}
						>
							{shorten(repo.repository, 12)}
						</ReadableText>
						<ReadableText size={18} style={{ width: 28, lineHeight: 1 }}>
							{String(repo.openPullRequests)}
						</ReadableText>
						<ReadableText size={18} style={{ width: 34, lineHeight: 1 }}>
							{String(repo.openIssues)}
						</ReadableText>
						<ReadableText size={18} style={{ width: 44, lineHeight: 1 }}>
							{repo.latestCommitAge || "n/a"}
						</ReadableText>
						<ReadableText size={18} style={{ width: 36, lineHeight: 1 }}>
							{repo.status}
						</ReadableText>
					</div>
				))}
			</div>
		</div>
	);
}

function FooterCard({
	label,
	value,
	secondary,
	width,
}: {
	label: string;
	value: string;
	secondary: string;
	width: number;
}) {
	return (
		<div
			style={{
				width,
				height: 78,
				border: `${BORDER_WIDTH}px solid #111`,
				borderRadius: 6,
				backgroundColor: "#fff",
				padding: 10,
				boxSizing: "border-box",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
			}}
		>
			<ReadableText
				size={16}
				weight={700}
				uppercase={true}
				style={{ lineHeight: 1 }}
			>
				{label}
			</ReadableText>
			<div className="font-blockkie" style={{ fontSize: 34, lineHeight: 0.9 }}>
				{value}
			</div>
			<ReadableText size={16} color="#444" style={{ lineHeight: 1 }}>
				{secondary}
			</ReadableText>
		</div>
	);
}

export default function GitHubMonitor({
	width = 800,
	height = 480,
	...data
}: GitHubMonitorData & { width?: number; height?: number }) {
	const display = githubMonitorDisplayStrings(data, data.meta.timezone);
	const kpis = metricCards(data);
	const footerCards = [
		{
			label: "AKTIVE BRANCHES",
			value:
				data.footer.activeBranches === null
					? "n/a"
					: String(data.footer.activeBranches),
			secondary: data.meta.selectedRepositories.length > 1 ? "gesamt" : "repo",
		},
		{
			label: "RELEASES",
			value: String(data.footer.releases30d),
			secondary: compactReleaseLabel(data.footer.latestRelease),
		},
		{
			label: "MITARBEITER",
			value:
				data.footer.contributors === null
					? "n/a"
					: String(data.footer.contributors),
			secondary: data.meta.owner,
		},
		{
			label: "COMMITS",
			value:
				data.footer.commits7d === null ? "n/a" : String(data.footer.commits7d),
			secondary: "7 Tage",
		},
		{
			label: "SECRETS",
			value:
				data.footer.secretScanningAlerts === null
					? "n/a"
					: String(data.footer.secretScanningAlerts),
			secondary: data.status.label,
		},
	];

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f4f2ef",
					color: "#111",
					padding: 14,
					boxSizing: "border-box",
					display: "flex",
					flexDirection: "column",
					gap: 8,
				}}
			>
				<div
					style={{
						height: 54,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						borderBottom: "2px solid #111",
						paddingBottom: 8,
					}}
				>
					<div
						style={{
							width: 230,
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<GitHubLogo />
						<SafeTitle size={34} style={{ lineHeight: 1 }}>
							GitHub
						</SafeTitle>
					</div>

					<div
						style={{
							width: 240,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
						}}
					>
						<div
							className="font-blockkie"
							style={{ fontSize: 36, lineHeight: 0.95 }}
						>
							{display.currentTime}
						</div>
						<ReadableText size={18} color="#444" style={{ lineHeight: 1 }}>
							{display.updatedLabel}
						</ReadableText>
					</div>

					<div
						style={{
							width: 230,
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
								backgroundColor: statusFill(data.status.level),
							}}
						/>
						<ReadableText size={20} weight={700} style={{ lineHeight: 1 }}>
							{data.status.label}
						</ReadableText>
					</div>
				</div>

				<div style={{ display: "flex", gap: 8 }}>
					{kpis.map((card) => (
						<MetricCard
							key={card.label}
							label={card.label}
							value={card.value}
							secondary={card.secondary}
						/>
					))}
				</div>

				<div style={{ display: "flex", gap: 8 }}>
					<WorkflowsPanel data={data} />
					<RepoHealthPanel data={data} />
				</div>

				<div style={{ display: "flex", gap: 8 }}>
					{footerCards.map((card, index) => (
						<FooterCard
							key={card.label}
							label={card.label}
							value={card.value}
							secondary={card.secondary}
							width={index === footerCards.length - 1 ? 148 : 149}
						/>
					))}
				</div>
			</div>
		</PreSatori>
	);
}

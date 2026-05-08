import {
	fetchJsonWithTimeout,
	formatDateTime,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type VercelParams = {
	apiToken?: string;
	teamId?: string;
};

type VercelProject = {
	id?: string;
	name?: string;
};

type VercelProjectsResponse =
	| VercelProject[]
	| {
			projects?: VercelProject[];
	  };

type VercelDeployment = {
	uid?: string;
	name?: string;
	state?: string;
	readyState?: string;
	target?: string;
	createdAt?: number;
	buildingAt?: number;
	ready?: number;
	url?: string;
	alias?: string[];
	meta?: {
		githubCommitRef?: string;
		githubCommitSha?: string;
		githubCommitAuthorName?: string;
	};
};

type VercelDeploymentsResponse = {
	deployments?: VercelDeployment[];
};

type DashboardMetric = {
	label: string;
	value: string;
	secondary?: string;
};

type DashboardDeployment = {
	project: string;
	branch: string;
	status: string;
	time: string;
	duration: string;
};

type DashboardProduction = {
	project: string;
	domain: string;
	age: string;
	sha: string;
	status: string;
};

export type VercelOverviewRecipeData = {
	title: string;
	currentTime: string;
	updatedAt: string;
	globalStatus: "ok" | "warning" | "error";
	globalStatusLabel: string;
	metrics: DashboardMetric[];
	latestDeployments: DashboardDeployment[];
	currentProduction: DashboardProduction[];
	footer: DashboardMetric[];
	note?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_PRODUCTION_MS = 14 * DAY_MS;
const ACTIVE_STATES = new Set(["BUILDING", "QUEUED", "INITIALIZING"]);
const FAILURE_STATES = new Set(["ERROR", "CANCELED"]);

function extractProjects(response: VercelProjectsResponse): VercelProject[] {
	if (Array.isArray(response)) {
		return response;
	}

	return Array.isArray(response.projects) ? response.projects : [];
}

function normalizeState(deployment: VercelDeployment) {
	return String(
		deployment.readyState || deployment.state || "UNKNOWN",
	).toUpperCase();
}

function appendTeamId(url: string, teamId?: string) {
	if (!teamId) {
		return url;
	}
	const join = url.includes("?") ? "&" : "?";
	return `${url}${join}teamId=${encodeURIComponent(teamId)}`;
}

function formatClock(value: Date) {
	return formatDateTime(
		value,
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		"America/New_York",
	);
}

function formatShortTime(timestamp?: number) {
	if (!timestamp) {
		return "n/a";
	}
	return formatDateTime(
		new Date(timestamp),
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		"America/New_York",
	);
}

function formatAge(timestamp?: number, now = Date.now()) {
	if (!timestamp) {
		return "n/a";
	}
	const diff = Math.max(0, now - timestamp);
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 48) {
		return `${hours}h ago`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function formatDuration(durationMs?: number) {
	if (!durationMs || durationMs <= 0) {
		return "n/a";
	}
	const totalSeconds = Math.round(durationMs / 1000);
	if (totalSeconds < 60) {
		return `${totalSeconds}s`;
	}
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes < 10 && seconds > 0) {
		return `${minutes}m ${seconds}s`;
	}
	return `${minutes}m`;
}

function computeDurationMs(deployment: VercelDeployment) {
	const readyAt = deployment.ready;
	const startAt = deployment.buildingAt || deployment.createdAt;
	if (!readyAt || !startAt || readyAt <= startAt) {
		return undefined;
	}
	return readyAt - startAt;
}

function median(values: number[]) {
	if (values.length === 0) {
		return 0;
	}
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) {
		return sorted[middle];
	}
	return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function statusTone(status: string) {
	if (status === "READY") {
		return "Ready";
	}
	if (FAILURE_STATES.has(status)) {
		return status === "CANCELED" ? "Canceled" : "Error";
	}
	if (ACTIVE_STATES.has(status)) {
		return "Building";
	}
	return status.charAt(0) + status.slice(1).toLowerCase();
}

function shortSha(value?: string) {
	if (!value) {
		return "no sha";
	}
	return value.slice(0, 7);
}

function pickDomain(deployment: VercelDeployment) {
	const alias = Array.isArray(deployment.alias)
		? deployment.alias.find(Boolean)
		: undefined;
	if (alias) {
		return alias;
	}
	if (deployment.url) {
		return deployment.url.replace(/^https?:\/\//, "");
	}
	return "preview.vercel.app";
}

function buildFallback(note?: string): VercelOverviewRecipeData {
	const now = new Date();
	return {
		title: "Vercel Dashboard",
		currentTime: formatClock(now),
		updatedAt: formatUpdatedAt(now, "America/New_York"),
		globalStatus: "warning",
		globalStatusLabel: "Attention Needed",
		metrics: [
			{ label: "Projects", value: "7" },
			{ label: "Deploys 24h", value: "18" },
			{ label: "OK 24h", value: "17", secondary: "94%" },
			{ label: "Failed 24h", value: "1", secondary: "6%" },
			{ label: "Median Build", value: "26s" },
			{ label: "Active Builds", value: "3" },
		],
		latestDeployments: [
			{
				project: "portfolio",
				branch: "main",
				status: "Ready",
				time: "12:40",
				duration: "18s",
			},
			{
				project: "landing-page",
				branch: "main",
				status: "Ready",
				time: "11:52",
				duration: "22s",
			},
			{
				project: "blog",
				branch: "main",
				status: "Ready",
				time: "10:31",
				duration: "24s",
			},
			{
				project: "api",
				branch: "main",
				status: "Error",
				time: "09:12",
				duration: "31s",
			},
			{
				project: "dashboard",
				branch: "develop",
				status: "Ready",
				time: "08:47",
				duration: "17s",
			},
		],
		currentProduction: [
			{
				project: "portfolio",
				domain: "portfolio.christian.dev",
				age: "2h ago",
				sha: "a1b2c3d",
				status: "Ready",
			},
			{
				project: "landing-page",
				domain: "landing.christian.dev",
				age: "5h ago",
				sha: "d4e5f6g",
				status: "Ready",
			},
			{
				project: "api",
				domain: "api.christian.dev",
				age: "3h ago",
				sha: "h7i8j9k",
				status: "Error",
			},
			{
				project: "dashboard",
				domain: "dashboard.vercel.app",
				age: "1d ago",
				sha: "l0m1n2o",
				status: "Ready",
			},
		],
		footer: [
			{ label: "Latest Deploy", value: "12:40" },
			{ label: "Active Builds", value: "3" },
			{ label: "Production Healthy", value: "3" },
			{ label: "Stale Projects", value: "1" },
		],
		note,
	};
}

export default async function getData(
	params?: VercelParams,
): Promise<VercelOverviewRecipeData> {
	const apiToken =
		String(params?.apiToken || "").trim() ||
		String(process.env.VERCEL_TOKEN || "").trim();
	if (!apiToken) {
		return buildFallback(
			"Set VERCEL_TOKEN or add a recipe token to replace demo dashboard data.",
		);
	}

	const teamId =
		String(params?.teamId || "").trim() ||
		String(process.env.VERCEL_TEAM_ID || "").trim();
	const headers = {
		Accept: "application/json",
		Authorization: `Bearer ${apiToken}`,
	};

	try {
		const [projectsResponse, deploymentsResponse] = await Promise.all([
			fetchJsonWithTimeout<VercelProjectsResponse>(
				appendTeamId("https://api.vercel.com/v9/projects", teamId),
				{ headers },
				12000,
			),
			fetchJsonWithTimeout<VercelDeploymentsResponse>(
				appendTeamId("https://api.vercel.com/v6/deployments?limit=100", teamId),
				{ headers },
				12000,
			),
		]);

		const now = Date.now();
		const projects = extractProjects(projectsResponse);
		const deployments = Array.isArray(deploymentsResponse.deployments)
			? deploymentsResponse.deployments
			: [];
		const sortedDeployments = [...deployments].sort(
			(a, b) => (b.createdAt || 0) - (a.createdAt || 0),
		);
		const recentDeployments = sortedDeployments.filter(
			(deployment) => now - (deployment.createdAt || 0) <= DAY_MS,
		);
		const successful24h = recentDeployments.filter(
			(deployment) => normalizeState(deployment) === "READY",
		);
		const failed24h = recentDeployments.filter((deployment) =>
			FAILURE_STATES.has(normalizeState(deployment)),
		);
		const activeBuilds = deployments.filter((deployment) =>
			ACTIVE_STATES.has(normalizeState(deployment)),
		);
		const durations = deployments
			.map((deployment) => computeDurationMs(deployment))
			.filter((value): value is number => typeof value === "number");
		const medianDurationMs = median(durations);
		const successRate =
			recentDeployments.length > 0
				? Math.round((successful24h.length / recentDeployments.length) * 100)
				: 0;

		const productionMap = new Map<string, VercelDeployment>();
		for (const deployment of sortedDeployments) {
			if (deployment.target !== "production") {
				continue;
			}
			const projectName = deployment.name || deployment.uid;
			if (!projectName || productionMap.has(projectName)) {
				continue;
			}
			productionMap.set(projectName, deployment);
		}

		const currentProductionAll = [...productionMap.values()];
		const staleProduction = currentProductionAll.filter(
			(deployment) => now - (deployment.createdAt || 0) > STALE_PRODUCTION_MS,
		);
		const latestProductionFailed = currentProductionAll.some((deployment) =>
			FAILURE_STATES.has(normalizeState(deployment)),
		);
		const healthyProductionCount = currentProductionAll.filter(
			(deployment) => normalizeState(deployment) === "READY",
		).length;
		const globalStatus: "ok" | "warning" | "error" = latestProductionFailed
			? "error"
			: failed24h.length > 0 || activeBuilds.length > 0
				? "warning"
				: "ok";

		const latestDeployments = sortedDeployments
			.slice(0, 5)
			.map((deployment) => ({
				project: deployment.name || "deployment",
				branch: deployment.meta?.githubCommitRef || "production",
				status: statusTone(normalizeState(deployment)),
				time: formatShortTime(deployment.createdAt),
				duration: formatDuration(computeDurationMs(deployment)),
			}));

		const currentProduction = currentProductionAll
			.slice(0, 5)
			.map((deployment) => ({
				project: deployment.name || "project",
				domain: pickDomain(deployment),
				age: formatAge(deployment.createdAt, now),
				sha: shortSha(deployment.meta?.githubCommitSha),
				status: statusTone(normalizeState(deployment)),
			}));

		const latestDeployTime = sortedDeployments[0]?.createdAt
			? formatShortTime(sortedDeployments[0].createdAt)
			: "n/a";

		return {
			title: "Vercel Dashboard",
			currentTime: formatClock(new Date(now)),
			updatedAt: formatUpdatedAt(new Date(now), "America/New_York"),
			globalStatus,
			globalStatusLabel:
				globalStatus === "ok"
					? "All Systems OK"
					: globalStatus === "warning"
						? "Attention Needed"
						: "Production Failure",
			metrics: [
				{ label: "Projects", value: String(projects.length) },
				{ label: "Deploys 24h", value: String(recentDeployments.length) },
				{
					label: "OK 24h",
					value: String(successful24h.length),
					secondary: `${successRate}%`,
				},
				{
					label: "Failed 24h",
					value: String(failed24h.length),
					secondary: `${Math.max(0, 100 - successRate)}%`,
				},
				{ label: "Median Build", value: formatDuration(medianDurationMs) },
				{ label: "Active Builds", value: String(activeBuilds.length) },
			],
			latestDeployments,
			currentProduction,
			footer: [
				{ label: "Latest Deploy", value: latestDeployTime },
				{ label: "Active Builds", value: String(activeBuilds.length) },
				{
					label: "Production Healthy",
					value: String(healthyProductionCount),
				},
				{ label: "Stale Projects", value: String(staleProduction.length) },
			],
			note:
				currentProduction.length === 0
					? "No production deployments found in the latest Vercel deployment history."
					: undefined,
		};
	} catch (error) {
		console.error("Error loading Vercel dashboard data:", error);
		return buildFallback(
			"Live Vercel fetch failed, so this preview is showing stable demo dashboard data.",
		);
	}
}

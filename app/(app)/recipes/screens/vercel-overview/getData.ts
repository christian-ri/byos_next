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

type BillingChargeRecord = Record<string, unknown>;

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
	usageLabel: string;
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
const BILLING_RANGE_DAYS = 30;

const USAGE_TARGETS = [
	{
		label: "Fluid Active CPU",
		aliases: ["fluid active cpu", "active cpu"],
	},
	{
		label: "Function Invocations",
		aliases: ["function invocations", "invocations"],
	},
	{
		label: "Edge Requests",
		aliases: ["edge requests", "edge request"],
	},
	{
		label: "Fast Origin Transfer",
		aliases: ["fast origin transfer"],
	},
] as const;

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

function appendTeamQuery(
	url: string,
	options: { teamId?: string; teamSlug?: string } = {},
) {
	const withTeamId = appendTeamId(url, options.teamId);
	if (!options.teamSlug) {
		return withTeamId;
	}
	const join = withTeamId.includes("?") ? "&" : "?";
	return `${withTeamId}${join}slug=${encodeURIComponent(options.teamSlug)}`;
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

function formatIsoDate(value: Date) {
	return value.toISOString();
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

function formatCompactCount(value: number) {
	if (!Number.isFinite(value)) {
		return "n/a";
	}
	if (value >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`;
	}
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`;
	}
	return String(Math.round(value));
}

function formatBytes(value: number) {
	if (!Number.isFinite(value)) {
		return "n/a";
	}
	if (value >= 1024 ** 3) {
		return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
	}
	if (value >= 1024 ** 2) {
		return `${(value / 1024 ** 2).toFixed(value >= 10 * 1024 ** 2 ? 0 : 1)} MB`;
	}
	if (value >= 1024) {
		return `${Math.round(value / 1024)} KB`;
	}
	return `${Math.round(value)} B`;
}

function formatHoursMinutes(totalMinutes: number) {
	if (!Number.isFinite(totalMinutes)) {
		return "n/a";
	}
	const hours = Math.floor(totalMinutes / 60);
	const minutes = Math.round(totalMinutes % 60);
	if (hours <= 0) {
		return `${minutes}m`;
	}
	return `${hours}h ${minutes}m`;
}

function normalizeMetricName(value: string) {
	return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function flattenStrings(input: unknown, target: string[] = []): string[] {
	if (typeof input === "string") {
		target.push(input);
		return target;
	}
	if (Array.isArray(input)) {
		for (const item of input) {
			flattenStrings(item, target);
		}
		return target;
	}
	if (input && typeof input === "object") {
		for (const value of Object.values(input)) {
			flattenStrings(value, target);
		}
	}
	return target;
}

function deepFindNumber(input: unknown, keys: string[]): number | undefined {
	if (!input || typeof input !== "object") {
		return undefined;
	}

	for (const [key, value] of Object.entries(input)) {
		const normalized = key.toLowerCase();
		if (keys.some((candidate) => normalized.includes(candidate))) {
			if (typeof value === "number" && Number.isFinite(value)) {
				return value;
			}
			if (typeof value === "string") {
				const parsed = Number(value.replace(/,/g, ""));
				if (Number.isFinite(parsed)) {
					return parsed;
				}
			}
		}

		if (value && typeof value === "object") {
			const nested = deepFindNumber(value, keys);
			if (typeof nested === "number") {
				return nested;
			}
		}
	}

	return undefined;
}

function deepFindString(input: unknown, keys: string[]): string | undefined {
	if (!input || typeof input !== "object") {
		return undefined;
	}

	for (const [key, value] of Object.entries(input)) {
		const normalized = key.toLowerCase();
		if (keys.some((candidate) => normalized.includes(candidate))) {
			if (typeof value === "string" && value.trim()) {
				return value.trim();
			}
		}

		if (value && typeof value === "object") {
			const nested = deepFindString(value, keys);
			if (nested) {
				return nested;
			}
		}
	}

	return undefined;
}

function metricMatches(row: BillingChargeRecord, aliases: readonly string[]) {
	const haystack = flattenStrings(row)
		.map((entry) => normalizeMetricName(entry))
		.join(" ");
	return aliases.some((alias) => haystack.includes(normalizeMetricName(alias)));
}

function extractUsageQuantity(row: BillingChargeRecord) {
	return (
		deepFindNumber(row, [
			"consumedquantity",
			"usagequantity",
			"billedquantity",
			"quantity",
			"effectivequantity",
			"amount",
		]) ?? 0
	);
}

function extractLimitQuantity(row: BillingChargeRecord) {
	return deepFindNumber(row, [
		"limit",
		"quota",
		"includedquantity",
		"planquantity",
		"pricingquantity",
		"commitmentquantity",
	]);
}

function extractUsageUnit(row: BillingChargeRecord) {
	return (
		deepFindString(row, ["usageunit", "pricingunit", "meterunit", "unit"]) || ""
	);
}

function formatUsageMetric(
	label: string,
	used: number,
	limit: number | undefined,
	unit: string,
): DashboardMetric {
	const normalizedUnit = unit.toLowerCase();

	const formatQuantity = (value: number) => {
		if (label === "Fluid Active CPU") {
			const minutes =
				normalizedUnit.includes("millisecond") || normalizedUnit === "ms"
					? value / 1000 / 60
					: normalizedUnit.includes("second") || normalizedUnit === "s"
						? value / 60
						: normalizedUnit.includes("minute")
							? value
							: normalizedUnit.includes("hour") || normalizedUnit === "h"
								? value * 60
								: value < 100
									? value * 60
									: value / 1000 / 60;
			return formatHoursMinutes(minutes);
		}

		if (label === "Fast Origin Transfer") {
			const bytes = normalizedUnit.includes("gb")
				? value * 1024 ** 3
				: normalizedUnit.includes("mb")
					? value * 1024 ** 2
					: normalizedUnit.includes("kb")
						? value * 1024
						: normalizedUnit.includes("byte") || normalizedUnit === "b"
							? value
							: value > 10_000
								? value
								: value * 1024 ** 2;
			return formatBytes(bytes);
		}

		return formatCompactCount(value);
	};

	return {
		label,
		value: formatQuantity(used),
		secondary:
			typeof limit === "number" && Number.isFinite(limit) && limit > 0
				? `${formatQuantity(used)} / ${formatQuantity(limit)}`
				: "Last 30 days",
	};
}

async function fetchUsageMetrics(
	headers: Record<string, string>,
	options: { teamId?: string; teamSlug?: string },
) {
	const to = new Date();
	const from = new Date(to.getTime() - BILLING_RANGE_DAYS * DAY_MS);
	const usageUrl = appendTeamQuery(
		`https://api.vercel.com/v1/billing/charges?from=${encodeURIComponent(
			formatIsoDate(from),
		)}&to=${encodeURIComponent(formatIsoDate(to))}`,
		options,
	);

	const response = await fetch(usageUrl, {
		headers: {
			...headers,
			"Accept-Encoding": "gzip",
		},
		next: { revalidate: 0 },
	});

	if (!response.ok) {
		throw new Error(
			`Usage API responded with status: ${response.status} (${response.statusText})`,
		);
	}

	const rawText = await response.text();
	const rows = rawText
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line) as BillingChargeRecord);

	return USAGE_TARGETS.map((target) => {
		const matches = rows.filter((row) => metricMatches(row, target.aliases));
		const used = matches.reduce(
			(total, row) => total + extractUsageQuantity(row),
			0,
		);
		const limitCandidate = matches
			.map((row) => extractLimitQuantity(row))
			.find((value): value is number => typeof value === "number" && value > 0);
		const unitCandidate =
			matches
				.map((row) => extractUsageUnit(row))
				.find((value) => value.trim().length > 0) || "";

		return used > 0 || typeof limitCandidate === "number"
			? formatUsageMetric(target.label, used, limitCandidate, unitCandidate)
			: null;
	}).filter((metric): metric is DashboardMetric => metric !== null);
}

function computeDurationMs(deployment: VercelDeployment) {
	const readyAt = deployment.ready;
	const startAt = deployment.buildingAt || deployment.createdAt;
	if (!readyAt || !startAt || readyAt <= startAt) {
		return undefined;
	}
	return readyAt - startAt;
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
		usageLabel: "Usage · Last 30 days",
		currentTime: formatClock(now),
		updatedAt: formatUpdatedAt(now, "America/New_York"),
		globalStatus: "warning",
		globalStatusLabel: "Attention Needed",
		metrics: [
			{ label: "Fluid Active CPU", value: "3h 11m", secondary: "3h 11m / 4h" },
			{
				label: "Function Invocations",
				value: "126K",
				secondary: "126K / 1M",
			},
			{ label: "Edge Requests", value: "108K", secondary: "108K / 1M" },
			{
				label: "Fast Origin Transfer",
				value: "651 MB",
				secondary: "651 MB / 10 GB",
			},
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
	const teamSlug = String(process.env.VERCEL_TEAM_SLUG || "").trim();
	const headers = {
		Accept: "application/json",
		Authorization: `Bearer ${apiToken}`,
	};

	try {
		const [projectsResponse, deploymentsResponse, usageMetrics] =
			await Promise.all([
				fetchJsonWithTimeout<VercelProjectsResponse>(
					appendTeamId("https://api.vercel.com/v9/projects", teamId),
					{ headers },
					12000,
				),
				fetchJsonWithTimeout<VercelDeploymentsResponse>(
					appendTeamId(
						"https://api.vercel.com/v6/deployments?limit=100",
						teamId,
					),
					{ headers },
					12000,
				),
				fetchUsageMetrics(headers, { teamId, teamSlug }).catch((error) => {
					console.warn(
						"Usage metric fetch failed, keeping deployment KPIs:",
						error,
					);
					return [];
				}),
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
			usageLabel: "Usage · Last 30 days",
			currentTime: formatClock(new Date(now)),
			updatedAt: formatUpdatedAt(new Date(now), "America/New_York"),
			globalStatus,
			globalStatusLabel:
				globalStatus === "ok"
					? "All Systems OK"
					: globalStatus === "warning"
						? "Attention Needed"
						: "Production Failure",
			metrics:
				usageMetrics.length > 0
					? usageMetrics
					: [
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

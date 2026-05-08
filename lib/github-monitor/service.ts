import { formatDateTime } from "@/app/(app)/recipes/screens/_shared/fetch-utils";
import { buildGitHubMonitorMockData } from "./mock-data";
import type {
	GitHubCommit,
	GitHubIssue,
	GitHubMonitorData,
	GitHubMonitorParams,
	GitHubPullRequest,
	GitHubRelease,
	GitHubRepository,
	GitHubSecurityAlert,
	GitHubWorkflowRun,
	GitHubWorkflowRunsResponse,
} from "./types";

const CACHE_TTL_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CRITICAL_SEVERITIES = new Set(["critical", "high"]);

type RepoBundle = {
	repository: GitHubRepository;
	pulls: GitHubPullRequest[];
	issues: GitHubIssue[];
	workflowRuns: GitHubWorkflowRun[];
	commits: GitHubCommit[];
	commits7d: GitHubCommit[] | null;
	releases: GitHubRelease[];
	security: {
		dependabot: number | null;
		secretScanning: number | null;
		codeScanning: number | null;
		critical: number | null;
	};
};

type CachedEntry = {
	timestamp: number;
	data: GitHubMonitorData;
};

type ApiResult<T> = {
	ok: boolean;
	status: number;
	data: T | null;
	rateLimited: boolean;
};

const cache = new Map<string, CachedEntry>();

function parseBoolean(
	value: boolean | string | undefined,
	defaultValue: boolean,
) {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (["1", "true", "yes", "on"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no", "off"].includes(normalized)) {
			return false;
		}
	}
	return defaultValue;
}

function clampNumber(
	value: number | string | undefined,
	defaultValue: number,
	min: number,
	max: number,
) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return defaultValue;
	}
	return Math.max(min, Math.min(max, Math.round(parsed)));
}

function parseRepositoryList(value?: string) {
	return String(value || "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function cacheKey(
	params: Required<Pick<GitHubMonitorParams, "owner">> & {
		repositories: string[];
		includePrivateRepos: boolean;
		staleDays: number;
		timezone: string;
		maxRepos: number;
		maxWorkflowRuns: number;
	},
) {
	return JSON.stringify(params);
}

function formatShortTime(value: Date, timezone: string) {
	return formatDateTime(
		value,
		{
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		},
		timezone,
	);
}

function buildTimeMeta(timestamp: number, timezone: string) {
	const currentTime = formatShortTime(new Date(timestamp), timezone);
	return {
		currentTime,
		updatedLabel: `Update: ${currentTime}`,
	};
}

function hoursSince(dateString?: string, now = Date.now()) {
	if (!dateString) {
		return Number.POSITIVE_INFINITY;
	}
	return (now - new Date(dateString).getTime()) / (60 * 60 * 1000);
}

function relativeAge(dateString?: string, now = Date.now()) {
	if (!dateString) {
		return null;
	}
	const diff = Math.max(0, now - new Date(dateString).getTime());
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) {
		return `${minutes}m`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 48) {
		return `${hours}h`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

function formatDurationMs(durationMs?: number | null) {
	if (!durationMs || durationMs <= 0) {
		return null;
	}
	const seconds = Math.round(durationMs / 1000);
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remaining = seconds % 60;
	return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function workflowStatus(run: GitHubWorkflowRun) {
	const conclusion = String(run.conclusion || "").toLowerCase();
	const status = String(run.status || "").toLowerCase();
	if (conclusion === "success") {
		return "OK" as const;
	}
	if (conclusion === "failure" || conclusion === "timed_out") {
		return "FAIL" as const;
	}
	if (conclusion === "cancelled") {
		return "CANCEL" as const;
	}
	if (status === "in_progress") {
		return "RUN" as const;
	}
	if (status === "queued") {
		return "QUEUE" as const;
	}
	return "UNKNOWN" as const;
}

function workflowDuration(run: GitHubWorkflowRun) {
	const start = run.run_started_at || run.created_at;
	const end = run.updated_at;
	if (!start || !end) {
		return null;
	}
	const duration = new Date(end).getTime() - new Date(start).getTime();
	return formatDurationMs(duration);
}

function pickLatestCommit(commits: GitHubCommit[]) {
	return commits[0];
}

function latestWorkflowForDefaultBranch(
	defaultBranch: string | undefined,
	runs: GitHubWorkflowRun[],
) {
	if (!defaultBranch) {
		return undefined;
	}
	return [...runs]
		.filter((run) => run.head_branch === defaultBranch)
		.sort(
			(a, b) =>
				new Date(b.run_started_at || b.created_at || 0).getTime() -
				new Date(a.run_started_at || a.created_at || 0).getTime(),
		)[0];
}

function isCriticalAlert(alert: GitHubSecurityAlert) {
	const severity = String(
		alert.security_advisory?.severity || alert.rule?.severity || "",
	).toLowerCase();
	return CRITICAL_SEVERITIES.has(severity);
}

async function fetchGitHubJson<T>(
	url: string,
	token: string,
	timeoutMs = 10000,
): Promise<ApiResult<T>> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
		signal: controller.signal,
		next: { revalidate: 0 },
	}).finally(() => clearTimeout(timeoutId));

	const rateLimited =
		response.status === 403 &&
		response.headers.get("x-ratelimit-remaining") === "0";

	if (!response.ok) {
		if (response.status === 403 || response.status === 404) {
			return {
				ok: false,
				status: response.status,
				data: null,
				rateLimited,
			};
		}
		throw new Error(`GitHub request failed: ${response.status} ${url}`);
	}

	return {
		ok: true,
		status: response.status,
		data: (await response.json()) as T,
		rateLimited,
	};
}

async function fetchOwnerRepositories(
	owner: string,
	token: string,
): Promise<{ repositories: GitHubRepository[]; rateLimited: boolean }> {
	const orgUrl = `https://api.github.com/orgs/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`;
	const orgResult = await fetchGitHubJson<GitHubRepository[]>(orgUrl, token);
	if (orgResult.ok && orgResult.data) {
		return { repositories: orgResult.data, rateLimited: false };
	}
	if (orgResult.rateLimited) {
		return { repositories: [], rateLimited: true };
	}

	const userUrl = `https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`;
	const userResult = await fetchGitHubJson<GitHubRepository[]>(userUrl, token);
	return {
		repositories: userResult.ok && userResult.data ? userResult.data : [],
		rateLimited: userResult.rateLimited,
	};
}

async function fetchSecurityCounts(owner: string, repo: string, token: string) {
	const endpoints = [
		{
			key: "dependabot" as const,
			url: `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`,
		},
		{
			key: "secretScanning" as const,
			url: `https://api.github.com/repos/${owner}/${repo}/secret-scanning/alerts?state=open&per_page=100`,
		},
		{
			key: "codeScanning" as const,
			url: `https://api.github.com/repos/${owner}/${repo}/code-scanning/alerts?state=open&per_page=100`,
		},
	];

	const counts = {
		dependabot: null as number | null,
		secretScanning: null as number | null,
		codeScanning: null as number | null,
		critical: null as number | null,
		rateLimited: false,
	};

	for (const endpoint of endpoints) {
		const result = await fetchGitHubJson<GitHubSecurityAlert[]>(
			endpoint.url,
			token,
			10000,
		);
		if (result.rateLimited) {
			counts.rateLimited = true;
		}
		if (!result.ok || !result.data) {
			continue;
		}
		counts[endpoint.key] = result.data.length;
		const criticalCount = result.data.filter(isCriticalAlert).length;
		counts.critical = (counts.critical || 0) + criticalCount;
	}

	return counts;
}

async function fetchRepoBundle(
	owner: string,
	repository: GitHubRepository,
	token: string,
): Promise<{ bundle: RepoBundle; rateLimited: boolean }> {
	const repoName = repository.name || "";
	const encodedOwner = encodeURIComponent(owner);
	const encodedRepo = encodeURIComponent(repoName);
	const defaultBranch = repository.default_branch || "main";
	const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();

	const [
		pullsResult,
		issuesResult,
		workflowResult,
		commitResult,
		commits7dResult,
		releasesResult,
		security,
	] = await Promise.all([
		fetchGitHubJson<GitHubPullRequest[]>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/pulls?state=open&per_page=100`,
			token,
		),
		fetchGitHubJson<GitHubIssue[]>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/issues?state=open&per_page=100`,
			token,
		),
		fetchGitHubJson<GitHubWorkflowRunsResponse>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/actions/runs?per_page=20`,
			token,
		),
		fetchGitHubJson<GitHubCommit[]>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/commits?per_page=1&sha=${encodeURIComponent(defaultBranch)}`,
			token,
		),
		fetchGitHubJson<GitHubCommit[]>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/commits?per_page=100&sha=${encodeURIComponent(defaultBranch)}&since=${encodeURIComponent(sevenDaysAgo)}`,
			token,
		),
		fetchGitHubJson<GitHubRelease[]>(
			`https://api.github.com/repos/${encodedOwner}/${encodedRepo}/releases?per_page=5`,
			token,
		),
		fetchSecurityCounts(encodedOwner, encodedRepo, token),
	]);

	const rateLimited =
		pullsResult.rateLimited ||
		issuesResult.rateLimited ||
		workflowResult.rateLimited ||
		commitResult.rateLimited ||
		commits7dResult.rateLimited ||
		releasesResult.rateLimited ||
		security.rateLimited;

	return {
		rateLimited,
		bundle: {
			repository,
			pulls: pullsResult.data || [],
			issues: (issuesResult.data || []).filter((issue) => !issue.pull_request),
			workflowRuns: workflowResult.data?.workflow_runs || [],
			commits: commitResult.data || [],
			commits7d: commits7dResult.ok ? commits7dResult.data || [] : null,
			releases: releasesResult.data || [],
			security: {
				dependabot: security.dependabot,
				secretScanning: security.secretScanning,
				codeScanning: security.codeScanning,
				critical: security.critical,
			},
		},
	};
}

function buildDataFromBundles(
	bundles: RepoBundle[],
	params: {
		owner: string;
		timezone: string;
		staleDays: number;
		maxWorkflowRuns: number;
		source: "live" | "cache" | "mock";
		note?: string;
	},
): GitHubMonitorData {
	const now = Date.now();
	const sevenDaysAgoMs = now - 7 * DAY_MS;
	const thirtyDaysAgoMs = now - 30 * DAY_MS;

	const workflowRuns = bundles
		.flatMap((bundle) =>
			bundle.workflowRuns.map((run) => ({
				repository: bundle.repository.name || run.repository?.name || "repo",
				workflow: run.name || "Workflow",
				status: workflowStatus(run),
				branch: run.head_branch || "n/a",
				duration: workflowDuration(run),
				age: relativeAge(run.run_started_at || run.created_at, now) || "n/a",
				createdAt: new Date(
					run.run_started_at || run.created_at || 0,
				).getTime(),
			})),
		)
		.sort((a, b) => b.createdAt - a.createdAt);

	const completedRuns7d = bundles
		.flatMap((bundle) => bundle.workflowRuns)
		.filter((run) => {
			const createdAt = new Date(
				run.run_started_at || run.created_at || 0,
			).getTime();
			return createdAt >= sevenDaysAgoMs && !!run.conclusion;
		});

	const successfulRuns7d = completedRuns7d.filter(
		(run) => String(run.conclusion || "").toLowerCase() === "success",
	).length;
	const failedRuns7d = completedRuns7d.filter((run) =>
		["failure", "timed_out", "cancelled"].includes(
			String(run.conclusion || "").toLowerCase(),
		),
	).length;
	const actionsSuccessRate7d =
		completedRuns7d.length > 0
			? Math.round((successfulRuns7d / completedRuns7d.length) * 100)
			: null;

	const latestCommits = bundles
		.map((bundle) => ({
			repository: bundle.repository.name || "repo",
			commit: pickLatestCommit(bundle.commits),
		}))
		.filter((item) => item.commit?.commit?.author?.date)
		.sort(
			(a, b) =>
				new Date(b.commit?.commit?.author?.date || 0).getTime() -
				new Date(a.commit?.commit?.author?.date || 0).getTime(),
		);
	const latestCommit = latestCommits[0]?.commit;
	const latestCommitAge =
		relativeAge(latestCommit?.commit?.author?.date, now) || null;

	const stalePullRequests = bundles.flatMap((bundle) =>
		bundle.pulls.filter(
			(pr) => hoursSince(pr.created_at, now) > params.staleDays * 24,
		),
	).length;

	const securitySupported = bundles.some(
		(bundle) =>
			bundle.security.dependabot !== null ||
			bundle.security.secretScanning !== null ||
			bundle.security.codeScanning !== null,
	);
	const totalSecurityAlerts = securitySupported
		? bundles.reduce((sum, bundle) => {
				return (
					sum +
					(bundle.security.dependabot || 0) +
					(bundle.security.secretScanning || 0) +
					(bundle.security.codeScanning || 0)
				);
			}, 0)
		: null;
	const criticalSecurityAlerts = securitySupported
		? bundles.reduce((sum, bundle) => sum + (bundle.security.critical || 0), 0)
		: null;

	const repositoryHealth = bundles
		.map((bundle) => {
			const latestCommitDate = bundle.commits[0]?.commit?.author?.date;
			const latestCommitAgeForRepo = relativeAge(latestCommitDate, now);
			const repoOldestPrHours = bundle.pulls.length
				? Math.max(...bundle.pulls.map((pr) => hoursSince(pr.created_at, now)))
				: 0;
			const defaultWorkflow = latestWorkflowForDefaultBranch(
				bundle.repository.default_branch,
				bundle.workflowRuns,
			);
			const latestWorkflowState = defaultWorkflow
				? workflowStatus(defaultWorkflow)
				: "UNKNOWN";
			const repoSecurityCount =
				(bundle.security.dependabot || 0) +
				(bundle.security.secretScanning || 0) +
				(bundle.security.codeScanning || 0);

			let status: "OK" | "WARN" | "FAIL" = "OK";
			if (latestWorkflowState === "FAIL" || latestWorkflowState === "CANCEL") {
				status = "FAIL";
			} else if (
				bundle.pulls.some(
					(pr) => hoursSince(pr.created_at, now) > params.staleDays * 24,
				) ||
				(bundle.pulls.length > 0 &&
					repoOldestPrHours > params.staleDays * 24) ||
				hoursSince(latestCommitDate, now) > params.staleDays * 24 ||
				repoSecurityCount > 0
			) {
				status = "WARN";
			}

			return {
				repository: bundle.repository.name || "repo",
				openPullRequests: bundle.pulls.length,
				openIssues: bundle.issues.length,
				latestCommitAge: latestCommitAgeForRepo,
				status,
			};
		})
		.sort((a, b) => a.repository.localeCompare(b.repository));

	const latestDefaultBranchFailures = bundles.some((bundle) => {
		const latestRun = latestWorkflowForDefaultBranch(
			bundle.repository.default_branch,
			bundle.workflowRuns,
		);
		const status = latestRun ? workflowStatus(latestRun) : "UNKNOWN";
		return status === "FAIL" || status === "CANCEL";
	});

	let status: GitHubMonitorData["status"] = {
		label: "Alle Systeme OK",
		level: "ok",
	};

	if (criticalSecurityAlerts && criticalSecurityAlerts > 0) {
		status = { label: "Fehler", level: "error" };
	} else if (latestDefaultBranchFailures) {
		status = { label: "Fehler", level: "error" };
	} else if (
		(totalSecurityAlerts && totalSecurityAlerts > 0) ||
		stalePullRequests > 0 ||
		(actionsSuccessRate7d !== null && actionsSuccessRate7d < 90) ||
		failedRuns7d > 0
	) {
		status = { label: "Warnung", level: "warning" };
	}

	const activeBranches = new Set<string>();
	const contributors = new Set<string>();
	let releases30d = 0;
	let latestRelease: { label: string; publishedAt: number } | null = null;
	let commits7d = 0;
	let secretScanningAlerts: number | null = securitySupported ? 0 : null;

	for (const bundle of bundles) {
		for (const pr of bundle.pulls) {
			if (pr.base?.ref) {
				activeBranches.add(`${bundle.repository.name}:${pr.base.ref}`);
			}
			if (pr.head?.ref) {
				activeBranches.add(`${bundle.repository.name}:${pr.head.ref}`);
			}
			if (pr.user?.login) {
				contributors.add(pr.user.login);
			}
		}

		for (const issue of bundle.issues) {
			if (issue.user?.login) {
				contributors.add(issue.user.login);
			}
		}

		for (const run of bundle.workflowRuns) {
			if (run.head_branch) {
				activeBranches.add(`${bundle.repository.name}:${run.head_branch}`);
			}
			if (run.actor?.login) {
				contributors.add(run.actor.login);
			}
		}

		const commitAuthor = bundle.commits[0]?.author?.login;
		if (commitAuthor) {
			contributors.add(commitAuthor);
		}
		if (Array.isArray(bundle.commits7d)) {
			commits7d += bundle.commits7d.length;
			for (const commit of bundle.commits7d) {
				if (commit.author?.login) {
					contributors.add(commit.author.login);
				}
			}
		}

		for (const release of bundle.releases) {
			if (release.draft || !release.published_at) {
				continue;
			}
			const publishedAt = new Date(release.published_at).getTime();
			if (publishedAt >= thirtyDaysAgoMs) {
				releases30d += 1;
			}
			if (!latestRelease || publishedAt > latestRelease.publishedAt) {
				latestRelease = {
					label: `${bundle.repository.name} ${release.tag_name || release.name || "release"}`,
					publishedAt,
				};
			}
		}

		if (secretScanningAlerts !== null) {
			secretScanningAlerts += bundle.security.secretScanning || 0;
		}
	}

	return {
		generatedAt: new Date(now).toISOString(),
		status,
		metrics: {
			repositories: bundles.length,
			openPullRequests: bundles.reduce(
				(sum, bundle) => sum + bundle.pulls.length,
				0,
			),
			openIssues: bundles.reduce(
				(sum, bundle) => sum + bundle.issues.length,
				0,
			),
			actionsSuccessRate7d,
			securityAlerts: totalSecurityAlerts,
			criticalSecurityAlerts,
			latestCommitAge,
		},
		workflowRuns: workflowRuns.slice(0, params.maxWorkflowRuns).map((run) => ({
			repository: run.repository,
			workflow: run.workflow,
			status: run.status,
			branch: run.branch,
			duration: run.duration,
			age: run.age,
		})),
		repositoryHealth: repositoryHealth.slice(0, 6),
		footer: {
			activeBranches: activeBranches.size || null,
			releases30d,
			latestRelease: latestRelease?.label || null,
			contributors: contributors.size || null,
			commits7d: commits7d || null,
			secretScanningAlerts,
		},
		meta: {
			owner: params.owner,
			timezone: params.timezone,
			...buildTimeMeta(now, params.timezone),
			selectedRepositories: bundles.map(
				(bundle) => bundle.repository.name || "repo",
			),
			staleDays: params.staleDays,
			maxWorkflowRuns: params.maxWorkflowRuns,
			source: params.source,
			note: params.note,
		},
	};
}

export async function getGitHubMonitorData(
	input?: GitHubMonitorParams,
): Promise<GitHubMonitorData> {
	const githubToken =
		String(input?.githubToken || "").trim() ||
		String(process.env.GITHUB_TOKEN || "").trim();
	const owner =
		String(input?.owner || "").trim() ||
		String(process.env.GITHUB_OWNER || "").trim();
	const repositories = parseRepositoryList(
		String(input?.repositories || process.env.REPOSITORIES || ""),
	);
	const includePrivateRepos = parseBoolean(
		input?.includePrivateRepos ?? process.env.INCLUDE_PRIVATE_REPOS,
		true,
	);
	const staleDays = clampNumber(
		input?.staleDays ?? process.env.STALE_DAYS,
		14,
		1,
		90,
	);
	const timezone =
		String(input?.timezone || process.env.TIMEZONE || "").trim() ||
		"Europe/Berlin";
	const maxRepos = clampNumber(
		input?.maxRepos ?? process.env.MAX_REPOS,
		6,
		1,
		12,
	);
	const maxWorkflowRuns = clampNumber(
		input?.maxWorkflowRuns ?? process.env.MAX_WORKFLOW_RUNS,
		5,
		1,
		8,
	);

	if (!githubToken || !owner) {
		const mock = buildGitHubMonitorMockData();
		return {
			...mock,
			meta: {
				...mock.meta,
				owner: owner || mock.meta.owner,
				timezone,
				staleDays,
				maxWorkflowRuns,
				source: "mock",
				note: githubToken
					? "Owner fehlt, daher wird Mock-Datenmaterial angezeigt."
					: "GitHub-Token fehlt, daher wird Mock-Datenmaterial angezeigt.",
			},
		};
	}

	const key = cacheKey({
		owner,
		repositories,
		includePrivateRepos,
		staleDays,
		timezone,
		maxRepos,
		maxWorkflowRuns,
	});
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return {
			...cached.data,
			meta: {
				...cached.data.meta,
				source: "cache",
				note: "Zwischengespeicherte GitHub-Daten",
			},
		};
	}

	try {
		let selectedRepos: GitHubRepository[] = [];
		let repoRateLimited = false;

		if (repositories.length > 0) {
			const repoResults = await Promise.all(
				repositories
					.slice(0, maxRepos)
					.map((repoName) =>
						fetchGitHubJson<GitHubRepository>(
							`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
							githubToken,
						),
					),
			);
			repoRateLimited = repoResults.some((result) => result.rateLimited);
			selectedRepos = repoResults
				.filter((result) => result.ok && result.data)
				.map((result) => result.data as GitHubRepository);
		} else {
			const reposResponse = await fetchOwnerRepositories(owner, githubToken);
			repoRateLimited = reposResponse.rateLimited;
			selectedRepos = reposResponse.repositories
				.filter((repo) => (includePrivateRepos ? true : !repo.private))
				.filter((repo) => !repo.archived && !repo.disabled)
				.slice(0, maxRepos);
		}

		const bundleResults = await Promise.all(
			selectedRepos.map((repo) => fetchRepoBundle(owner, repo, githubToken)),
		);
		const rateLimited =
			repoRateLimited || bundleResults.some((result) => result.rateLimited);
		const data = buildDataFromBundles(
			bundleResults.map((result) => result.bundle),
			{
				owner,
				timezone,
				staleDays,
				maxWorkflowRuns,
				source: "live",
			},
		);

		const finalData = rateLimited
			? {
					...data,
					status: {
						label: "Rate Limit" as const,
						level: "warning" as const,
					},
					meta: {
						...data.meta,
						note: "GitHub Rate Limit erreicht, Daten koennen unvollstaendig sein.",
					},
				}
			: data;

		cache.set(key, {
			timestamp: Date.now(),
			data: finalData,
		});

		return finalData;
	} catch (error) {
		console.error("GitHub Monitor fetch failed:", error);
		if (cached) {
			return {
				...cached.data,
				status: {
					label: "Warnung",
					level: "warning",
				},
				meta: {
					...cached.data.meta,
					source: "cache",
					note: "Live-Fetch fehlgeschlagen, letzter Cache wird angezeigt.",
				},
			};
		}

		const mock = buildGitHubMonitorMockData();
		return {
			...mock,
			status: {
				label: "Warnung",
				level: "warning",
			},
			meta: {
				...mock.meta,
				owner,
				timezone,
				staleDays,
				maxWorkflowRuns,
				source: "mock",
				note: "Live-Fetch fehlgeschlagen, daher wird Mock-Datenmaterial angezeigt.",
			},
		};
	}
}

export function githubMonitorDisplayStrings(
	data: GitHubMonitorData,
	timezone: string,
) {
	const generated = new Date(data.generatedAt);
	return {
		...buildTimeMeta(generated.getTime(), timezone),
	};
}

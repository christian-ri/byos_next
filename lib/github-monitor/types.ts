export type GitHubMonitorParams = {
	githubToken?: string;
	owner?: string;
	repositories?: string;
	includePrivateRepos?: boolean | string;
	staleDays?: number | string;
	timezone?: string;
	maxRepos?: number | string;
	maxWorkflowRuns?: number | string;
};

export type GitHubMonitorStatusLevel = "ok" | "warning" | "error";

export type GitHubMonitorData = {
	generatedAt: string;
	status: {
		label: "Alle Systeme OK" | "Warnung" | "Fehler" | "Rate Limit";
		level: GitHubMonitorStatusLevel;
	};
	metrics: {
		repositories: number;
		openPullRequests: number;
		openIssues: number;
		actionsSuccessRate7d: number | null;
		securityAlerts: number | null;
		criticalSecurityAlerts: number | null;
		latestCommitAge: string | null;
	};
	workflowRuns: Array<{
		repository: string;
		workflow: string;
		status: "OK" | "FAIL" | "RUN" | "QUEUE" | "CANCEL" | "UNKNOWN";
		branch: string;
		duration: string | null;
		age: string;
	}>;
	repositoryHealth: Array<{
		repository: string;
		openPullRequests: number;
		openIssues: number;
		latestCommitAge: string | null;
		status: "OK" | "WARN" | "FAIL";
	}>;
	footer: {
		activeBranches: number | null;
		releases30d: number;
		latestRelease: string | null;
		contributors: number | null;
		commits7d: number | null;
		secretScanningAlerts: number | null;
	};
	meta: {
		owner: string;
		timezone: string;
		currentTime: string;
		updatedLabel: string;
		selectedRepositories: string[];
		staleDays: number;
		maxWorkflowRuns: number;
		source: "live" | "mock" | "cache";
		note?: string;
	};
};

export type GitHubRepository = {
	id?: number;
	name?: string;
	full_name?: string;
	private?: boolean;
	archived?: boolean;
	disabled?: boolean;
	default_branch?: string;
	pushed_at?: string;
	updated_at?: string;
	open_issues_count?: number;
	language?: string;
	visibility?: string;
};

export type GitHubPullRequest = {
	number?: number;
	title?: string;
	state?: string;
	draft?: boolean;
	created_at?: string;
	updated_at?: string;
	user?: {
		login?: string;
	};
	base?: {
		ref?: string;
	};
	head?: {
		ref?: string;
	};
	mergeable?: boolean | null;
};

export type GitHubIssue = {
	number?: number;
	title?: string;
	state?: string;
	created_at?: string;
	updated_at?: string;
	labels?: Array<{ name?: string }>;
	user?: {
		login?: string;
	};
	pull_request?: Record<string, unknown>;
};

export type GitHubWorkflowRun = {
	id?: number;
	name?: string;
	status?: string;
	conclusion?: string | null;
	event?: string;
	head_branch?: string;
	head_sha?: string;
	run_started_at?: string | null;
	created_at?: string;
	updated_at?: string;
	html_url?: string;
	repository?: {
		name?: string;
	};
	actor?: {
		login?: string;
	};
};

export type GitHubWorkflowRunsResponse = {
	workflow_runs?: GitHubWorkflowRun[];
};

export type GitHubCommit = {
	sha?: string;
	commit?: {
		message?: string;
		author?: {
			date?: string;
			name?: string;
		};
	};
	author?: {
		login?: string;
	};
};

export type GitHubRelease = {
	tag_name?: string;
	name?: string;
	published_at?: string;
	prerelease?: boolean;
	draft?: boolean;
};

export type GitHubSecurityAlert = {
	number?: number;
	state?: string;
	security_advisory?: {
		severity?: string;
	};
	rule?: {
		severity?: string;
	};
};

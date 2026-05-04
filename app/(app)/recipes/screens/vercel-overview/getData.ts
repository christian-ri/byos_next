import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type VercelParams = {
	apiToken?: string;
	teamId?: string;
	projectLimit?: string | number;
	deploymentLimit?: string | number;
};

type VercelUserResponse = {
	user?: {
		name?: string;
		username?: string;
	};
};

type VercelProject = {
	id: string;
	name: string;
	latestDeployments?: Array<{ state?: string }>;
};

type VercelDeployment = {
	name?: string;
	readyState?: string;
	target?: string;
	createdAt?: number;
};

type VercelDeploymentsResponse = {
	deployments?: VercelDeployment[];
};

type ProjectSummary = {
	name: string;
	status: string;
};

type DeploymentSummary = {
	name: string;
	state: string;
	target: string;
};

export type VercelOverviewRecipeData = {
	title: string;
	accountLabel: string;
	updatedAt: string;
	projects: ProjectSummary[];
	deployments: DeploymentSummary[];
	note?: string;
};

function buildFallback(note?: string): VercelOverviewRecipeData {
	return {
		title: "Vercel Overview",
		accountLabel: "Add a Vercel token",
		updatedAt: formatUpdatedAt(new Date()),
		projects: [
			{ name: "byos-next", status: "READY" },
			{ name: "personal-site", status: "READY" },
			{ name: "analytics-lab", status: "BUILDING" },
		],
		deployments: [
			{ name: "byos-next", state: "READY", target: "production" },
			{ name: "analytics-lab", state: "BUILDING", target: "preview" },
			{ name: "personal-site", state: "READY", target: "production" },
		],
		note,
	};
}

export default async function getData(
	params?: VercelParams,
): Promise<VercelOverviewRecipeData> {
	const apiToken = String(params?.apiToken || "").trim();
	if (!apiToken) {
		return buildFallback(
			"Add an API token to list your projects and recent deployments.",
		);
	}

	const teamId = String(params?.teamId || "").trim();
	const projectLimit = Math.max(
		1,
		Math.min(6, Number(params?.projectLimit || 4)),
	);
	const deploymentLimit = Math.max(
		1,
		Math.min(6, Number(params?.deploymentLimit || 4)),
	);

	const headers = {
		Accept: "application/json",
		Authorization: `Bearer ${apiToken}`,
	};
	const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";

	try {
		const [user, projects, deployments] = await Promise.all([
			fetchJsonWithTimeout<VercelUserResponse>(
				`https://api.vercel.com/v2/user${teamQuery}`,
				{ headers },
				10000,
			),
			fetchJsonWithTimeout<VercelProject[]>(
				`https://api.vercel.com/v10/projects${teamQuery}`,
				{ headers },
				10000,
			),
			fetchJsonWithTimeout<VercelDeploymentsResponse>(
				`https://api.vercel.com/v6/deployments${teamQuery ? `${teamQuery}&limit=${deploymentLimit}` : `?limit=${deploymentLimit}`}`,
				{ headers },
				10000,
			),
		]);

		return {
			title: "Vercel Overview",
			accountLabel:
				user.user?.name ||
				user.user?.username ||
				(teamId ? `Team ${teamId}` : "Vercel account"),
			updatedAt: formatUpdatedAt(new Date()),
			projects: projects.slice(0, projectLimit).map((project) => ({
				name: project.name,
				status: project.latestDeployments?.[0]?.state || "UNKNOWN",
			})),
			deployments:
				deployments.deployments
					?.slice(0, deploymentLimit)
					.map((deployment) => ({
						name: deployment.name || "deployment",
						state: deployment.readyState || "UNKNOWN",
						target: deployment.target || "preview",
					})) || [],
			note: "Projects and recent deployments via Vercel REST API. Traffic metrics can be added from analytics-specific endpoints later.",
		};
	} catch (error) {
		console.error("Error loading Vercel overview data:", error);
		return buildFallback(
			"Live Vercel fetch failed, so this preview is showing sample deployment data.",
		);
	}
}

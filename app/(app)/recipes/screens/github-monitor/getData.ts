import { getGitHubMonitorData } from "@/lib/github-monitor/service";

export const dynamic = "force-dynamic";

export default async function getData(params?: {
	githubToken?: string;
	owner?: string;
	repositories?: string;
	includePrivateRepos?: boolean | string;
	staleDays?: number | string;
	timezone?: string;
	maxRepos?: number | string;
	maxWorkflowRuns?: number | string;
}) {
	return getGitHubMonitorData(params);
}

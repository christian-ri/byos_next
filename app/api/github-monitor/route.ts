import type { NextRequest } from "next/server";
import { getGitHubMonitorData } from "@/lib/github-monitor/service";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);

	const data = await getGitHubMonitorData({
		owner: searchParams.get("owner") || undefined,
		repositories: searchParams.get("repositories") || undefined,
		includePrivateRepos: searchParams.get("includePrivateRepos") || undefined,
		staleDays: searchParams.get("staleDays") || undefined,
		timezone: searchParams.get("timezone") || undefined,
		maxRepos: searchParams.get("maxRepos") || undefined,
		maxWorkflowRuns: searchParams.get("maxWorkflowRuns") || undefined,
	});

	return Response.json(data, {
		headers: {
			"Cache-Control": "s-maxage=900, stale-while-revalidate=1800",
		},
	});
}

import {
	fetchJsonWithTimeout,
	formatDateTime,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type WorldCupParams = {
	timezone?: string;
};

type ApiTeam = {
	id?: string | number;
	name_en?: string;
	fifa_code?: string;
	groups?: string;
};

type ApiStandingTeam = {
	team_id?: string | number;
	mp?: string | number;
	w?: string | number;
	l?: string | number;
	d?: string | number;
	pts?: string | number;
	gf?: string | number;
	ga?: string | number;
	gd?: string | number;
};

type ApiGroup = {
	group?: string;
	name?: string;
	teams?: ApiStandingTeam[];
};

type ApiMatch = {
	id?: string | number;
	home_team_id?: string | number;
	away_team_id?: string | number;
	home_team_label?: string;
	away_team_label?: string;
	home_score?: string | number;
	away_score?: string | number;
	group?: string;
	matchday?: string | number;
	local_date?: string;
	stadium_id?: string | number;
	finished?: string | boolean;
	time_elapsed?: string | number;
	type?: string;
};

type TeamMeta = {
	id: string;
	name: string;
	code: string;
	group: string;
};

export type WorldCupStanding = {
	rank: number;
	teamId: string;
	name: string;
	code: string;
	mp: number;
	gd: number;
	pts: number;
};

export type WorldCupGroup = {
	group: string;
	teams: WorldCupStanding[];
};

export type WorldCupMatch = {
	id: string;
	stage: string;
	group: string;
	matchday: string;
	homeName: string;
	awayName: string;
	homeCode: string;
	awayCode: string;
	homeScore: string;
	awayScore: string;
	scoreLabel: string;
	dateLabel: string;
	timeLabel: string;
	statusLabel: string;
	isLive: boolean;
	isFinished: boolean;
	sortTime: number;
};

export type WorldCup2026Data = {
	title: string;
	subtitle: string;
	groups: WorldCupGroup[];
	nextMatch: WorldCupMatch;
	focusMatch: WorldCupMatch;
	focusLabel: string;
	updatedAt: string;
};

const API_BASE = "https://worldcup26.ir";
const RAW_BASE =
	"https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";
const DEFAULT_TIMEZONE = "America/New_York";
const LIVE_API_TIMEOUT_MS = 10000;
const LIVE_GAMES_TIMEOUT_MS = 17000;
const RAW_SNAPSHOT_TIMEOUT_MS = 2500;

const FALLBACK_TEAMS: TeamMeta[] = [
	{ id: "1", name: "Mexico", code: "MEX", group: "A" },
	{ id: "2", name: "South Africa", code: "RSA", group: "A" },
	{ id: "3", name: "South Korea", code: "KOR", group: "A" },
	{ id: "4", name: "Czech Republic", code: "CZE", group: "A" },
	{ id: "5", name: "Canada", code: "CAN", group: "B" },
	{ id: "6", name: "Bosnia and Herzegovina", code: "BIH", group: "B" },
	{ id: "7", name: "Qatar", code: "QAT", group: "B" },
	{ id: "8", name: "Switzerland", code: "SUI", group: "B" },
	{ id: "9", name: "Brazil", code: "BRA", group: "C" },
	{ id: "10", name: "Morocco", code: "MAR", group: "C" },
	{ id: "11", name: "Haiti", code: "HAI", group: "C" },
	{ id: "12", name: "Scotland", code: "SCO", group: "C" },
	{ id: "13", name: "United States", code: "USA", group: "D" },
	{ id: "14", name: "Paraguay", code: "PAR", group: "D" },
	{ id: "15", name: "Australia", code: "AUS", group: "D" },
	{ id: "16", name: "Turkey", code: "TUR", group: "D" },
	{ id: "17", name: "Germany", code: "GER", group: "E" },
	{ id: "18", name: "Curacao", code: "CUW", group: "E" },
	{ id: "19", name: "Ivory Coast", code: "CIV", group: "E" },
	{ id: "20", name: "Ecuador", code: "ECU", group: "E" },
	{ id: "21", name: "Netherlands", code: "NED", group: "F" },
	{ id: "22", name: "Japan", code: "JPN", group: "F" },
	{ id: "23", name: "Sweden", code: "SWE", group: "F" },
	{ id: "24", name: "Tunisia", code: "TUN", group: "F" },
	{ id: "25", name: "Belgium", code: "BEL", group: "G" },
	{ id: "26", name: "Egypt", code: "EGY", group: "G" },
	{ id: "27", name: "Iran", code: "IRN", group: "G" },
	{ id: "28", name: "New Zealand", code: "NZL", group: "G" },
	{ id: "29", name: "Spain", code: "ESP", group: "H" },
	{ id: "30", name: "Cape Verde", code: "CPV", group: "H" },
	{ id: "31", name: "Saudi Arabia", code: "KSA", group: "H" },
	{ id: "32", name: "Uruguay", code: "URU", group: "H" },
	{ id: "33", name: "France", code: "FRA", group: "I" },
	{ id: "34", name: "Senegal", code: "SEN", group: "I" },
	{ id: "35", name: "Iraq", code: "IRQ", group: "I" },
	{ id: "36", name: "Norway", code: "NOR", group: "I" },
	{ id: "37", name: "Argentina", code: "ARG", group: "J" },
	{ id: "38", name: "Algeria", code: "ALG", group: "J" },
	{ id: "39", name: "Austria", code: "AUT", group: "J" },
	{ id: "40", name: "Jordan", code: "JOR", group: "J" },
	{ id: "41", name: "Portugal", code: "POR", group: "K" },
	{ id: "42", name: "DR Congo", code: "COD", group: "K" },
	{ id: "43", name: "Uzbekistan", code: "UZB", group: "K" },
	{ id: "44", name: "Colombia", code: "COL", group: "K" },
	{ id: "45", name: "England", code: "ENG", group: "L" },
	{ id: "46", name: "Croatia", code: "CRO", group: "L" },
	{ id: "47", name: "Ghana", code: "GHA", group: "L" },
	{ id: "48", name: "Panama", code: "PAN", group: "L" },
];

const FALLBACK_MATCHES: ApiMatch[] = [
	{
		id: "1",
		home_team_id: "1",
		away_team_id: "2",
		home_score: "0",
		away_score: "0",
		group: "A",
		matchday: "1",
		local_date: "06/11/2026 13:00",
		finished: "FALSE",
		time_elapsed: "notstarted",
		type: "group",
	},
	{
		id: "25",
		home_team_id: "1",
		away_team_id: "3",
		home_score: "0",
		away_score: "0",
		group: "A",
		matchday: "2",
		local_date: "06/18/2026 19:00",
		finished: "FALSE",
		time_elapsed: "notstarted",
		type: "group",
	},
	{
		id: "104",
		home_team_id: "0",
		away_team_id: "0",
		home_score: "0",
		away_score: "0",
		group: "FINAL",
		matchday: "9",
		local_date: "07/19/2026 15:00",
		finished: "FALSE",
		time_elapsed: "notstarted",
		type: "final",
		home_team_label: "Winner Match 101",
		away_team_label: "Winner Match 102",
	},
];

function normalizeTimezone(value?: string) {
	const normalized = String(value || DEFAULT_TIMEZONE).trim();
	return normalized || DEFAULT_TIMEZONE;
}

function normalizeArray<T>(value: unknown): T[] {
	if (Array.isArray(value)) return value as T[];
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		for (const key of [
			"data",
			"result",
			"results",
			"items",
			"games",
			"groups",
			"teams",
		]) {
			if (Array.isArray(record[key])) return record[key] as T[];
		}
	}
	return [];
}

async function fetchWorldCupArray<T>(
	apiPath: string,
	rawFile: string,
	liveTimeoutMs = LIVE_API_TIMEOUT_MS,
) {
	const sources = [
		{ url: `${API_BASE}${apiPath}`, timeoutMs: liveTimeoutMs },
		{ url: `${RAW_BASE}/${rawFile}`, timeoutMs: RAW_SNAPSHOT_TIMEOUT_MS },
	];
	let lastError: unknown;

	for (const source of sources) {
		try {
			const payload = await fetchJsonWithTimeout<unknown>(
				source.url,
				{ headers: { Accept: "application/json" } },
				source.timeoutMs,
			);
			const data = normalizeArray<T>(payload);
			if (data.length > 0) return { data, source: source.url };
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error(`No World Cup data for ${apiPath}`);
}

function toNumber(value: unknown, fallback = 0) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	const parsed = Number(String(value ?? "").trim());
	return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = "") {
	const text = String(value ?? "").trim();
	return text || fallback;
}

function toId(value: unknown) {
	return toText(value, "0");
}

function makeTeamsById(apiTeams: Array<ApiTeam | TeamMeta>) {
	const teams = apiTeams.length > 0 ? apiTeams : FALLBACK_TEAMS;
	return new Map<string, TeamMeta>(
		teams.map((team) => {
			const id = toId(team.id);
			const apiTeam = team as ApiTeam;
			const fallbackTeam = team as TeamMeta;
			return [
				id,
				{
					id,
					name: toText(apiTeam.name_en || fallbackTeam.name, `Team ${id}`),
					code: toText(apiTeam.fifa_code || fallbackTeam.code, `T${id}`)
						.slice(0, 4)
						.toUpperCase(),
					group: toText(apiTeam.groups || fallbackTeam.group, ""),
				},
			];
		}),
	);
}

function fallbackGroups(): ApiGroup[] {
	const groups = new Map<string, ApiStandingTeam[]>();
	for (const team of FALLBACK_TEAMS) {
		const list = groups.get(team.group) || [];
		list.push({
			team_id: team.id,
			mp: "0",
			w: "0",
			l: "0",
			d: "0",
			pts: "0",
			gf: "0",
			ga: "0",
			gd: "0",
		});
		groups.set(team.group, list);
	}
	return [...groups.entries()].map(([group, teams]) => ({ group, teams }));
}

function sortGroupTeams(teams: WorldCupStanding[]) {
	return [...teams]
		.sort((a, b) => {
			if (b.pts !== a.pts) return b.pts - a.pts;
			if (b.gd !== a.gd) return b.gd - a.gd;
			return a.rank - b.rank;
		})
		.map((team, index) => ({ ...team, rank: index + 1 }));
}

function normalizeGroups(
	apiGroups: ApiGroup[],
	teamsById: Map<string, TeamMeta>,
) {
	const sourceGroups = apiGroups.length > 0 ? apiGroups : fallbackGroups();
	return sourceGroups
		.map((group) => {
			const groupLabel = toText(group.group || group.name, "?");
			const teams = (group.teams || []).map((entry, index) => {
				const teamId = toId(entry.team_id);
				const meta = teamsById.get(teamId);
				return {
					rank: index + 1,
					teamId,
					name: meta?.name || `Team ${teamId}`,
					code: meta?.code || `T${teamId}`,
					mp: toNumber(entry.mp),
					gd: toNumber(entry.gd),
					pts: toNumber(entry.pts),
				};
			});
			return { group: groupLabel, teams: sortGroupTeams(teams) };
		})
		.sort((a, b) => a.group.localeCompare(b.group));
}

function parseWorldCupDate(value?: string) {
	const match = String(value || "").match(
		/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/,
	);
	if (!match) return 0;
	const [, month, day, year, hour, minute] = match;
	return Date.UTC(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hour),
		Number(minute),
	);
}

function formatLocalDate(value?: string) {
	const timestamp = parseWorldCupDate(value);
	if (!timestamp) return { dateLabel: "TBA", timeLabel: "TBA" };
	return {
		dateLabel: formatDateTime(
			new Date(timestamp),
			{ month: "short", day: "numeric" },
			"UTC",
		),
		timeLabel: formatDateTime(
			new Date(timestamp),
			{ hour: "2-digit", minute: "2-digit", hour12: false },
			"UTC",
		),
	};
}

function isFinished(match: ApiMatch) {
	const finished = String(match.finished ?? "")
		.trim()
		.toLowerCase();
	const elapsed = String(match.time_elapsed ?? "")
		.trim()
		.toLowerCase();
	return (
		finished === "true" ||
		finished === "1" ||
		elapsed === "finished" ||
		elapsed === "ft" ||
		elapsed === "fulltime"
	);
}

function isLive(match: ApiMatch) {
	if (isFinished(match)) return false;
	const elapsed = String(match.time_elapsed ?? "")
		.trim()
		.toLowerCase();
	return Boolean(
		elapsed &&
			elapsed !== "notstarted" &&
			elapsed !== "not_started" &&
			elapsed !== "scheduled" &&
			elapsed !== "0",
	);
}

function stageLabel(match: ApiMatch) {
	const type = toText(match.type, "group").toLowerCase();
	if (type === "group") return `Group ${toText(match.group, "")}`;
	if (type === "r32") return "Round of 32";
	if (type === "r16") return "Round of 16";
	if (type === "qf") return "Quarter-final";
	if (type === "sf") return "Semi-final";
	if (type === "third") return "Third place";
	if (type === "final") return "Final";
	return type.toUpperCase();
}

function teamForMatch(
	teamId: unknown,
	label: unknown,
	teamsById: Map<string, TeamMeta>,
) {
	const id = toId(teamId);
	const meta = teamsById.get(id);
	const fallback = toText(label, id === "0" ? "TBD" : `Team ${id}`);
	return {
		name: meta?.name || fallback,
		code: meta?.code || fallback.slice(0, 3).toUpperCase(),
	};
}

function normalizeMatch(match: ApiMatch, teamsById: Map<string, TeamMeta>) {
	const home = teamForMatch(
		match.home_team_id,
		match.home_team_label,
		teamsById,
	);
	const away = teamForMatch(
		match.away_team_id,
		match.away_team_label,
		teamsById,
	);
	const live = isLive(match);
	const finished = isFinished(match);
	const homeScore = String(toNumber(match.home_score));
	const awayScore = String(toNumber(match.away_score));
	const scoreLabel =
		live || finished || homeScore !== "0" || awayScore !== "0"
			? `${homeScore} - ${awayScore}`
			: "vs";
	const elapsed = toText(match.time_elapsed, "");
	const { dateLabel, timeLabel } = formatLocalDate(match.local_date);

	return {
		id: toText(match.id, "?"),
		stage: stageLabel(match),
		group: toText(match.group, ""),
		matchday: toText(match.matchday, ""),
		homeName: home.name,
		awayName: away.name,
		homeCode: home.code,
		awayCode: away.code,
		homeScore,
		awayScore,
		scoreLabel,
		dateLabel,
		timeLabel,
		statusLabel: live ? `${elapsed}'` : finished ? "Final" : "Scheduled",
		isLive: live,
		isFinished: finished,
		sortTime: parseWorldCupDate(match.local_date),
	};
}

function pickMatches(matches: ApiMatch[], teamsById: Map<string, TeamMeta>) {
	const normalized = (matches.length > 0 ? matches : FALLBACK_MATCHES)
		.map((match) => normalizeMatch(match, teamsById))
		.sort((a, b) => a.sortTime - b.sortTime);
	const now = Date.now();
	const live = normalized.find((match) => match.isLive);
	const next =
		normalized.find(
			(match) => !match.isFinished && !match.isLive && match.sortTime > now,
		) ||
		normalized.find((match) => !match.isFinished && !match.isLive) ||
		normalized[normalized.length - 1];
	const lastFinished =
		[...normalized]
			.reverse()
			.find((match) => match.isFinished && match.sortTime <= now) ||
		normalized.find((match) => match.isFinished);
	const currentWindow =
		[...normalized]
			.reverse()
			.find((match) => !match.isFinished && match.sortTime <= now) ||
		normalized[0];
	const focusMatch = live || lastFinished || currentWindow;

	return {
		nextMatch: next,
		focusMatch,
		focusLabel: live
			? "Live Now"
			: focusMatch.isFinished
				? "Last Result"
				: "Current Window",
	};
}

export default async function getData(
	params?: WorldCupParams,
): Promise<WorldCup2026Data> {
	const timezone = normalizeTimezone(params?.timezone);

	try {
		const teamsById = makeTeamsById(FALLBACK_TEAMS);
		const [groupsResult, matchesResult] = await Promise.all([
			fetchWorldCupArray<ApiGroup>("/get/groups", "football.matchtables.json"),
			fetchWorldCupArray<ApiMatch>(
				"/get/games",
				"football.matches.json",
				LIVE_GAMES_TIMEOUT_MS,
			),
		]);
		const groups = normalizeGroups(groupsResult.data, teamsById);
		const { nextMatch, focusMatch, focusLabel } = pickMatches(
			matchesResult.data,
			teamsById,
		);
		return {
			title: "FIFA World Cup 2026",
			subtitle: "Groups + Match Center",
			groups,
			nextMatch,
			focusMatch,
			focusLabel,
			updatedAt: formatUpdatedAt(new Date(), timezone),
		};
	} catch (error) {
		console.error("Error loading World Cup 2026 data:", error);
		const teamsById = makeTeamsById(FALLBACK_TEAMS);
		const groups = normalizeGroups(fallbackGroups(), teamsById);
		const { nextMatch, focusMatch, focusLabel } = pickMatches(
			FALLBACK_MATCHES,
			teamsById,
		);

		return {
			title: "FIFA World Cup 2026",
			subtitle: "Groups + Match Center",
			groups,
			nextMatch,
			focusMatch,
			focusLabel,
			updatedAt: formatUpdatedAt(new Date(), timezone),
		};
	}
}

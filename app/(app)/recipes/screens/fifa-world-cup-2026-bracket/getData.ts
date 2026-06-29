import {
	fetchJsonWithTimeout,
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

type ApiStadium = {
	id?: string | number;
	fifa_name?: string;
	city_en?: string;
	name_en?: string;
	country_en?: string;
};

type ApiMatch = {
	id?: string | number;
	home_team_id?: string | number;
	away_team_id?: string | number;
	home_team_label?: string;
	away_team_label?: string;
	home_team_name_en?: string;
	away_team_name_en?: string;
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

type StadiumMeta = {
	id: string;
	shortName: string;
	fifaName: string;
	city: string;
	country: string;
};

type BracketRound = "r32" | "r16" | "qf" | "sf" | "final" | "third";

export type BracketTeam = {
	name: string;
	score: string;
	seedLabel: string;
	pathLabel: string;
	isKnown: boolean;
};

export type BracketMatch = {
	id: string;
	round: BracketRound;
	stageLabel: string;
	venueShort: string;
	venueFull: string;
	locationLabel: string;
	dateLabel: string;
	timeLabel: string;
	metaLabel: string;
	statusLabel: string;
	home: BracketTeam;
	away: BracketTeam;
	compactLabel: string;
	isLive: boolean;
	isFinished: boolean;
	sortTime: number;
};

type BracketSide = {
	roundOf32: BracketMatch[];
	roundOf16: BracketMatch[];
	quarterFinals: BracketMatch[];
	semiFinal: BracketMatch;
};

export type WorldCupBracketData = {
	title: string;
	subtitle: string;
	updatedAt: string;
	nextLabel: string;
	nextMatch: BracketMatch;
	highlightMatchId: string;
	left: BracketSide;
	right: BracketSide;
	final: BracketMatch;
	thirdPlace: BracketMatch;
};

const API_BASE = "https://worldcup26.ir";
const RAW_BASE =
	"https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";
const DEFAULT_TIMEZONE = "America/New_York";
const LIVE_API_TIMEOUT_MS = 10000;
const LIVE_GAMES_TIMEOUT_MS = 17000;
const RAW_SNAPSHOT_TIMEOUT_MS = 2500;

const LEFT_R32_IDS = ["74", "77", "73", "75", "83", "84", "81", "82"];
const LEFT_R16_IDS = ["89", "90", "93", "94"];
const LEFT_QF_IDS = ["97", "98"];
const LEFT_SF_ID = "101";

const RIGHT_R32_IDS = ["76", "78", "79", "80", "86", "88", "85", "87"];
const RIGHT_R16_IDS = ["91", "92", "95", "96"];
const RIGHT_QF_IDS = ["99", "100"];
const RIGHT_SF_ID = "102";

const FINAL_ID = "104";
const THIRD_PLACE_ID = "103";

const KNOCKOUT_IDS = new Set([
	...LEFT_R32_IDS,
	...LEFT_R16_IDS,
	...LEFT_QF_IDS,
	LEFT_SF_ID,
	...RIGHT_R32_IDS,
	...RIGHT_R16_IDS,
	...RIGHT_QF_IDS,
	RIGHT_SF_ID,
	FINAL_ID,
	THIRD_PLACE_ID,
]);

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
	{ id: "18", name: "Curaçao", code: "CUW", group: "E" },
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
	{ id: "42", name: "Democratic Republic of the Congo", code: "COD", group: "K" },
	{ id: "43", name: "Uzbekistan", code: "UZB", group: "K" },
	{ id: "44", name: "Colombia", code: "COL", group: "K" },
	{ id: "45", name: "England", code: "ENG", group: "L" },
	{ id: "46", name: "Croatia", code: "CRO", group: "L" },
	{ id: "47", name: "Ghana", code: "GHA", group: "L" },
	{ id: "48", name: "Panama", code: "PAN", group: "L" },
];

const FALLBACK_STADIUMS: StadiumMeta[] = [
	{
		id: "1",
		shortName: "Mexico City",
		fifaName: "Mexico City Stadium",
		city: "Mexico City",
		country: "Mexico",
	},
	{
		id: "2",
		shortName: "Guadalajara",
		fifaName: "Estadio Guadalajara",
		city: "Guadalajara",
		country: "Mexico",
	},
	{
		id: "3",
		shortName: "Monterrey",
		fifaName: "Estadio Monterrey",
		city: "Monterrey",
		country: "Mexico",
	},
	{
		id: "4",
		shortName: "Dallas",
		fifaName: "Dallas Stadium",
		city: "Dallas",
		country: "United States",
	},
	{
		id: "5",
		shortName: "Houston",
		fifaName: "Houston Stadium",
		city: "Houston",
		country: "United States",
	},
	{
		id: "6",
		shortName: "Kansas City",
		fifaName: "Kansas City Stadium",
		city: "Kansas City",
		country: "United States",
	},
	{
		id: "7",
		shortName: "Atlanta",
		fifaName: "Atlanta Stadium",
		city: "Atlanta",
		country: "United States",
	},
	{
		id: "8",
		shortName: "Miami",
		fifaName: "Miami Stadium",
		city: "Miami",
		country: "United States",
	},
	{
		id: "9",
		shortName: "Boston",
		fifaName: "Boston Stadium",
		city: "Boston",
		country: "United States",
	},
	{
		id: "10",
		shortName: "Philadelphia",
		fifaName: "Philadelphia Stadium",
		city: "Philadelphia",
		country: "United States",
	},
	{
		id: "11",
		shortName: "New York/NJ",
		fifaName: "New York/New Jersey Stadium",
		city: "New York/New Jersey",
		country: "United States",
	},
	{
		id: "12",
		shortName: "Toronto",
		fifaName: "Toronto Stadium",
		city: "Toronto",
		country: "Canada",
	},
	{
		id: "13",
		shortName: "Vancouver",
		fifaName: "BC Place Vancouver",
		city: "Vancouver",
		country: "Canada",
	},
	{
		id: "14",
		shortName: "Seattle",
		fifaName: "Seattle Stadium",
		city: "Seattle",
		country: "United States",
	},
	{
		id: "15",
		shortName: "San Francisco",
		fifaName: "San Francisco Bay Area Stadium",
		city: "San Francisco Bay Area",
		country: "United States",
	},
	{
		id: "16",
		shortName: "Los Angeles",
		fifaName: "Los Angeles Stadium",
		city: "Los Angeles",
		country: "United States",
	},
];

const FALLBACK_MATCHES: ApiMatch[] = [
	{ id: "73", type: "r32", local_date: "06/28/2026 12:00", stadium_id: "16", home_team_label: "Runner-up Group A", away_team_label: "Runner-up Group B" },
	{ id: "74", type: "r32", local_date: "06/29/2026 16:30", stadium_id: "9", home_team_label: "Winner Group E", away_team_label: "3rd Group A/B/C/D/F" },
	{ id: "75", type: "r32", local_date: "06/29/2026 19:00", stadium_id: "3", home_team_label: "Winner Group F", away_team_label: "Runner-up Group C" },
	{ id: "76", type: "r32", local_date: "06/29/2026 12:00", stadium_id: "5", home_team_label: "Winner Group C", away_team_label: "Runner-up Group F" },
	{ id: "77", type: "r32", local_date: "06/30/2026 17:00", stadium_id: "11", home_team_label: "Winner Group I", away_team_label: "3rd Group C/D/F/G/H" },
	{ id: "78", type: "r32", local_date: "06/30/2026 12:00", stadium_id: "4", home_team_label: "Runner-up Group E", away_team_label: "Runner-up Group I" },
	{ id: "79", type: "r32", local_date: "06/30/2026 19:00", stadium_id: "1", home_team_label: "Winner Group A", away_team_label: "3rd Group C/E/F/H/I" },
	{ id: "80", type: "r32", local_date: "07/01/2026 12:00", stadium_id: "7", home_team_label: "Winner Group L", away_team_label: "3rd Group E/H/I/J/K" },
	{ id: "81", type: "r32", local_date: "07/01/2026 17:00", stadium_id: "15", home_team_label: "Winner Group D", away_team_label: "3rd Group B/E/F/I/J" },
	{ id: "82", type: "r32", local_date: "07/01/2026 13:00", stadium_id: "14", home_team_label: "Winner Group G", away_team_label: "3rd Group A/E/H/I/J" },
	{ id: "83", type: "r32", local_date: "07/02/2026 19:00", stadium_id: "12", home_team_label: "Runner-up Group K", away_team_label: "Runner-up Group L" },
	{ id: "84", type: "r32", local_date: "07/02/2026 12:00", stadium_id: "16", home_team_label: "Winner Group H", away_team_label: "Runner-up Group J" },
	{ id: "85", type: "r32", local_date: "07/02/2026 20:00", stadium_id: "13", home_team_label: "Winner Group B", away_team_label: "3rd Group E/F/G/I/J" },
	{ id: "86", type: "r32", local_date: "07/03/2026 18:00", stadium_id: "8", home_team_label: "Winner Group J", away_team_label: "Runner-up Group H" },
	{ id: "87", type: "r32", local_date: "07/03/2026 20:30", stadium_id: "6", home_team_label: "Winner Group K", away_team_label: "3rd Group D/E/I/J/L" },
	{ id: "88", type: "r32", local_date: "07/03/2026 13:00", stadium_id: "4", home_team_label: "Runner-up Group D", away_team_label: "Runner-up Group G" },
	{ id: "89", type: "r16", local_date: "07/04/2026 17:00", stadium_id: "10", home_team_label: "Winner Match 74", away_team_label: "Winner Match 77" },
	{ id: "90", type: "r16", local_date: "07/04/2026 12:00", stadium_id: "5", home_team_label: "Winner Match 73", away_team_label: "Winner Match 75" },
	{ id: "91", type: "r16", local_date: "07/05/2026 16:00", stadium_id: "11", home_team_label: "Winner Match 76", away_team_label: "Winner Match 78" },
	{ id: "92", type: "r16", local_date: "07/05/2026 18:00", stadium_id: "1", home_team_label: "Winner Match 79", away_team_label: "Winner Match 80" },
	{ id: "93", type: "r16", local_date: "07/06/2026 14:00", stadium_id: "4", home_team_label: "Winner Match 83", away_team_label: "Winner Match 84" },
	{ id: "94", type: "r16", local_date: "07/06/2026 17:00", stadium_id: "14", home_team_label: "Winner Match 81", away_team_label: "Winner Match 82" },
	{ id: "95", type: "r16", local_date: "07/07/2026 12:00", stadium_id: "7", home_team_label: "Winner Match 86", away_team_label: "Winner Match 88" },
	{ id: "96", type: "r16", local_date: "07/07/2026 13:00", stadium_id: "13", home_team_label: "Winner Match 85", away_team_label: "Winner Match 87" },
	{ id: "97", type: "qf", local_date: "07/09/2026 16:00", stadium_id: "9", home_team_label: "Winner Match 89", away_team_label: "Winner Match 90" },
	{ id: "98", type: "qf", local_date: "07/10/2026 12:00", stadium_id: "16", home_team_label: "Winner Match 93", away_team_label: "Winner Match 94" },
	{ id: "99", type: "qf", local_date: "07/11/2026 17:00", stadium_id: "8", home_team_label: "Winner Match 91", away_team_label: "Winner Match 92" },
	{ id: "100", type: "qf", local_date: "07/11/2026 20:00", stadium_id: "6", home_team_label: "Winner Match 95", away_team_label: "Winner Match 96" },
	{ id: "101", type: "sf", local_date: "07/14/2026 14:00", stadium_id: "4", home_team_label: "Winner Match 97", away_team_label: "Winner Match 98" },
	{ id: "102", type: "sf", local_date: "07/15/2026 15:00", stadium_id: "7", home_team_label: "Winner Match 99", away_team_label: "Winner Match 100" },
	{ id: "104", type: "final", local_date: "07/19/2026 15:00", stadium_id: "11", home_team_label: "Winner Match 101", away_team_label: "Winner Match 102" },
];

function normalizeTimezone(value?: string) {
	const normalized = String(value || DEFAULT_TIMEZONE).trim();
	return normalized || DEFAULT_TIMEZONE;
}

function normalizeArray<T>(value: unknown): T[] {
	if (Array.isArray(value)) return value as T[];
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		for (const key of ["data", "result", "results", "items", "games", "groups", "teams", "stadiums"]) {
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
	if (!timestamp) {
		return {
			dateLabel: "TBA",
			timeLabel: "TBA",
		};
	}

	const date = new Date(timestamp);
	const month = new Intl.DateTimeFormat("en-US", {
		month: "short",
		timeZone: "UTC",
	}).format(date);
	const day = new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		timeZone: "UTC",
	}).format(date);
	const time = new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "UTC",
	}).format(date);

	return {
		dateLabel: `${month} ${day}`,
		timeLabel: time,
	};
}

function stageLabel(type: string) {
	if (type === "r32") return "Round of 32";
	if (type === "r16") return "Round of 16";
	if (type === "qf") return "Quarter-final";
	if (type === "sf") return "Semi-final";
	if (type === "third") return "3rd Place";
	return "Final";
}

function compactSeedLabel(label: string) {
	const winnerGroupMatch = label.match(/^Winner Group ([A-Z])$/i);
	if (winnerGroupMatch) return `1${winnerGroupMatch[1].toUpperCase()}`;

	const runnerUpGroupMatch = label.match(/^Runner-up Group ([A-Z])$/i);
	if (runnerUpGroupMatch) return `2${runnerUpGroupMatch[1].toUpperCase()}`;

	const thirdGroupMatch = label.match(/^3rd Group ([A-Z/]+)$/i);
	if (thirdGroupMatch) return `3${thirdGroupMatch[1].toUpperCase()}`;

	return "";
}

function compactPathLabel(label: string) {
	const normalized = toText(label, "");
	if (!normalized) return "";

	const seed = compactSeedLabel(normalized);
	if (seed) return seed;

	const winnerMatch = normalized.match(/^Winner Match (\d+)$/i);
	if (winnerMatch) return `W M${winnerMatch[1]}`;

	const loserMatch = normalized.match(/^Loser Match (\d+)$/i);
	if (loserMatch) return `L M${loserMatch[1]}`;

	return normalized.toUpperCase();
}

function formatUpdatedHeader(value: Date, timeZone: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone,
	})
		.format(value)
		.replace(/\u200e/g, "")
		.toUpperCase();
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

function isStarted(match: ApiMatch) {
	return isLive(match) || isFinished(match);
}

function shortVenueName(stadium: ApiStadium | StadiumMeta | undefined) {
	if (!stadium) return "Venue TBA";
	const city = toText((stadium as ApiStadium).city_en || (stadium as StadiumMeta).city, "Venue TBA")
		.split(" (")[0]
		.replace("New York/New Jersey", "New York/NJ")
		.replace("San Francisco Bay Area", "San Francisco");
	return city || "Venue TBA";
}

function fullVenueName(stadium: ApiStadium | StadiumMeta | undefined) {
	if (!stadium) return "Venue TBA";
	return toText(
		(stadium as ApiStadium).fifa_name ||
			(stadium as StadiumMeta).fifaName ||
			(stadium as ApiStadium).name_en,
		"Venue TBA",
	);
}

function locationLabel(stadium: ApiStadium | StadiumMeta | undefined) {
	if (!stadium) return "Venue TBA";
	const city = toText((stadium as ApiStadium).city_en || (stadium as StadiumMeta).city, "Venue TBA");
	const country = toText(
		(stadium as ApiStadium).country_en || (stadium as StadiumMeta).country,
		"",
	);
	return country ? `${city}, ${country}` : city;
}

function makeTeamsById(apiTeams: ApiTeam[]) {
	const teams = apiTeams.length > 0 ? apiTeams : FALLBACK_TEAMS;
	return new Map<string, TeamMeta>(
		teams.map((team) => {
			const apiTeam = team as ApiTeam;
			const fallbackTeam = team as TeamMeta;
			const id = toId(team.id);
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

function makeStadiumsById(apiStadiums: ApiStadium[]) {
	const stadiums = apiStadiums.length > 0 ? apiStadiums : FALLBACK_STADIUMS;
	return new Map<string, StadiumMeta>(
		stadiums.map((stadium) => {
			const apiStadium = stadium as ApiStadium;
			const fallbackStadium = stadium as StadiumMeta;
			const id = toId(stadium.id);
			return [
				id,
				{
					id,
					shortName: shortVenueName(apiStadium.id ? apiStadium : fallbackStadium),
					fifaName: fullVenueName(apiStadium.id ? apiStadium : fallbackStadium),
					city: toText(apiStadium.city_en || fallbackStadium.city, "Venue TBA"),
					country: toText(
						apiStadium.country_en || fallbackStadium.country,
						"",
					),
				},
			];
		}),
	);
}

function pickTeamName(
	idValue: unknown,
	explicitName: unknown,
	labelValue: unknown,
	teamsById: Map<string, TeamMeta>,
) {
	const id = toId(idValue);
	const explicit = toText(explicitName, "");
	if (explicit) return explicit;
	const team = teamsById.get(id);
	if (team) return team.name;
	return toText(labelValue, id === "0" ? "TBD" : `Team ${id}`);
}

function normalizeBracketMatch(
	match: ApiMatch,
	teamsById: Map<string, TeamMeta>,
	stadiumsById: Map<string, StadiumMeta>,
): BracketMatch {
	const round = toText(match.type, "final").toLowerCase() as BracketRound;
	const live = isLive(match);
	const finished = isFinished(match);
	const homeSourceLabel = toText(match.home_team_label, "");
	const awaySourceLabel = toText(match.away_team_label, "");
	const homeKnown =
		toId(match.home_team_id) !== "0" ||
		Boolean(toText(match.home_team_name_en, ""));
	const awayKnown =
		toId(match.away_team_id) !== "0" ||
		Boolean(toText(match.away_team_name_en, ""));
	const homeScore = isStarted(match) ? String(toNumber(match.home_score)) : "-";
	const awayScore = isStarted(match) ? String(toNumber(match.away_score)) : "-";
	const elapsed = toText(match.time_elapsed, "");
	const { dateLabel, timeLabel } = formatLocalDate(match.local_date);
	const stadium = stadiumsById.get(toId(match.stadium_id));
	const venueShort = stadium?.shortName || "Venue TBA";
	const venueFull = stadium?.fifaName || "Venue TBA";
	const location = stadium
		? `${stadium.shortName}, ${stadium.country}`
		: "Venue TBA";

	return {
		id: toText(match.id, "?"),
		round,
		stageLabel: stageLabel(round),
		venueShort,
		venueFull,
		locationLabel: location,
		dateLabel,
		timeLabel,
		metaLabel: `${venueShort} ${dateLabel} ${timeLabel}`,
		statusLabel: live ? `${elapsed}'` : finished ? "Final" : "Scheduled",
		home: {
			name: pickTeamName(
				match.home_team_id,
				match.home_team_name_en,
				match.home_team_label,
				teamsById,
			),
			score: homeScore,
			seedLabel: compactSeedLabel(homeSourceLabel),
			pathLabel: compactPathLabel(homeSourceLabel),
			isKnown: homeKnown,
		},
		away: {
			name: pickTeamName(
				match.away_team_id,
				match.away_team_name_en,
				match.away_team_label,
				teamsById,
			),
			score: awayScore,
			seedLabel: compactSeedLabel(awaySourceLabel),
			pathLabel: compactPathLabel(awaySourceLabel),
			isKnown: awayKnown,
		},
		compactLabel:
			round === "final" || round === "third"
				? `${compactPathLabel(homeSourceLabel)} VS ${compactPathLabel(awaySourceLabel)}`
				: `${compactPathLabel(homeSourceLabel)} / ${compactPathLabel(awaySourceLabel)}`,
		isLive: live,
		isFinished: finished,
		sortTime: parseWorldCupDate(match.local_date),
	};
}

function ensureBracketMatches(apiMatches: ApiMatch[]) {
	const rawMatches = apiMatches.length > 0 ? apiMatches : FALLBACK_MATCHES;
	const map = new Map<string, ApiMatch>(
		rawMatches
			.filter((match) => {
				return KNOCKOUT_IDS.has(toText(match.id, ""));
			})
			.map((match) => [toText(match.id, "?"), match]),
	);

	for (const fallback of FALLBACK_MATCHES) {
		const id = toText(fallback.id, "?");
		if (!map.has(id)) {
			map.set(id, fallback);
		}
	}

	return map;
}

function pickNextMatch(matches: BracketMatch[]) {
	const sorted = [...matches].sort((a, b) => a.sortTime - b.sortTime);
	const now = Date.now();
	const live = sorted.find((match) => match.isLive);
	if (live) {
		return { nextMatch: live, nextLabel: "Live Now" };
	}

	const nextUpcoming =
		sorted.find((match) => !match.isFinished && match.sortTime >= now) ||
		sorted.find((match) => !match.isFinished) ||
		sorted[sorted.length - 1];

	return {
		nextMatch: nextUpcoming,
		nextLabel: nextUpcoming.isFinished ? "Latest Result" : "Next Up",
	};
}

function matchForId(id: string, matchesById: Map<string, BracketMatch>) {
	const match = matchesById.get(id);
	if (!match) {
		throw new Error(`Missing knockout match ${id}`);
	}
	return match;
}

export default async function getData(
	params?: WorldCupParams,
): Promise<WorldCupBracketData> {
	const timezone = normalizeTimezone(params?.timezone);

	try {
		const [teamsResult, stadiumsResult, matchesResult] = await Promise.all([
			fetchWorldCupArray<ApiTeam>("/get/teams", "football.teams.json"),
			fetchWorldCupArray<ApiStadium>("/get/stadiums", "football.stadiums.json"),
			fetchWorldCupArray<ApiMatch>(
				"/get/games",
				"football.matches.json",
				LIVE_GAMES_TIMEOUT_MS,
			),
		]);

		const teamsById = makeTeamsById(teamsResult.data);
		const stadiumsById = makeStadiumsById(stadiumsResult.data);
		const sourceMatches = ensureBracketMatches(matchesResult.data);
		const normalizedMatches = new Map<string, BracketMatch>(
			[...sourceMatches.values()].map((match) => [
				toText(match.id, "?"),
				normalizeBracketMatch(match, teamsById, stadiumsById),
			]),
		);
		const bracketMatches = [...normalizedMatches.values()].filter((match) =>
			KNOCKOUT_IDS.has(match.id),
		);
		const { nextMatch, nextLabel } = pickNextMatch(bracketMatches);

		return {
			title: "FIFA World Cup 2026",
			subtitle: "Knockout Bracket",
			updatedAt: formatUpdatedHeader(new Date(), timezone),
			nextLabel,
			nextMatch,
			highlightMatchId: nextMatch.id,
			left: {
				roundOf32: LEFT_R32_IDS.map((id) => matchForId(id, normalizedMatches)),
				roundOf16: LEFT_R16_IDS.map((id) => matchForId(id, normalizedMatches)),
				quarterFinals: LEFT_QF_IDS.map((id) => matchForId(id, normalizedMatches)),
				semiFinal: matchForId(LEFT_SF_ID, normalizedMatches),
			},
			right: {
				roundOf32: RIGHT_R32_IDS.map((id) => matchForId(id, normalizedMatches)),
				roundOf16: RIGHT_R16_IDS.map((id) => matchForId(id, normalizedMatches)),
				quarterFinals: RIGHT_QF_IDS.map((id) => matchForId(id, normalizedMatches)),
				semiFinal: matchForId(RIGHT_SF_ID, normalizedMatches),
			},
			final: matchForId(FINAL_ID, normalizedMatches),
			thirdPlace: matchForId(THIRD_PLACE_ID, normalizedMatches),
		};
	} catch (error) {
		console.error("Error loading World Cup 2026 bracket data:", error);

		const teamsById = makeTeamsById([]);
		const stadiumsById = makeStadiumsById([]);
		const normalizedMatches = new Map<string, BracketMatch>(
			FALLBACK_MATCHES.map((match) => [
				toText(match.id, "?"),
				normalizeBracketMatch(match, teamsById, stadiumsById),
			]),
		);
		const bracketMatches = [...normalizedMatches.values()];
		const { nextMatch, nextLabel } = pickNextMatch(bracketMatches);

		return {
			title: "FIFA World Cup 2026",
			subtitle: "Knockout Bracket",
			updatedAt: formatUpdatedHeader(new Date(), timezone),
			nextLabel,
			nextMatch,
			highlightMatchId: nextMatch.id,
			left: {
				roundOf32: LEFT_R32_IDS.map((id) => matchForId(id, normalizedMatches)),
				roundOf16: LEFT_R16_IDS.map((id) => matchForId(id, normalizedMatches)),
				quarterFinals: LEFT_QF_IDS.map((id) => matchForId(id, normalizedMatches)),
				semiFinal: matchForId(LEFT_SF_ID, normalizedMatches),
			},
			right: {
				roundOf32: RIGHT_R32_IDS.map((id) => matchForId(id, normalizedMatches)),
				roundOf16: RIGHT_R16_IDS.map((id) => matchForId(id, normalizedMatches)),
				quarterFinals: RIGHT_QF_IDS.map((id) => matchForId(id, normalizedMatches)),
				semiFinal: matchForId(RIGHT_SF_ID, normalizedMatches),
			},
			final: matchForId(FINAL_ID, normalizedMatches),
			thirdPlace: matchForId(THIRD_PLACE_ID, normalizedMatches),
		};
	}
}

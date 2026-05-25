import {
	fetchJsonWithTimeout,
	formatDateTime,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";
import {
	getTeamBadgeLabel,
	getTrackImageUrl,
	safeLower,
} from "@/app/(app)/recipes/screens/f1-race-standings/f1-assets";

export const dynamic = "force-dynamic";

type F1Session = {
	session_key: number | null;
	meeting_key: number | null;
	session_name: string | null;
	session_type: string | null;
	date_start: string | null;
	circuit_short_name?: string | null;
	country_name?: string | null;
	location?: string | null;
	status?: string | null;
	year?: number;
	is_cancelled?: boolean;
};

type ChampionshipDriver = {
	driver_number: number | null;
	position_current: number | null;
	points_current: number | null;
};

type DriverMeta = {
	driver_number: number | null;
	full_name: string | null;
	name_acronym: string | null;
	team_name: string | null;
	team_colour?: string | null;
	headshot_url?: string | null;
	country_name?: string | null;
	status?: string | null;
};

type ChampionshipTeam = {
	team_name: string | null;
	position_current: number | null;
	points_current: number | null;
	country_name?: string | null;
	status?: string | null;
};

type SessionSummary = {
	day: string;
	label: string;
	time: string;
};

type DriverStanding = {
	position: number;
	name: string;
	team: string;
	points: number;
	headshotUrl?: string;
	teamBadge: string;
};

type TeamStanding = {
	position: number;
	team: string;
	points: number;
	teamBadge: string;
};

export type F1RaceStandingsRecipeData = {
	title: string;
	seasonLabel: string;
	nextRaceName: string;
	nextRaceDate: string;
	nextRaceRound: string;
	nextRaceTrackImageUrl?: string | null;
	schedule: SessionSummary[];
	driverStandings: DriverStanding[];
	teamStandings: TeamStanding[];
	updatedAt: string;
	note?: string;
};

function isRateLimitError(error: unknown) {
	return error instanceof Error && error.message.includes("status 429");
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOpenF1Json<T>(url: string) {
	let lastError: unknown;

	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			return await fetchJsonWithTimeout<T>(
				url,
				{ headers: { Accept: "application/json" } },
				10000,
			);
		} catch (error) {
			lastError = error;
			if (!isRateLimitError(error) || attempt === 2) {
				throw error;
			}
			await sleep(600 * (attempt + 1));
		}
	}

	throw lastError;
}

function parseRaceRound(races: F1Session[], nextRace: F1Session) {
	const index = races.findIndex(
		(race) => race.session_key === nextRace.session_key,
	);
	return `Round ${index + 1}`;
}

function toSafeText(value: unknown, fallback: string) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed || fallback;
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}
	return fallback;
}

function toSafeNumber(value: unknown, fallback = 0) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeSessionSummary(value: Partial<SessionSummary> | null | undefined) {
	return {
		day: toSafeText(value?.day, "TBA"),
		label: toSafeText(value?.label, "Session pending"),
		time: toSafeText(value?.time, "TBA"),
	};
}

function sanitizeDriverStanding(
	value: Partial<DriverStanding> | null | undefined,
	index: number,
): DriverStanding {
	const position = Math.max(1, Math.round(toSafeNumber(value?.position, index + 1)));
	const name = toSafeText(value?.name, `Driver ${position}`);
	const team = toSafeText(value?.team, "Unknown");
	return {
		position,
		name,
		team,
		points: Math.max(0, Math.round(toSafeNumber(value?.points, 0))),
		headshotUrl: typeof value?.headshotUrl === "string" ? value.headshotUrl : undefined,
		teamBadge: toSafeText(value?.teamBadge, getTeamBadgeLabel(team)),
	};
}

function sanitizeTeamStanding(
	value: Partial<TeamStanding> | null | undefined,
	index: number,
): TeamStanding {
	const position = Math.max(1, Math.round(toSafeNumber(value?.position, index + 1)));
	const team = toSafeText(value?.team, "Unknown");
	return {
		position,
		team,
		points: Math.max(0, Math.round(toSafeNumber(value?.points, 0))),
		teamBadge: toSafeText(value?.teamBadge, getTeamBadgeLabel(team)),
	};
}

export default async function getData(): Promise<F1RaceStandingsRecipeData> {
	const year = new Date().getUTCFullYear();

	try {
		const races = await fetchOpenF1Json<F1Session[]>(
			`https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`,
		);
		const sortedRaces = [...races].sort(
			(a, b) =>
				new Date(toSafeText(a.date_start, "")).getTime() -
				new Date(toSafeText(b.date_start, "")).getTime(),
		);
		const now = Date.now();
		const nextRace =
			sortedRaces.find(
				(race) =>
					!race.is_cancelled &&
					new Date(toSafeText(race.date_start, "")).getTime() >=
						now - 6 * 60 * 60 * 1000,
			) || sortedRaces[sortedRaces.length - 1];
		const completedRace =
			[...sortedRaces]
				.reverse()
				.find(
					(race) =>
						!race.is_cancelled &&
						new Date(toSafeText(race.date_start, "")).getTime() <= now,
				) || nextRace;

		const [weekendSessions, driverStandingsRaw, driversMeta, teamStandingsRaw] =
			await Promise.all([
				fetchOpenF1Json<F1Session[]>(
					`https://api.openf1.org/v1/sessions?meeting_key=${toSafeNumber(nextRace.meeting_key)}`,
				),
				fetchOpenF1Json<ChampionshipDriver[]>(
					`https://api.openf1.org/v1/championship_drivers?session_key=${toSafeNumber(completedRace.session_key)}`,
				),
				fetchOpenF1Json<DriverMeta[]>(
					`https://api.openf1.org/v1/drivers?session_key=${toSafeNumber(completedRace.session_key)}`,
				),
				fetchOpenF1Json<ChampionshipTeam[]>(
					`https://api.openf1.org/v1/championship_teams?session_key=${toSafeNumber(completedRace.session_key)}`,
				).catch(() => []),
			]);

		const driversByNumber = new Map(
			driversMeta
				.filter((driver) => typeof driver.driver_number === "number")
				.map((driver) => [driver.driver_number as number, driver]),
		);

		const driverStandings = driverStandingsRaw
			.filter((entry) => entry.position_current != null)
			.sort((a, b) => (a.position_current || 999) - (b.position_current || 999))
			.slice(0, 5)
			.map((entry, index) => {
				const driverNumber = toSafeNumber(entry.driver_number, 0);
				const driverMeta = driversByNumber.get(driverNumber);
				return sanitizeDriverStanding(
					{
						position: entry.position_current || index + 1,
						name: toSafeText(driverMeta?.full_name, `Driver ${driverNumber}`),
						team: toSafeText(driverMeta?.team_name, "Unknown"),
						points: Math.round(entry.points_current || 0),
						headshotUrl:
							typeof driverMeta?.headshot_url === "string"
								? driverMeta.headshot_url
								: undefined,
						teamBadge: getTeamBadgeLabel(driverMeta?.team_name || "Unknown"),
					},
					index,
				);
			});

		const teamStandings =
			teamStandingsRaw.length > 0
				? teamStandingsRaw
						.filter((entry) => entry.position_current != null)
						.sort(
							(a, b) =>
								(a.position_current || 999) - (b.position_current || 999),
						)
						.map((entry, index) =>
							sanitizeTeamStanding(
								{
									position: entry.position_current || index + 1,
									team: toSafeText(entry.team_name, "Unknown"),
									points: Math.round(entry.points_current || 0),
									teamBadge: getTeamBadgeLabel(entry.team_name || "Unknown"),
								},
								index,
							),
						)
				: (() => {
						const teamTotals = new Map<string, number>();
						for (const entry of driverStandingsRaw) {
							const meta = driversByNumber.get(toSafeNumber(entry.driver_number));
							if (!meta?.team_name) continue;
							teamTotals.set(
								meta.team_name,
								(teamTotals.get(meta.team_name) || 0) +
									Math.round(entry.points_current || 0),
							);
						}

						return [...teamTotals.entries()]
							.sort((a, b) => b[1] - a[1])
							.map(([team, points], index) =>
								sanitizeTeamStanding(
									{
										position: index + 1,
										team,
										points,
										teamBadge: getTeamBadgeLabel(team),
									},
									index,
								),
							);
					})();

		const schedule = [...weekendSessions]
			.sort(
				(a, b) =>
					new Date(toSafeText(a.date_start, "")).getTime() -
					new Date(toSafeText(b.date_start, "")).getTime(),
			)
			.slice(0, 5)
			.map((session) =>
				sanitizeSessionSummary({
					day: formatDateTime(toSafeText(session.date_start, new Date().toISOString()), {
						weekday: "long",
					}),
					label: toSafeText(session.session_name, "Session pending"),
					time: formatDateTime(
						toSafeText(session.date_start, new Date().toISOString()),
						{
							hour: "numeric",
							minute: "2-digit",
						},
					),
				}),
			);

		const safeCountry = toSafeText(nextRace.country_name, "");
		const safeStatus = safeLower(nextRace.status);
		const safeLocation = toSafeText(nextRace.location, "Unknown circuit");
		const safeCircuit = toSafeText(nextRace.circuit_short_name, safeLocation);

		return {
			title: "F1 Race + Standings",
			seasonLabel: `${year} season`,
			nextRaceName: `${safeCircuit} Grand Prix`,
			nextRaceDate: formatDateTime(toSafeText(nextRace.date_start, new Date().toISOString()), {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			}),
			nextRaceRound: parseRaceRound(sortedRaces, nextRace),
			nextRaceTrackImageUrl: getTrackImageUrl(
				nextRace.circuit_short_name,
				nextRace.location,
				safeCountry,
			),
			schedule: schedule.map(sanitizeSessionSummary),
			driverStandings: driverStandings.map(sanitizeDriverStanding),
			teamStandings: teamStandings.map(sanitizeTeamStanding),
			updatedAt: formatUpdatedAt(new Date()),
			note:
				teamStandingsRaw.length > 0
					? "Standings and driver profiles via OpenF1."
					: `Standings via OpenF1; team totals derived from driver points${safeStatus ? ` (${safeStatus})` : ""}.`,
		};
	} catch (error) {
		if (isRateLimitError(error)) {
			console.warn("OpenF1 rate limited the request; using fallback data.");
		} else {
			console.error("Error loading F1 standings data:", error);
		}
		const fallbackData: F1RaceStandingsRecipeData = {
			title: "F1 Race + Standings",
			seasonLabel: `${year} season`,
			nextRaceName: "Miami Grand Prix",
			nextRaceDate: "May 03, 5:00 PM",
			nextRaceRound: "Round 4",
			nextRaceTrackImageUrl: getTrackImageUrl("Miami"),
			schedule: [
				{ day: "Friday", label: "Practice 1", time: "6:30 PM" },
				{ day: "Saturday", label: "Sprint", time: "6:00 PM" },
				{ day: "Saturday", label: "Qualifying", time: "10:00 PM" },
				{ day: "Sunday", label: "Race", time: "10:00 PM" },
			],
			driverStandings: [
				{
					position: 1,
					name: "Kimi Antonelli",
					team: "Mercedes",
					points: 72,
					teamBadge: "M",
				},
				{
					position: 2,
					name: "George Russell",
					team: "Mercedes",
					points: 63,
					teamBadge: "M",
				},
				{
					position: 3,
					name: "Charles Leclerc",
					team: "Ferrari",
					points: 49,
					teamBadge: "F",
				},
				{
					position: 4,
					name: "Lewis Hamilton",
					team: "Ferrari",
					points: 41,
					teamBadge: "F",
				},
				{
					position: 5,
					name: "Lando Norris",
					team: "McLaren",
					points: 25,
					teamBadge: "Mc",
				},
			],
			teamStandings: [
				{ position: 1, team: "Mercedes", points: 135, teamBadge: "M" },
				{ position: 2, team: "Ferrari", points: 90, teamBadge: "F" },
				{ position: 3, team: "McLaren", points: 46, teamBadge: "Mc" },
				{ position: 4, team: "Red Bull Racing", points: 41, teamBadge: "RB" },
				{ position: 5, team: "Alpine", points: 28, teamBadge: "A" },
				{ position: 6, team: "Aston Martin", points: 24, teamBadge: "AM" },
				{ position: 7, team: "Williams", points: 19, teamBadge: "W" },
				{ position: 8, team: "Racing Bulls", points: 16, teamBadge: "RB" },
				{ position: 9, team: "Haas", points: 13, teamBadge: "H" },
				{ position: 10, team: "Audi", points: 9, teamBadge: "Au" },
				{ position: 11, team: "Cadillac", points: 3, teamBadge: "Ca" },
			],
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live F1 fetch failed, so this preview is showing sample standings.",
		};
		return {
			...fallbackData,
			nextRaceName: toSafeText(fallbackData.nextRaceName, "Grand Prix"),
			nextRaceDate: toSafeText(fallbackData.nextRaceDate, "TBA"),
			nextRaceRound: toSafeText(fallbackData.nextRaceRound, "Round ?"),
			nextRaceTrackImageUrl: fallbackData.nextRaceTrackImageUrl || null,
			schedule: fallbackData.schedule.map(sanitizeSessionSummary),
			driverStandings: fallbackData.driverStandings.map(sanitizeDriverStanding),
			teamStandings: fallbackData.teamStandings.map(sanitizeTeamStanding),
			note: toSafeText(
				fallbackData.note,
				"Live F1 fetch failed, so this preview is showing sample standings.",
			),
		};
	}
}

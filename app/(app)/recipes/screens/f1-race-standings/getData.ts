import {
	fetchJsonWithTimeout,
	formatDateTime,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";
import {
	getTeamBadgeLabel,
	getTrackImageUrl,
} from "@/app/(app)/recipes/screens/f1-race-standings/f1-assets";

export const dynamic = "force-dynamic";

type F1Session = {
	session_key: number;
	meeting_key: number;
	session_name: string;
	session_type: string;
	date_start: string;
	circuit_short_name?: string;
	country_name?: string;
	location?: string;
	year?: number;
	is_cancelled?: boolean;
};

type ChampionshipDriver = {
	driver_number: number;
	position_current: number | null;
	points_current: number | null;
};

type DriverMeta = {
	driver_number: number;
	full_name: string;
	name_acronym: string;
	team_name: string;
	team_colour?: string;
	headshot_url?: string;
};

type ChampionshipTeam = {
	team_name: string;
	position_current: number | null;
	points_current: number | null;
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

function parseRaceRound(races: F1Session[], nextRace: F1Session) {
	const index = races.findIndex(
		(race) => race.session_key === nextRace.session_key,
	);
	return `Round ${index + 1}`;
}

export default async function getData(): Promise<F1RaceStandingsRecipeData> {
	const year = new Date().getUTCFullYear();

	try {
		const races = await fetchJsonWithTimeout<F1Session[]>(
			`https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`,
			{ headers: { Accept: "application/json" } },
			10000,
		);
		const sortedRaces = [...races].sort(
			(a, b) =>
				new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
		);
		const now = Date.now();
		const nextRace =
			sortedRaces.find(
				(race) =>
					!race.is_cancelled &&
					new Date(race.date_start).getTime() >= now - 6 * 60 * 60 * 1000,
			) || sortedRaces[sortedRaces.length - 1];
		const completedRace =
			[...sortedRaces]
				.reverse()
				.find(
					(race) =>
						!race.is_cancelled && new Date(race.date_start).getTime() <= now,
				) || nextRace;

		const [weekendSessions, driverStandingsRaw, driversMeta, teamStandingsRaw] =
			await Promise.all([
				fetchJsonWithTimeout<F1Session[]>(
					`https://api.openf1.org/v1/sessions?meeting_key=${nextRace.meeting_key}`,
					{ headers: { Accept: "application/json" } },
					10000,
				),
				fetchJsonWithTimeout<ChampionshipDriver[]>(
					`https://api.openf1.org/v1/championship_drivers?session_key=${completedRace.session_key}`,
					{ headers: { Accept: "application/json" } },
					10000,
				),
				fetchJsonWithTimeout<DriverMeta[]>(
					`https://api.openf1.org/v1/drivers?session_key=${completedRace.session_key}`,
					{ headers: { Accept: "application/json" } },
					10000,
				),
				fetchJsonWithTimeout<ChampionshipTeam[]>(
					`https://api.openf1.org/v1/championship_teams?session_key=${completedRace.session_key}`,
					{ headers: { Accept: "application/json" } },
					10000,
				).catch(() => []),
			]);

		const driversByNumber = new Map(
			driversMeta.map((driver) => [driver.driver_number, driver]),
		);

		const driverStandings = driverStandingsRaw
			.filter((entry) => entry.position_current != null)
			.sort((a, b) => (a.position_current || 999) - (b.position_current || 999))
			.slice(0, 5)
			.map((entry) => ({
				position: entry.position_current || 0,
				name:
					driversByNumber.get(entry.driver_number)?.full_name ||
					`Driver ${entry.driver_number}`,
				team: driversByNumber.get(entry.driver_number)?.team_name || "Unknown",
				points: Math.round(entry.points_current || 0),
				headshotUrl: driversByNumber.get(entry.driver_number)?.headshot_url,
				teamBadge: getTeamBadgeLabel(
					driversByNumber.get(entry.driver_number)?.team_name || "Unknown",
				),
			}));

		const teamStandings =
			teamStandingsRaw.length > 0
				? teamStandingsRaw
						.filter((entry) => entry.position_current != null)
						.sort(
							(a, b) =>
								(a.position_current || 999) - (b.position_current || 999),
						)
						.slice(0, 5)
						.map((entry) => ({
							position: entry.position_current || 0,
							team: entry.team_name,
							points: Math.round(entry.points_current || 0),
							teamBadge: getTeamBadgeLabel(entry.team_name),
						}))
				: (() => {
						const teamTotals = new Map<string, number>();
						for (const entry of driverStandingsRaw) {
							const meta = driversByNumber.get(entry.driver_number);
							if (!meta?.team_name) continue;
							teamTotals.set(
								meta.team_name,
								(teamTotals.get(meta.team_name) || 0) +
									Math.round(entry.points_current || 0),
							);
						}

						return [...teamTotals.entries()]
							.sort((a, b) => b[1] - a[1])
							.slice(0, 5)
							.map(([team, points], index) => ({
								position: index + 1,
								team,
								points,
								teamBadge: getTeamBadgeLabel(team),
							}));
					})();

		const schedule = [...weekendSessions]
			.sort(
				(a, b) =>
					new Date(a.date_start).getTime() - new Date(b.date_start).getTime(),
			)
			.slice(0, 5)
			.map((session) => ({
				day: formatDateTime(session.date_start, { weekday: "long" }),
				label: session.session_name,
				time: formatDateTime(session.date_start, {
					hour: "numeric",
					minute: "2-digit",
				}),
			}));

		return {
			title: "F1 Race + Standings",
			seasonLabel: `${year} season`,
			nextRaceName: `${nextRace.circuit_short_name || nextRace.location} Grand Prix`,
			nextRaceDate: formatDateTime(nextRace.date_start, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			}),
			nextRaceRound: parseRaceRound(sortedRaces, nextRace),
			nextRaceTrackImageUrl: getTrackImageUrl(
				nextRace.circuit_short_name,
				nextRace.location,
			),
			schedule,
			driverStandings,
			teamStandings,
			updatedAt: formatUpdatedAt(new Date()),
			note:
				teamStandingsRaw.length > 0
					? "Standings and driver profiles via OpenF1."
					: "Standings via OpenF1; team totals derived from driver points.",
		};
	} catch (error) {
		console.error("Error loading F1 standings data:", error);
		return {
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
			],
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live F1 fetch failed, so this preview is showing sample standings.",
		};
	}
}

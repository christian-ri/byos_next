import type { F1RaceStandingsRecipeData } from "@/app/(app)/recipes/screens/f1-race-standings/getData";
import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";

function splitHeadline(value: string) {
	const words = value.trim().split(/\s+/).filter(Boolean);
	if (words.length <= 2) return [value];
	if (words.length === 3) return [words[0], words.slice(1).join(" ")];

	let bestIndex = 1;
	let bestDelta = Number.POSITIVE_INFINITY;
	for (let index = 1; index < words.length; index += 1) {
		const left = words.slice(0, index).join(" ");
		const right = words.slice(index).join(" ");
		const delta = Math.abs(left.length - right.length);
		if (delta < bestDelta) {
			bestDelta = delta;
			bestIndex = index;
		}
	}

	return [
		words.slice(0, bestIndex).join(" "),
		words.slice(bestIndex).join(" "),
	];
}

async function imageToDataUri(imageUrl?: string | null) {
	if (!imageUrl) return null;
	try {
		const parsed = new URL(imageUrl);
		return fetchImageUrlToDataUri(imageUrl, [parsed.hostname]);
	} catch {
		return null;
	}
}

function renderSharedCss() {
	return `
		.f1-screen {
			padding: 16px;
			background: #f3f1ee;
		}

		.f1-shell {
			height: 100%;
			display: flex;
			gap: 14px;
		}

		.f1-left {
			width: 286px;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}

		.f1-card {
			border: 2px solid #111;
			border-radius: 18px;
			background: #fff;
			padding: 14px;
			box-sizing: border-box;
			overflow: hidden;
		}

		.f1-hero {
			height: 198px;
			display: flex;
			flex-direction: column;
			gap: 10px;
			justify-content: space-between;
		}

		.f1-headline {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.f1-headline__line {
			font-size: 31px;
			line-height: 0.96;
			font-weight: 800;
			letter-spacing: -0.05em;
			text-transform: uppercase;
		}

		.f1-track {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.f1-track__art {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1px solid #111;
			background: #fbfaf7;
			overflow: hidden;
		}

		.f1-track__art img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			display: block;
			filter: grayscale(1) contrast(1.05);
		}

		.f1-main {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		.f1-main__header {
			display: flex;
			justify-content: space-between;
			align-items: end;
			gap: 12px;
		}

		.f1-panel {
			flex: 1;
			border: 2px solid #111;
			border-radius: 18px;
			background: #fff;
			padding: 16px;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: 10px;
			overflow: hidden;
		}

		.f1-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.f1-row {
			display: flex;
			align-items: center;
			gap: 12px;
			border: 2px solid #111;
			padding: 10px 12px;
			min-height: 58px;
			box-sizing: border-box;
			background: #fff;
		}

		.f1-rank {
			width: 24px;
			font-size: 22px;
			line-height: 1;
			font-weight: 800;
			text-align: center;
			flex-shrink: 0;
		}

		.f1-headshot {
			width: 42px;
			height: 42px;
			border-radius: 21px;
			border: 2px solid #111;
			overflow: hidden;
			flex-shrink: 0;
			background: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.f1-headshot img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
			filter: grayscale(1) contrast(1.06);
		}

		.f1-headshot--fallback {
			font-size: 11px;
			line-height: 1;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 0.08em;
		}

		.f1-row__main {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.f1-row__name {
			font-size: 19px;
			line-height: 1.05;
			font-weight: 800;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.f1-row__sub {
			font-size: 14px;
			line-height: 1;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.f1-points {
			min-width: 54px;
			text-align: right;
			flex-shrink: 0;
		}

		.f1-points__value {
			font-size: 24px;
			line-height: 1;
			font-weight: 800;
		}

		.f1-schedule-card {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.f1-schedule-entry {
			border-left: 6px solid #111;
			padding-left: 10px;
			display: flex;
			flex-direction: column;
			gap: 3px;
		}

		.f1-rest {
			border-top: 2px solid #111;
			padding-top: 10px;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.f1-rest__row {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			gap: 10px;
		}

		.f1-note {
			font-size: 13px;
			line-height: 1.25;
			font-weight: 600;
		}
	`;
}

function fallbackBadge(name: string) {
	return name
		.split(/\s+/)
		.map((part) => part[0] || "")
		.join("")
		.slice(0, 3)
		.toUpperCase();
}

export async function renderF1RaceStandingsRecipeHtml(
	data: F1RaceStandingsRecipeData,
) {
	const raceNameLines = splitHeadline(data.nextRaceName);
	const trackImage = await imageToDataUri(data.nextRaceTrackImageUrl);
	const drivers = await Promise.all(
		data.driverStandings.map(async (driver) => ({
			...driver,
			headshotDataUri: await imageToDataUri(driver.headshotUrl),
		})),
	);

	const bodyHtml = `
		<section class="screen f1-screen">
			<div class="f1-shell">
				<div class="f1-left">
					<section class="f1-card f1-hero">
						<div class="meta">F1 Driver Standings</div>
						<div class="f1-headline">
							${raceNameLines
								.map(
									(line) =>
										`<div class="f1-headline__line">${escapeHtml(line)}</div>`,
								)
								.join("")}
						</div>
						<div>
							<div class="description">${escapeHtml(data.nextRaceRound)}</div>
							<div class="footer">${escapeHtml(data.nextRaceDate)}</div>
						</div>
					</section>
					<section class="f1-card f1-track">
						${
							trackImage
								? `<div class="f1-track__art"><img src="${trackImage}" alt="${escapeHtml(data.nextRaceName)}" /></div>`
								: `<div class="f1-track__art"><div class="title title--small">${escapeHtml(data.nextRaceName)}</div></div>`
						}
						${data.note ? `<div class="f1-note">${escapeHtml(data.note)}</div>` : ""}
					</section>
				</div>
				<div class="f1-main">
					<div class="f1-main__header">
						<div class="title">Top Drivers</div>
						<div class="meta">${escapeHtml(data.seasonLabel.replace(" season", ""))}</div>
					</div>
					<section class="f1-panel">
						<div class="f1-list">
							${drivers
								.map(
									(driver) => `
										<div class="f1-row">
											<div class="f1-rank">${escapeHtml(String(driver.position))}</div>
											<div class="f1-headshot">
												${
													driver.headshotDataUri
														? `<img src="${driver.headshotDataUri}" alt="${escapeHtml(driver.name)}" />`
														: `<div class="f1-headshot--fallback">${escapeHtml(fallbackBadge(driver.name))}</div>`
												}
											</div>
											<div class="f1-row__main">
												<div class="f1-row__name">${escapeHtml(driver.name)}</div>
												<div class="f1-row__sub">${escapeHtml(driver.team)}</div>
											</div>
											<div class="f1-points">
												<div class="f1-points__value">${escapeHtml(String(driver.points))}</div>
												<div class="meta">pts</div>
											</div>
										</div>
									`,
								)
								.join("")}
						</div>
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title: "F1 Driver Standings",
		bodyHtml,
		extraCss: renderSharedCss(),
	});
}

export async function renderF1WeekendTeamsRecipeHtml(
	data: F1RaceStandingsRecipeData,
) {
	const scheduleEntries =
		data.schedule.length > 0
			? data.schedule.slice(0, 4)
			: [
					{
						day: "Friday",
						time: "TBA",
						label: "Weekend schedule pending",
					},
				];
	const bodyHtml = `
		<section class="screen f1-screen">
			<div class="f1-shell">
				<div class="f1-left" style="width:314px;">
					<section class="f1-card" style="display:flex; flex-direction:column; gap:10px;">
						<div class="meta">F1 Weekend</div>
						<div class="title" style="font-family: Georgia, serif; font-size: 30px; line-height: 1.04;">${escapeHtml(data.nextRaceName)}</div>
						<div class="description" style="white-space: pre-line;">${escapeHtml(`${data.nextRaceRound}\n${data.nextRaceDate}`)}</div>
					</section>
					<section class="f1-card f1-schedule-card">
						<div class="title title--small">Schedule</div>
						${scheduleEntries
							.map(
								(entry) => `
									<div class="f1-schedule-entry">
										<div class="description">${escapeHtml(entry.day)}</div>
										<div class="footer">${escapeHtml(entry.time)}</div>
										<div class="description">${escapeHtml(entry.label)}</div>
									</div>
								`,
							)
							.join("")}
					</section>
				</div>
				<div class="f1-main">
					<div class="f1-main__header">
						<div class="title">Constructor Standings</div>
						<div class="meta">${escapeHtml(data.seasonLabel.replace(" season", ""))}</div>
					</div>
					<section class="f1-panel">
						<div class="footer">Updated ${escapeHtml(data.updatedAt)}</div>
						<div class="f1-list">
							${data.teamStandings
								.slice(0, 4)
								.map(
									(team) => `
										<div class="f1-row" style="min-height:54px;">
											<div class="f1-rank">${escapeHtml(String(team.position))}</div>
											<div class="f1-row__main">
												<div class="f1-row__name">${escapeHtml(team.team)}</div>
												<div class="f1-row__sub">Constructor</div>
											</div>
											<div class="f1-points">
												<div class="f1-points__value">${escapeHtml(String(team.points))}</div>
											</div>
										</div>
									`,
								)
								.join("")}
						</div>
						<div class="f1-rest">
							<div class="meta">Rest of field</div>
							${data.teamStandings
								.slice(4, 9)
								.map(
									(team) => `
										<div class="f1-rest__row">
											<div class="description">${escapeHtml(`${team.position}. ${team.team}`)}</div>
											<div class="description">${escapeHtml(String(team.points))}</div>
										</div>
									`,
								)
								.join("")}
						</div>
						${data.note ? `<div class="f1-note">${escapeHtml(data.note)}</div>` : ""}
					</section>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title: "F1 Weekend + Constructors",
		bodyHtml,
		extraCss: renderSharedCss(),
	});
}

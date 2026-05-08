import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type OnThisDayParams = {
	language?: string;
	mode?: string;
	type?: string;
	showYearLarge?: string | boolean;
};

type FeedPage = {
	title?: string;
	description?: string;
	extract?: string;
	normalizedtitle?: string;
	content_urls?: {
		desktop?: {
			page?: string;
		};
	};
};

type FeedEntry = {
	year?: number;
	text?: string;
	pages?: FeedPage[];
};

type FeedResponse = {
	selected?: FeedEntry[];
	events?: FeedEntry[];
	births?: FeedEntry[];
	deaths?: FeedEntry[];
};

type OnThisDayItem = {
	year: string;
	text: string;
	context: string;
	sourceUrl?: string;
};

export type OnThisDayRecipeData = {
	title: string;
	dateLabel: string;
	updatedAt: string;
	mode: "highlight" | "top3";
	type: "selected" | "events" | "births" | "deaths";
	showYearLarge: boolean;
	language: string;
	items: OnThisDayItem[];
	note?: string;
};

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["yes", "true", "1", "on"].includes(normalized)) return true;
	if (["no", "false", "0", "off"].includes(normalized)) return false;
	return fallback;
}

function normalizeMode(value?: string): "highlight" | "top3" {
	return String(value || "")
		.trim()
		.toLowerCase() === "top3"
		? "top3"
		: "highlight";
}

function normalizeType(
	value?: string,
): "selected" | "events" | "births" | "deaths" {
	switch (
		String(value || "")
			.trim()
			.toLowerCase()
	) {
		case "events":
		case "births":
		case "deaths":
			return String(value).trim().toLowerCase() as
				| "events"
				| "births"
				| "deaths";
		default:
			return "selected";
	}
}

function buildFallback(
	mode: "highlight" | "top3",
	type: "selected" | "events" | "births" | "deaths",
	showYearLarge: boolean,
	language: string,
	note = "Live data currently unavailable.",
): OnThisDayRecipeData {
	return {
		title: "On This Day",
		dateLabel: new Intl.DateTimeFormat("en-US", {
			month: "long",
			day: "numeric",
		}).format(new Date()),
		updatedAt: formatUpdatedAt(new Date()),
		mode,
		type,
		showYearLarge,
		language,
		items: [
			{
				year: "1969",
				text: "Apollo 10 transmitted the first live color television pictures from space.",
				context: "Spaceflight milestone",
				sourceUrl: "",
			},
			{
				year: "1886",
				text: "Dr. John Pemberton sold the first glass of what became Coca-Cola in Atlanta.",
				context: "Business history",
				sourceUrl: "",
			},
			{
				year: "1945",
				text: "Victory in Europe Day marked the formal acceptance of Nazi Germany's surrender.",
				context: "World history",
				sourceUrl: "",
			},
		],
		note,
	};
}

function normalizeEntries(
	data: FeedResponse,
	type: OnThisDayRecipeData["type"],
) {
	const rawEntries =
		type === "selected" ? data.selected || data.events || [] : data[type] || [];

	return rawEntries
		.filter((entry) => entry?.text && entry?.year)
		.map((entry) => ({
			year: String(entry.year || ""),
			text: entry.text || "",
			context:
				entry.pages?.[0]?.normalizedtitle ||
				entry.pages?.[0]?.title ||
				entry.pages?.[0]?.description ||
				"Historical note",
			sourceUrl: entry.pages?.[0]?.content_urls?.desktop?.page,
		}));
}

export default async function getData(
	params?: OnThisDayParams,
): Promise<OnThisDayRecipeData> {
	const language =
		String(params?.language || "en")
			.trim()
			.toLowerCase() || "en";
	const mode = normalizeMode(params?.mode);
	const type = normalizeType(params?.type);
	const showYearLarge = parseBoolean(params?.showYearLarge, true);
	const now = new Date();
	const month = now.getUTCMonth() + 1;
	const day = now.getUTCDate();
	const dateLabel = new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
	}).format(now);

	try {
		const response = await fetchJsonWithTimeout<FeedResponse>(
			`https://api.wikimedia.org/feed/v1/wikipedia/${language}/onthisday/${type}/${month}/${day}`,
			{
				headers: {
					Accept: "application/json",
					"Api-User-Agent": "BYOS-Next/OnThisDay",
				},
			},
			10000,
		);
		const items = normalizeEntries(response, type);

		if (items.length === 0) {
			return buildFallback(
				mode,
				type,
				showYearLarge,
				language,
				"No feed items available for today.",
			);
		}

		return {
			title: "On This Day",
			dateLabel,
			updatedAt: formatUpdatedAt(new Date()),
			mode,
			type,
			showYearLarge,
			language,
			items: mode === "top3" ? items.slice(0, 3) : items.slice(0, 1),
			note: "Wikimedia's current On This Day feed is wrapped so the provider can be swapped later.",
		};
	} catch (error) {
		console.error("Error loading On This Day data:", error);
		return buildFallback(mode, type, showYearLarge, language);
	}
}

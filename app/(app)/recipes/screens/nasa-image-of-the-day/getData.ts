import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type NasaParams = {
	apiKey?: string;
};

type ApodResponse = {
	title?: string;
	explanation?: string;
	url?: string;
	hdurl?: string;
	media_type?: string;
	date?: string;
};

export type NasaImageOfDayRecipeData = {
	title: string;
	imageUrl: string;
	caption: string;
	date: string;
	updatedAt: string;
	note?: string;
};

const FALLBACK_IMAGE =
	"https://apod.nasa.gov/apod/image/2605/TrifidPillar_Hubble_960.jpg";

export default async function getData(
	params?: NasaParams,
): Promise<NasaImageOfDayRecipeData> {
	const apiKey = String(params?.apiKey || "DEMO_KEY").trim() || "DEMO_KEY";

	try {
		const response = await fetchJsonWithTimeout<ApodResponse>(
			`https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}`,
			{ headers: { Accept: "application/json" } },
			10000,
		);

		return {
			title: response.title || "NASA Image of the Day",
			imageUrl: response.hdurl || response.url || FALLBACK_IMAGE,
			caption: response.explanation || "NASA APOD",
			date: response.date || "",
			updatedAt: formatUpdatedAt(new Date()),
			note:
				response.media_type && response.media_type !== "image"
					? "Today’s APOD was not an image, so the latest still image fallback is shown."
					: "NASA Astronomy Picture of the Day.",
		};
	} catch (error) {
		console.error("Error loading NASA image of the day:", error);
		return {
			title: "NASA Image of the Day",
			imageUrl: FALLBACK_IMAGE,
			caption: "Dust pillars and jets in the Trifid Nebula.",
			date: new Date().toISOString().slice(0, 10),
			updatedAt: formatUpdatedAt(new Date()),
			note: "Live NASA APOD fetch failed, so this preview is showing fallback artwork.",
		};
	}
}

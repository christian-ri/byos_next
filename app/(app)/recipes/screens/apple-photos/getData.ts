import { formatUpdatedAt } from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type ApplePhotosParams = {
	sharedAlbumUrl?: string;
	albumName?: string;
	timezone?: string;
	showCaption?: string | boolean;
	showTimestamp?: string | boolean;
	fitMode?: string;
};

type IcloudDerivative = {
	checksum?: string;
	fileSize?: string | number;
	width?: string | number;
	height?: string | number;
};

type IcloudPhoto = {
	photoGuid: string;
	caption?: string;
	photoDate?: string;
	derivatives?: IcloudDerivative[];
};

type IcloudWebstreamResponse = {
	"X-Apple-MMe-Host"?: string;
	photos?: IcloudPhoto[];
};

type IcloudAssetItem = {
	url_location?: string;
	url_path?: string;
};

type IcloudAssetResponse = {
	items?: Record<string, IcloudAssetItem> | IcloudAssetItem[];
};

export type ApplePhotosRecipeData = {
	title: string;
	albumName: string;
	imageUrl: string;
	caption: string;
	updatedAt: string;
	note?: string;
	showCaption: boolean;
	showTimestamp: boolean;
	fitMode: "cover" | "contain";
};

const SAMPLE_IMAGE_URL = "https://byos-nextjs.vercel.app/album/london.png";
const DEFAULT_TIME_ZONE = "America/New_York";

function parseBoolean(value: string | boolean | undefined, fallback = true) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["false", "no", "off", "0"].includes(normalized)) return false;
	if (["true", "yes", "on", "1"].includes(normalized)) return true;
	return fallback;
}

function parseSharedAlbumToken(value?: string) {
	const trimmed = value?.trim();
	if (!trimmed) return "";

	if (!trimmed.includes("/") && !trimmed.includes("#")) {
		return trimmed;
	}

	const hash = trimmed.split("#").pop()?.trim();
	return hash || "";
}

function normalizeFitMode(value?: string): "cover" | "contain" {
	return value?.trim().toLowerCase() === "contain" ? "contain" : "cover";
}

function chooseLargestDerivative(photo: IcloudPhoto) {
	return [...(photo.derivatives || [])].sort(
		(a, b) => Number(b.fileSize || 0) - Number(a.fileSize || 0),
	)[0];
}

function choosePhoto(photos: IcloudPhoto[]) {
	return photos[Math.floor(Math.random() * photos.length)];
}

async function postIcloudJson<T>(
	host: string,
	token: string,
	path: "webstream" | "webasseturls",
	body: Record<string, unknown>,
): Promise<T> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(
			`https://${host}/${token}/sharedstreams/${path}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
				signal: controller.signal,
				next: { revalidate: 0 },
			},
		);

		const text = await response.text();
		if (!text) {
			throw new Error(`Apple Photos returned empty ${path} response`);
		}

		return JSON.parse(text) as T;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function loadWebstream(token: string) {
	const initial = await postIcloudJson<IcloudWebstreamResponse>(
		"sharedstreams.icloud.com",
		token,
		"webstream",
		{ streamCtag: null },
	);

	const host = initial["X-Apple-MMe-Host"];
	if (host && (!initial.photos || initial.photos.length === 0)) {
		return postIcloudJson<IcloudWebstreamResponse>(host, token, "webstream", {
			streamCtag: null,
		});
	}

	return initial;
}

function resolveAssetUrl(
	assets: IcloudAssetResponse,
	derivative?: IcloudDerivative,
) {
	const checksum = derivative?.checksum;
	const items = assets.items;
	if (!items) return "";

	if (!Array.isArray(items) && checksum && items[checksum]) {
		const item = items[checksum];
		return item.url_location && item.url_path
			? `https://${item.url_location}${item.url_path}`
			: "";
	}

	const assetItems = Array.isArray(items) ? items : Object.values(items);
	const matchingItem =
		assetItems.find((item) => checksum && item.url_path?.includes(checksum)) ||
		assetItems[0];

	return matchingItem?.url_location && matchingItem.url_path
		? `https://${matchingItem.url_location}${matchingItem.url_path}`
		: "";
}

function buildFallbackData(
	params: ApplePhotosParams | undefined,
	note: string,
): ApplePhotosRecipeData {
	const timeZone = String(params?.timezone || DEFAULT_TIME_ZONE).trim();
	return {
		title: "Apple Photos",
		albumName: String(params?.albumName || "Shared Album").trim(),
		imageUrl: SAMPLE_IMAGE_URL,
		caption: "Shared album preview",
		updatedAt: formatUpdatedAt(new Date(), timeZone),
		note,
		showCaption: parseBoolean(params?.showCaption, true),
		showTimestamp: parseBoolean(params?.showTimestamp, true),
		fitMode: normalizeFitMode(params?.fitMode),
	};
}

export default async function getData(
	params?: ApplePhotosParams,
): Promise<ApplePhotosRecipeData> {
	const token = parseSharedAlbumToken(params?.sharedAlbumUrl);
	const timeZone = String(params?.timezone || DEFAULT_TIME_ZONE).trim();

	if (!token) {
		return buildFallbackData(
			params,
			"Preview - add an iCloud Shared Album URL to show your photos.",
		);
	}

	try {
		const stream = await loadWebstream(token);
		const photos = stream.photos || [];
		if (photos.length === 0) {
			return buildFallbackData(
				params,
				"No photos were found in the shared album.",
			);
		}

		const photo = choosePhoto(photos);
		const derivative = chooseLargestDerivative(photo);
		const assets = await postIcloudJson<IcloudAssetResponse>(
			stream["X-Apple-MMe-Host"] || "sharedstreams.icloud.com",
			token,
			"webasseturls",
			{ photoGuids: [photo.photoGuid] },
		);
		const imageUrl = resolveAssetUrl(assets, derivative);

		if (!imageUrl) {
			return buildFallbackData(
				params,
				"Apple Photos returned photo metadata, but no image URL.",
			);
		}

		return {
			title: "Apple Photos",
			albumName: String(params?.albumName || "Shared Album").trim(),
			imageUrl,
			caption: photo.caption || "Random shared photo",
			updatedAt: formatUpdatedAt(new Date(), timeZone),
			note: `${photos.length} photos in shared album`,
			showCaption: parseBoolean(params?.showCaption, true),
			showTimestamp: parseBoolean(params?.showTimestamp, true),
			fitMode: normalizeFitMode(params?.fitMode),
		};
	} catch (error) {
		console.error("Error loading Apple Photos data:", error);
		return buildFallbackData(
			params,
			"Live Apple Photos fetch failed, so this preview is showing sample art.",
		);
	}
}

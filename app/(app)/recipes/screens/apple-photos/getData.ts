import {
	formatDateTime,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

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
	derivatives?: IcloudDerivative[] | Record<string, IcloudDerivative>;
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
	currentTime: string;
	timeZoneLabel: string;
	note?: string;
	showCaption: boolean;
	showTimestamp: boolean;
	fitMode: "cover" | "contain";
};

const SAMPLE_IMAGE_URL = "https://byos-nextjs.vercel.app/album/london.png";
const DEFAULT_TIME_ZONE = "America/New_York";
const ICLOUD_ROOT_DOMAIN = "icloud.com";
const ICLOUD_SHARED_STREAMS_HOST = `sharedstreams.${ICLOUD_ROOT_DOMAIN}`;
const BASE_62_CHAR_SET =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

type ParsedSharedAlbum = {
	token: string;
	initialHost: string;
	streamGuid?: string;
};

function parseBoolean(value: string | boolean | undefined, fallback = true) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["false", "no", "off", "0"].includes(normalized)) return false;
	if (["true", "yes", "on", "1"].includes(normalized)) return true;
	return fallback;
}

function base62ToInt(value: string) {
	return [...value].reduce(
		(total, char) => total * 62 + BASE_62_CHAR_SET.indexOf(char),
		0,
	);
}

function formatPartitionHost(serverPartition: number) {
	return `p${String(serverPartition).padStart(2, "0")}-sharedstreams.${ICLOUD_ROOT_DOMAIN}`;
}

function parseSharedAlbum(value?: string): ParsedSharedAlbum | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;

	const token =
		trimmed.includes("/") || trimmed.includes("#")
			? trimmed.split("#").pop()?.trim() || ""
			: trimmed;

	if (!token) return null;

	if (token.startsWith("v2;")) {
		const [, partition, streamGuid, dsid] = token.split(";");
		const serverPartition = Number.parseInt(partition || "", 10);
		if (Number.isFinite(serverPartition) && streamGuid && dsid) {
			return {
				token: dsid,
				initialHost: formatPartitionHost(serverPartition),
				streamGuid,
			};
		}
	}

	if (/^[AB]/.test(token)) {
		const serverPartition =
			token[0] === "A"
				? base62ToInt(token[1] || "")
				: base62ToInt(token.slice(1, 3));

		if (serverPartition >= 0) {
			return {
				token: token.split(";")[0],
				initialHost: formatPartitionHost(serverPartition),
			};
		}
	}

	return {
		token,
		initialHost: ICLOUD_SHARED_STREAMS_HOST,
	};
}

function normalizeFitMode(value?: string): "cover" | "contain" {
	return value?.trim().toLowerCase() === "contain" ? "contain" : "cover";
}

function getDerivatives(photo: IcloudPhoto) {
	const { derivatives } = photo;
	if (Array.isArray(derivatives)) {
		return derivatives;
	}
	if (derivatives && typeof derivatives === "object") {
		return Object.values(derivatives);
	}
	return [];
}

function chooseLargestDerivative(photo: IcloudPhoto) {
	return [...getDerivatives(photo)].sort(
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
	redirectsRemaining = 3,
): Promise<T> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch(
			`https://${host}/${token}/sharedstreams/${path}`,
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": "BYOS Apple Photos/1.0",
				},
				body: JSON.stringify(body),
				signal: controller.signal,
				next: { revalidate: 0 },
			},
		);

		const text = await response.text();
		const parsed = text ? (JSON.parse(text) as T) : null;
		const parsedRedirectHost =
			parsed &&
			typeof parsed === "object" &&
			"X-Apple-MMe-Host" in parsed &&
			typeof parsed["X-Apple-MMe-Host"] === "string"
				? parsed["X-Apple-MMe-Host"]
				: "";
		const redirectHost =
			response.headers.get("X-Apple-MMe-Host") || parsedRedirectHost;

		if (response.status === 330 && redirectHost && redirectsRemaining > 0) {
			return postIcloudJson(
				redirectHost,
				token,
				path,
				body,
				redirectsRemaining - 1,
			);
		}

		if (!response.ok) {
			throw new Error(
				`Apple Photos ${path} returned HTTP ${response.status} from ${host}`,
			);
		}

		if (!parsed) {
			throw new Error(
				`Apple Photos returned an empty ${path} response from ${host}`,
			);
		}

		return {
			...parsed,
			...(redirectHost ? { "X-Apple-MMe-Host": redirectHost } : {}),
		};
	} finally {
		clearTimeout(timeoutId);
	}
}

async function loadWebstream(album: ParsedSharedAlbum) {
	const body = {
		...(album.streamGuid ? { streamGuid: album.streamGuid } : {}),
		streamCtag: null,
	};

	const initial = await postIcloudJson<IcloudWebstreamResponse>(
		album.initialHost,
		album.token,
		"webstream",
		body,
	);

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
	const now = new Date();
	return {
		title: "Apple Photos",
		albumName: String(params?.albumName || "Shared Album").trim(),
		imageUrl: SAMPLE_IMAGE_URL,
		caption: "",
		updatedAt: formatUpdatedAt(now, timeZone),
		currentTime: formatDateTime(
			now,
			{
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			},
			timeZone,
		),
		timeZoneLabel:
			formatDateTime(
				now,
				{
					timeZoneName: "short",
				},
				timeZone,
			)
				.split(" ")
				.pop() || timeZone,
		note,
		showCaption: parseBoolean(params?.showCaption, true),
		showTimestamp: parseBoolean(params?.showTimestamp, true),
		fitMode: normalizeFitMode(params?.fitMode),
	};
}

export default async function getData(
	params?: ApplePhotosParams,
): Promise<ApplePhotosRecipeData> {
	const album = parseSharedAlbum(params?.sharedAlbumUrl);
	const timeZone = String(params?.timezone || DEFAULT_TIME_ZONE).trim();
	const now = new Date();

	if (!album) {
		return buildFallbackData(
			params,
			"Preview - add an iCloud Shared Album URL to show your photos.",
		);
	}

	try {
		const stream = await loadWebstream(album);
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
			stream["X-Apple-MMe-Host"] || album.initialHost,
			album.token,
			"webasseturls",
			{
				...(album.streamGuid ? { streamGuid: album.streamGuid } : {}),
				photoGuids: [photo.photoGuid],
			},
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
			caption: photo.caption || "",
			updatedAt: formatUpdatedAt(now, timeZone),
			currentTime: formatDateTime(
				now,
				{
					hour: "2-digit",
					minute: "2-digit",
					hour12: true,
				},
				timeZone,
			),
			timeZoneLabel:
				formatDateTime(
					now,
					{
						timeZoneName: "short",
					},
					timeZone,
				)
					.split(" ")
					.pop() || timeZone,
			note: `${photos.length} photos in shared album`,
			showCaption: parseBoolean(params?.showCaption, true),
			showTimestamp: parseBoolean(params?.showTimestamp, true),
			fitMode: normalizeFitMode(params?.fitMode),
		};
	} catch (error) {
		console.error("Error loading Apple Photos data:", error);
		const detail = error instanceof Error ? ` ${error.message}` : "";
		return buildFallbackData(
			params,
			`Live Apple Photos fetch failed.${detail}`,
		);
	}
}

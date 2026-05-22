import {
	dateSeedKey,
	pickDeterministicIndex,
} from "@/app/(app)/recipes/screens/_shared/daily-seed";
import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type MuseumPieceParams = {
	departmentId?: string | number;
	preferPortrait?: string | boolean;
	showArtist?: string | boolean;
	showCulture?: string | boolean;
	seedStrategy?: string;
};

type MetObjectsResponse = {
	total: number;
	objectIDs?: number[];
};

type MetObjectResponse = {
	objectID: number;
	title: string;
	artistDisplayName?: string;
	culture?: string;
	objectDate?: string;
	medium?: string;
	department?: string;
	primaryImageSmall?: string;
	primaryImage?: string;
	isPublicDomain?: boolean;
};

export type MuseumPieceRecipeData = {
	title: string;
	label: string;
	updatedAt: string;
	artworkTitle: string;
	artist: string;
	culture: string;
	dateLabel: string;
	medium: string;
	department: string;
	imageUrl: string;
	showArtist: boolean;
	showCulture: boolean;
	preferPortrait: boolean;
	note?: string;
};

const MET_OBJECTS_URL =
	"https://collectionapi.metmuseum.org/public/collection/v1/objects";
const MET_OBJECT_URL =
	"https://collectionapi.metmuseum.org/public/collection/v1/objects";

function parseBoolean(value: string | boolean | undefined, fallback: boolean) {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	if (["yes", "true", "1", "on"].includes(normalized)) return true;
	if (["no", "false", "0", "off"].includes(normalized)) return false;
	return fallback;
}

function buildFallback(
	showArtist: boolean,
	showCulture: boolean,
	preferPortrait: boolean,
	note = "Data unavailable",
): MuseumPieceRecipeData {
	return {
		title: "Museum Piece",
		label: "Piece of the Day",
		updatedAt: formatUpdatedAt(new Date()),
		artworkTitle: "The Great Wave off Kanagawa",
		artist: "Katsushika Hokusai",
		culture: "Japan",
		dateLabel: "ca. 1830–32",
		medium: "Polychrome woodblock print",
		department: "Asian Art",
		imageUrl:
			"https://images.metmuseum.org/CRDImages/as/web-large/DP130155.jpg",
		showArtist,
		showCulture,
		preferPortrait,
		note,
	};
}

export default async function getData(
	params?: MuseumPieceParams,
): Promise<MuseumPieceRecipeData> {
	const departmentId = Number(params?.departmentId);
	const showArtist = parseBoolean(params?.showArtist, true);
	const showCulture = parseBoolean(params?.showCulture, true);
	const preferPortrait = parseBoolean(params?.preferPortrait, false);
	const seedStrategy =
		String(params?.seedStrategy || "hourly").trim() || "hourly";
	const dateKey =
		seedStrategy === "daily"
			? dateSeedKey("UTC")
			: new Date().toISOString().slice(0, 13);

	try {
		const objectsUrl = Number.isFinite(departmentId)
			? `${MET_OBJECTS_URL}?departmentIds=${departmentId}`
			: MET_OBJECTS_URL;
		const objects = await fetchJsonWithTimeout<MetObjectsResponse>(
			objectsUrl,
			{ headers: { Accept: "application/json" } },
			10000,
		);
		const objectIDs = objects.objectIDs || [];

		if (objectIDs.length === 0) {
			return buildFallback(
				showArtist,
				showCulture,
				preferPortrait,
				"No open collection objects available for this filter.",
			);
		}

		const seed = `${dateKey}:${seedStrategy}:${departmentId || "all"}`;
		const startIndex = pickDeterministicIndex(objectIDs.length, seed);

		for (let attempt = 0; attempt < 14; attempt += 1) {
			const objectId =
				objectIDs[(startIndex + attempt * 997) % objectIDs.length] ||
				objectIDs[0];
			const object = await fetchJsonWithTimeout<MetObjectResponse>(
				`${MET_OBJECT_URL}/${objectId}`,
				{ headers: { Accept: "application/json" } },
				10000,
			).catch(() => null);

			if (
				!object?.isPublicDomain ||
				!(object.primaryImageSmall || object.primaryImage)
			) {
				continue;
			}

			return {
				title: "Museum Piece",
				label: "Piece of the Day",
				updatedAt: formatUpdatedAt(new Date()),
				artworkTitle: object.title || "Untitled",
				artist: object.artistDisplayName || "Unknown artist",
				culture: object.culture || "Unknown culture",
				dateLabel: object.objectDate || "Date unknown",
				medium: object.medium || "Medium unavailable",
				department: object.department || "The Met Collection",
				imageUrl: object.primaryImageSmall || object.primaryImage || "",
				showArtist,
				showCulture,
				preferPortrait,
				note:
					seedStrategy === "daily"
						? "Daily selection from The Met Open Access collection."
						: "Rotating selection from The Met Open Access collection.",
			};
		}

		return buildFallback(
			showArtist,
			showCulture,
			preferPortrait,
			"No suitable public-domain artwork with image was found today.",
		);
	} catch (error) {
		console.error("Error loading Museum Piece data:", error);
		return buildFallback(showArtist, showCulture, preferPortrait);
	}
}

import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type ParcelParams = {
	apiKey?: string;
	filterMode?: string;
	style?: string;
};

type ParcelApiResponse = {
	success?: boolean;
	deliveries?: Array<{
		description?: string;
		status_code?: number;
		date_expected?: string | null;
		events?: Array<{
			event?: string;
		}>;
	}>;
	error_message?: string;
};

export type ParcelDelivery = {
	title: string;
	status: string;
	latest: string;
	deliveryBy: string;
	days: string;
};

export type ParcelRecipeData = {
	filterMode: string;
	style: string;
	updatedAt: string;
	note?: string;
	error?: string;
	deliveries: ParcelDelivery[];
};

const STATUS_LABELS: Record<number, string> = {
	0: "Delivered",
	1: "Frozen",
	2: "In Transit",
	3: "Expecting Pickup",
	4: "Out for Delivery",
	5: "Not Found",
	6: "Delivery Attempt",
	7: "Exception",
	8: "Info Received",
};

const SAMPLE_DELIVERIES: ParcelDelivery[] = [
	{
		title: "TRMNL Mount",
		status: "In Transit",
		latest: "Departed regional hub",
		deliveryBy: "Tomorrow",
		days: "1 day",
	},
	{
		title: "E-ink cleaning kit",
		status: "Out for Delivery",
		latest: "Courier is nearby",
		deliveryBy: "Today",
		days: "0 days",
	},
	{
		title: "USB-C cable",
		status: "Delivered",
		latest: "Left at front door",
		deliveryBy: "Delivered",
		days: "-",
	},
];

function formatDeliveryBy(value?: string | null) {
	if (!value) {
		return "No ETA";
	}

	try {
		const expected = new Date(value);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		expected.setHours(0, 0, 0, 0);

		const diff = Math.round(
			(expected.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
		);
		if (diff < 0) return "Delivered";
		if (diff === 0) return "Today";
		if (diff === 1) return "Tomorrow";

		return expected.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	} catch {
		return "No ETA";
	}
}

function formatDays(value?: string | null) {
	if (!value) return "-";
	try {
		const expected = new Date(value);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		expected.setHours(0, 0, 0, 0);

		const diff = Math.round(
			(expected.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
		);

		if (diff < 0) return "-";
		return `${diff} day${diff === 1 ? "" : "s"}`;
	} catch {
		return "-";
	}
}

function buildFallback(note?: string): ParcelRecipeData {
	return {
		filterMode: "Tracked",
		style: "Detailed",
		updatedAt: formatUpdatedAt(new Date()),
		note,
		deliveries: SAMPLE_DELIVERIES,
	};
}

export default async function getData(
	params?: ParcelParams,
): Promise<ParcelRecipeData> {
	const apiKey = String(params?.apiKey || "").trim();
	const filterMode = String(params?.filterMode || "all").trim();
	const style = String(params?.style || "detailed").trim();

	if (!apiKey) {
		return buildFallback(
			"Add your Parcel app external API key to load live deliveries.",
		);
	}

	try {
		const data = await fetchJsonWithTimeout<ParcelApiResponse>(
			`https://api.parcel.app/external/deliveries/?filter_mode=${encodeURIComponent(filterMode)}`,
			{
				headers: {
					"api-key": apiKey,
					"user-agent": "BYOS Next",
					Accept: "application/json",
				},
			},
			10000,
		);

		if (!data.success || !data.deliveries) {
			return {
				...buildFallback(data.error_message || "Parcel API returned no deliveries."),
				error: data.error_message,
			};
		}

		return {
			filterMode:
				filterMode.charAt(0).toUpperCase() + filterMode.slice(1).replaceAll("_", " "),
			style: style.charAt(0).toUpperCase() + style.slice(1),
			updatedAt: formatUpdatedAt(new Date()),
			deliveries: data.deliveries.slice(0, 6).map((delivery) => ({
				title: delivery.description || "Unnamed package",
				status: STATUS_LABELS[delivery.status_code || 0] || "Unknown",
				latest: delivery.events?.[0]?.event || "No recent scans",
				deliveryBy: formatDeliveryBy(delivery.date_expected),
				days: formatDays(delivery.date_expected),
			})),
		};
	} catch (error) {
		console.error("Error loading Parcel deliveries:", error);
		return buildFallback(
			"Parcel API fetch failed, so this preview is showing sample deliveries.",
		);
	}
}

import {
	fetchJsonWithTimeout,
	formatUpdatedAt,
} from "@/app/(app)/recipes/screens/_shared/fetch-utils";

export const dynamic = "force-dynamic";

type DsnSignal = {
	dir?: string;
	band?: string;
	power?: string;
	data_rate?: string;
};

type DsnCraft = {
	name?: string;
	signals?: DsnSignal[];
};

type DsnStation = {
	name?: string;
	crafts?: DsnCraft[];
};

type DsnApiResponse = {
	stations?: DsnStation[];
	updated_at?: string;
};

export type DsnStationSummary = {
	name: string;
	craftCount: number;
	signalCount: number;
	crafts: Array<{
		name: string;
		downlink: string;
		uplink: string;
	}>;
};

export type DsnRecipeData = {
	updatedAt: string;
	note?: string;
	stations: DsnStationSummary[];
};

const FALLBACK_STATIONS: DsnStationSummary[] = [
	{
		name: "Madrid",
		craftCount: 2,
		signalCount: 5,
		crafts: [
			{ name: "James Webb", downlink: "K 28 Mbps", uplink: "S 4.6 kW" },
			{ name: "KPLO", downlink: "S 8 kbps", uplink: "S 0.2 kW" },
		],
	},
	{
		name: "Goldstone",
		craftCount: 1,
		signalCount: 1,
		crafts: [{ name: "Juno", downlink: "-", uplink: "X 18 kW" }],
	},
	{
		name: "Canberra",
		craftCount: 3,
		signalCount: 5,
		crafts: [
			{ name: "MMS 3", downlink: "S 2 Mbps", uplink: "S 0.2 kW" },
			{ name: "Mars Odyssey", downlink: "X 0 bps", uplink: "S 10 kW" },
			{ name: "TGO", downlink: "-", uplink: "X 9.9 kW" },
		],
	},
];

function summarizeSignals(craft: DsnCraft) {
	const downlink = craft.signals
		?.filter((signal) => signal.dir === "down")
		.map((signal) => `${signal.band || "?"} ${signal.data_rate || signal.power || ""}`.trim())
		.join(", ");
	const uplink = craft.signals
		?.filter((signal) => signal.dir === "up")
		.map((signal) => `${signal.band || "?"} ${signal.power || signal.data_rate || ""}`.trim())
		.join(", ");

	return {
		downlink: downlink || "-",
		uplink: uplink || "-",
	};
}

function fallback(note?: string): DsnRecipeData {
	return {
		updatedAt: formatUpdatedAt(new Date()),
		note,
		stations: FALLBACK_STATIONS,
	};
}

export default async function getData(): Promise<DsnRecipeData> {
	try {
		const data = await fetchJsonWithTimeout<DsnApiResponse>(
			"https://trmnl-dsn.schrockwell.com/api/dsn",
			{
				headers: {
					Accept: "application/json",
				},
			},
			10000,
		);

		return {
			updatedAt: formatUpdatedAt(data.updated_at || new Date()),
			stations:
				data.stations?.map((station) => ({
					name: station.name || "Unknown",
					craftCount: station.crafts?.length || 0,
					signalCount:
						station.crafts?.reduce(
							(total, craft) => total + (craft.signals?.length || 0),
							0,
						) || 0,
					crafts:
						station.crafts?.slice(0, 3).map((craft) => ({
							name: craft.name || "Unknown craft",
							...summarizeSignals(craft),
						})) || [],
				})) || FALLBACK_STATIONS,
		};
	} catch (error) {
		console.error("Error loading DSN data:", error);
		return fallback(
			"Live DSN fetch failed, so this preview is showing sample station traffic.",
		);
	}
}

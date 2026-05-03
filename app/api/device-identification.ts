import { sql } from "kysely";
import { db } from "@/lib/database/db";
import type { Device } from "@/lib/types";

export interface DeviceIdentifiers {
	apiKey: string | null;
	macAddress: string | null;
	friendlyId: string | null;
}

export interface DeviceMatchResult {
	device: Device | null;
	matchedBy:
		| "api_key"
		| "mac_address"
		| "friendly_id"
		| "sole_device_fallback"
		| null;
	foundByApiKey: boolean;
	foundByMac: boolean;
	foundByFriendlyId: boolean;
}

export const normalizeIdentifier = (value: string | null | undefined) => {
	const normalized = value?.trim();
	return normalized ? normalized : null;
};

export const normalizeMacAddress = (value: string | null | undefined) => {
	const normalized = normalizeIdentifier(value);
	if (!normalized) return null;

	const compact = normalized.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
	if (compact.length === 12) {
		return compact.match(/.{1,2}/g)?.join(":") || normalized.toUpperCase();
	}

	return normalized.toUpperCase();
};

export const normalizeFriendlyId = (value: string | null | undefined) => {
	const normalized = normalizeIdentifier(value);
	return normalized ? normalized.toUpperCase() : null;
};

export const compactMacAddress = (value: string | null | undefined) => {
	const normalized = normalizeIdentifier(value);
	if (!normalized) return null;

	const compact = normalized.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
	return compact.length === 12 ? compact : null;
};

export const macAddressesEqual = (
	left: string | null | undefined,
	right: string | null | undefined,
) => {
	const leftCompact = compactMacAddress(left);
	const rightCompact = compactMacAddress(right);

	if (leftCompact && rightCompact) {
		return leftCompact === rightCompact;
	}

	return normalizeMacAddress(left) === normalizeMacAddress(right);
};

export const maskApiKey = (apiKey: string | null | undefined) => {
	if (!apiKey) return null;
	if (apiKey.length <= 8) return "********";
	return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
};

export const findDeviceByIdentity = async ({
	apiKey,
	macAddress,
	friendlyId,
}: DeviceIdentifiers): Promise<DeviceMatchResult> => {
	const normalizedApiKey = normalizeIdentifier(apiKey);
	const normalizedMacAddress = normalizeMacAddress(macAddress);
	const normalizedCompactMacAddress = compactMacAddress(macAddress);
	const normalizedFriendlyId = normalizeFriendlyId(friendlyId);

	console.log(
		"findDeviceByIdentity input:",
		JSON.stringify({ apiKey, macAddress, friendlyId }),
	);
	console.log("normalizedApiKey:", JSON.stringify(normalizedApiKey));

	console.log("TRMNL findDeviceByIdentity normalized values", {
		apiKeyPresent: Boolean(normalizedApiKey),
		apiKeyValue: normalizedApiKey
			? `${normalizedApiKey.slice(0, 4)}...${normalizedApiKey.slice(-4)}`
			: null,
		macAddress,
		normalizedMacAddress,
		normalizedCompactMacAddress,
		friendlyId,
		normalizedFriendlyId,
	});

	if (normalizedApiKey) {
		console.log("Looking up api_key:", JSON.stringify(normalizedApiKey));
		const allDevices = await db
			.selectFrom("devices")
			.select(["api_key", "friendly_id"])
			.execute();
		console.log(
			"All device api_keys:",
			allDevices.map((device) => JSON.stringify(device.api_key)),
		);
	}

	const deviceByApiKey = normalizedApiKey
		? await db
				.selectFrom("devices")
				.selectAll()
				.where(sql<string>`trim(coalesce(api_key, ''))`, "=", normalizedApiKey)
				.executeTakeFirst()
		: null;

	console.log("deviceByApiKey result:", deviceByApiKey ? "FOUND" : "NULL");

	const deviceByMac = normalizedCompactMacAddress
		? await db
				.selectFrom("devices")
				.selectAll()
				.where(
					sql<string>`regexp_replace(upper(coalesce(mac_address, '')), '[^A-F0-9]', '', 'g')`,
					"=",
					normalizedCompactMacAddress,
				)
				.executeTakeFirst()
		: normalizedMacAddress
			? await db
					.selectFrom("devices")
					.selectAll()
					.where("mac_address", "=", normalizedMacAddress)
					.executeTakeFirst()
			: null;
	const deviceByFriendlyId = normalizedFriendlyId
		? await db
				.selectFrom("devices")
				.selectAll()
				.where(
					sql<string>`upper(trim(coalesce(friendly_id, '')))`,
					"=",
					normalizedFriendlyId,
				)
				.executeTakeFirst()
		: null;

	const matchedDevice = deviceByApiKey || deviceByMac || deviceByFriendlyId;

	if (!matchedDevice) {
		const totalDevicesResult = await db
			.selectFrom("devices")
			.select((eb) => eb.fn.countAll().as("count"))
			.executeTakeFirst();
		const sampleDevices = await db
			.selectFrom("devices")
			.select(["friendly_id", "mac_address", "api_key"])
			.limit(3)
			.execute();
		const dbUrl = process.env.DATABASE_URL;
		let dbHost: string | null = null;
		let dbName: string | null = null;
		try {
			if (dbUrl) {
				const parsed = new URL(dbUrl);
				dbHost = parsed.hostname || null;
				dbName = parsed.pathname?.replace(/^\//, "") || null;
			}
		} catch {
			dbHost = "unparseable";
			dbName = null;
		}

		console.log("TRMNL findDeviceByIdentity no-match diagnostics", {
			dbHost,
			dbName,
			totalDevices: Number(totalDevicesResult?.count || 0),
			sampleDevices: sampleDevices.map((device) => ({
				friendlyId: device.friendly_id,
				macAddress: device.mac_address,
				apiKey: maskApiKey(device.api_key),
			})),
		});
	}

	console.log("TRMNL findDeviceByIdentity lookup result", {
		foundByApiKey: Boolean(deviceByApiKey),
		foundByMac: Boolean(deviceByMac),
		foundByFriendlyId: Boolean(deviceByFriendlyId),
		matchedBy: deviceByApiKey
			? "api_key"
			: deviceByMac
				? "mac_address"
				: deviceByFriendlyId
					? "friendly_id"
					: null,
	});

	return {
		device: matchedDevice ? (matchedDevice as unknown as Device) : null,
		matchedBy: deviceByApiKey
			? "api_key"
			: deviceByMac
				? "mac_address"
				: deviceByFriendlyId
					? "friendly_id"
					: null,
		foundByApiKey: Boolean(deviceByApiKey),
		foundByMac: Boolean(deviceByMac),
		foundByFriendlyId: Boolean(deviceByFriendlyId),
	};
};

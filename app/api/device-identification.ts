import { db } from "@/lib/database/db";
import type { Device } from "@/lib/types";

export interface DeviceIdentifiers {
	apiKey: string | null;
	macAddress: string | null;
	friendlyId: string | null;
}

export interface DeviceMatchResult {
	device: Device | null;
	matchedBy: "api_key" | "mac_address" | "friendly_id" | null;
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
	return normalized ? normalized.toUpperCase() : null;
};

export const normalizeFriendlyId = (value: string | null | undefined) => {
	const normalized = normalizeIdentifier(value);
	return normalized ? normalized.toUpperCase() : null;
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
	const normalizedFriendlyId = normalizeFriendlyId(friendlyId);

	const deviceByApiKey = normalizedApiKey
		? await db
				.selectFrom("devices")
				.selectAll()
				.where("api_key", "=", normalizedApiKey)
				.executeTakeFirst()
		: null;
	const deviceByMac = normalizedMacAddress
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
				.where("friendly_id", "=", normalizedFriendlyId)
				.executeTakeFirst()
		: null;

	const matchedDevice = deviceByApiKey || deviceByMac || deviceByFriendlyId;

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

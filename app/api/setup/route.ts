import { NextResponse } from "next/server";
import {
	findDeviceByIdentity,
	macAddressesEqual,
	maskApiKey,
	normalizeFriendlyId,
	normalizeIdentifier,
	normalizeMacAddress,
} from "@/app/api/device-identification";
import type { CustomError } from "@/lib/api/types";
import { db } from "@/lib/database/db";
import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import { generateApiKey, generateFriendlyId } from "@/utils/helpers";

const DEFAULT_SCREEN = "album";

const parsePositiveInteger = (value: string | null, fallback: number) => {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const firstHeaderOrQuery = (
	request: Request,
	url: URL,
	headerName: string,
	queryNames: string[],
) => {
	const headerValue = request.headers.get(headerName);
	if (headerValue) {
		return { value: headerValue, source: `header:${headerName}` };
	}

	for (const queryName of queryNames) {
		const queryValue = url.searchParams.get(queryName);
		if (queryValue) {
			return { value: queryValue, source: `query:${queryName}` };
		}
	}

	return { value: null, source: null };
};

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const macIdentifier = firstHeaderOrQuery(request, url, "ID", [
			"id",
			"ID",
			"mac",
			"mac_address",
			"macAddress",
		]);
		const apiKeyIdentifier = firstHeaderOrQuery(request, url, "Access-Token", [
			"access_token",
			"access-token",
			"api_key",
			"apiKey",
		]);
		const modelIdentifier = firstHeaderOrQuery(request, url, "Model", [
			"model",
			"device_model",
			"deviceModel",
		]);
		const friendlyIdIdentifier = firstHeaderOrQuery(
			request,
			url,
			"Friendly-Id",
			["friendly_id", "friendly-id", "device_friendly_id", "deviceFriendlyId"],
		);
		const refreshRate = request.headers.get("Refresh-Rate");
		const batteryVoltage = request.headers.get("Battery-Voltage");
		const fwVersion = request.headers.get("FW-Version");
		const rssi = request.headers.get("RSSI");
		const macAddress = normalizeMacAddress(macIdentifier.value);
		const apiKey = normalizeIdentifier(apiKeyIdentifier.value);
		const model = normalizeIdentifier(modelIdentifier.value);
		const friendlyId = normalizeFriendlyId(friendlyIdIdentifier.value);
		const refreshRateSeconds = parsePositiveInteger(refreshRate, 60);
		const { ready } = await checkDbConnection();

		logInfo("Setup API request received", {
			source: "api/setup",
			metadata: {
				path: url.pathname,
				search: url.search,
				macAddress: macAddress || null,
				macAddressSource: macIdentifier.source,
				apiKey: maskApiKey(apiKey),
				apiKeySource: apiKeyIdentifier.source,
				friendlyId,
				friendlyIdSource: friendlyIdIdentifier.source,
				model: model || null,
				modelSource: modelIdentifier.source,
				refreshRate: refreshRate || null,
				batteryVoltage: batteryVoltage || null,
				fwVersion: fwVersion || null,
				rssi: rssi || null,
			},
		});

		if (!ready) {
			console.warn(
				"Database client not initialized, using noDB mode, skipping device setup",
			);
			logInfo(
				"Database client not initialized, using noDB mode, skipping device setup",
				{
					source: "api/setup",
					metadata: {
						macAddress: macAddress || null,
						apiKey: maskApiKey(apiKey),
						reason: "database_not_ready",
					},
				},
			);
			return NextResponse.json(
				{
					status: 200,
					message: "Device setup skipped",
				},
				{ status: 200 },
			);
		}

		if (!macAddress) {
			const error = new Error("Missing ID header");
			logError(error, {
				source: "api/setup",
				metadata: {
					macAddress: macAddress || null,
					apiKey: maskApiKey(apiKey),
					model: model || null,
					reason: "missing_device_id",
				},
			});
			return NextResponse.json(
				{
					status: 404,
					api_key: null,
					friendly_id: null,
					image_url: null,
					message: "ID header is required",
				},
				{ status: 200 },
			); // Status 200 for device compatibility
		}

		if (!model) {
			logInfo("Setup request did not include Model; continuing", {
				source: "api/setup",
				metadata: {
					macAddress,
					apiKey: maskApiKey(apiKey),
					reason: "model_missing_but_optional_for_byos",
				},
			});
		}

		const existingMatch = await findDeviceByIdentity({
			apiKey,
			macAddress,
			friendlyId,
		});
		const device = existingMatch.device;

		logInfo("Setup device lookup completed", {
			source: "api/setup",
			metadata: {
				macAddress,
				apiKey: maskApiKey(apiKey),
				friendlyId,
				deviceFound: Boolean(device),
				friendly_id: device?.friendly_id || null,
				matchedBy: existingMatch.matchedBy,
				foundByApiKey: existingMatch.foundByApiKey,
				foundByMac: existingMatch.foundByMac,
				foundByFriendlyId: existingMatch.foundByFriendlyId,
			},
		});

		// If device not found by MAC address or API key, create a new one
		if (!device) {
			logInfo("Setup will create new device", {
				source: "api/setup",
				metadata: {
					macAddress,
					apiKeyProvided: Boolean(apiKey),
					model: model || null,
				},
			});

			const friendly_id = generateFriendlyId(
				macAddress,
				new Date().toISOString().replace(/[-:Z]/g, ""),
			);
			// Use provided API key if available, otherwise generate a new one
			const api_key =
				apiKey ||
				generateApiKey(
					macAddress,
					new Date().toISOString().replace(/[-:Z]/g, ""),
				);

			try {
				const newDevice = await db
					.insertInto("devices")
					.values({
						mac_address: macAddress,
						name: `TRMNL Device ${friendly_id}`,
						friendly_id: friendly_id,
						api_key: api_key,
						screen: DEFAULT_SCREEN,
						refresh_schedule: JSON.stringify({
							default_refresh_rate: refreshRateSeconds,
							time_ranges: [
								{
									start_time: "00:00", // Start of the time range
									end_time: "07:00", // End of the time range
									refresh_rate: 3600, // Refresh rate in seconds
								},
							],
						}),
						last_update_time: new Date().toISOString(), // Current time as last update
						next_expected_update: new Date(
							Date.now() + refreshRateSeconds * 1000,
						).toISOString(),
						timezone: "UTC", // Default timezone
						battery_voltage: batteryVoltage
							? Number.parseFloat(batteryVoltage)
							: null,
						firmware_version: fwVersion || model || null,
						rssi: rssi ? Number.parseInt(rssi, 10) : null,
					})
					.returningAll()
					.executeTakeFirst();

				if (!newDevice) {
					throw new Error("Failed to create new device record");
				}

				logInfo(`New device ${newDevice.friendly_id} created!`, {
					source: "api/setup",
					metadata: {
						friendly_id: newDevice.friendly_id,
						mac_address: macAddress,
						api_key: maskApiKey(api_key),
						model: model || null,
					},
				});
				return NextResponse.json(
					{
						status: 200,
						api_key: newDevice.api_key,
						friendly_id: newDevice.friendly_id,
						image_url: null,
						filename: null,
						message: `Device ${newDevice.friendly_id} added to BYOS!`,
					},
					{ status: 200 },
				);
			} catch (createError) {
				const existingDevice = await db
					.selectFrom("devices")
					.selectAll()
					.where((eb) =>
						eb.or([
							eb("mac_address", "=", macAddress),
							eb("api_key", "=", api_key),
						]),
					)
					.executeTakeFirst();

				if (existingDevice) {
					logInfo("Setup create failed but existing device was found", {
						source: "api/setup",
						metadata: {
							friendly_id: existingDevice.friendly_id,
							macAddress,
							api_key: maskApiKey(api_key),
						},
					});

					return NextResponse.json(
						{
							status: 200,
							api_key: existingDevice.api_key,
							friendly_id: existingDevice.friendly_id,
							image_url: null,
							filename: null,
							message: `Device ${existingDevice.friendly_id} already exists in BYOS!`,
						},
						{ status: 200 },
					);
				}

				// Create an error object with the error details
				const deviceError: CustomError = new Error("Error creating device");
				// Attach the original error information
				(deviceError as CustomError).originalError = createError;

				logError(deviceError, {
					source: "api/setup",
					metadata: {
						macAddress,
						friendly_id,
						api_key: maskApiKey(api_key),
						reason: "create_failed",
					},
				});

				return NextResponse.json(
					{
						status: 500,
						reset_firmware: false,
						message: `Error creating new device. ${friendly_id}|${api_key}`,
					},
					{ status: 200 },
				);
			}
		}

		// Device exists by MAC address - check if we need to update the API key
		let currentApiKey = device.api_key;
		const updateData: Record<string, string> = {
			updated_at: new Date().toISOString(),
		};
		let shouldUpdate = false;

		if (apiKey && apiKey !== device.api_key && !existingMatch.foundByApiKey) {
			try {
				const apiKeyOwner = await db
					.selectFrom("devices")
					.select("id")
					.where("api_key", "=", apiKey)
					.executeTakeFirst();
				if (!apiKeyOwner) {
					updateData.api_key = apiKey;
					currentApiKey = apiKey;
					shouldUpdate = true;
				}
			} catch (updateError) {
				logError(new Error("Error updating API key for device"), {
					source: "api/setup",
					metadata: {
						device_id: device.friendly_id,
						mac_address: macAddress,
						error: updateError,
					},
				});
			}
		}

		if (
			macAddress &&
			!macAddressesEqual(macAddress, device.mac_address) &&
			!existingMatch.foundByMac
		) {
			const macOwner = await findDeviceByIdentity({
				apiKey: null,
				macAddress,
				friendlyId: null,
			});
			if (!macOwner.device || macOwner.device.id === device.id) {
				updateData.mac_address = macAddress;
				shouldUpdate = true;
			}
		}

		if (shouldUpdate) {
			await db
				.updateTable("devices")
				.set(updateData)
				.where("friendly_id", "=", device.friendly_id)
				.execute();
		}

		logInfo(`Device ${device.friendly_id} added to BYOS!`, {
			source: "api/setup",
			metadata: {
				friendly_id: device.friendly_id,
				mac_address: macAddress,
				api_key: maskApiKey(currentApiKey),
				deviceFound: true,
				deviceCreated: false,
				matchedBy: existingMatch.matchedBy,
			},
		});
		return NextResponse.json(
			{
				status: 200,
				api_key: currentApiKey,
				friendly_id: device.friendly_id,
				image_url: null,
				filename: null,
				message: `Device ${device.friendly_id} added to BYOS!`,
			},
			{ status: 200 },
		);
	} catch (error) {
		// The error object already contains the stack trace
		logError(error as Error, {
			source: "api/setup",
		});
		return NextResponse.json(
			{
				status: 500,
				error: "Internal server error",
			},
			{ status: 200 },
		);
	}
}

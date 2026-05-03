import crypto from "crypto";
import { NextResponse } from "next/server";
import {
	findDeviceByIdentity,
	normalizeFriendlyId,
	normalizeIdentifier,
	normalizeMacAddress,
} from "@/app/api/device-identification";
import { db } from "@/lib/database/db";
import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import { DeviceDisplayMode } from "@/lib/mixup/constants";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";
import { logger } from "@/lib/recipes/recipe-renderer";
import type {
	Device,
	PlaylistItem,
	RefreshSchedule,
	TimeRange,
} from "@/lib/types";
import { generateApiKey, generateFriendlyId, timezones } from "@/utils/helpers";
import { DEFAULT_SCREEN } from "./route";

// --- Types ---

export interface RequestHeaders {
	apiKey: string | null;
	macAddress: string | null;
	friendlyId: string | null;
	refreshRate: string | null;
	batteryVoltage: string | null;
	fwVersion: string | null;
	rssi: string | null;
	hostUrl: string;
}

// --- Header Parsing ---

export const parseRequestHeaders = (request: Request): RequestHeaders => {
	const headers = request.headers;
	const url = new URL(request.url);
	const firstIdentifier = (names: string[]) => {
		for (const name of names) {
			const headerValue = headers.get(name);
			if (headerValue) return headerValue;
		}
		for (const name of names) {
			const queryValue = url.searchParams.get(name);
			if (queryValue) return queryValue;
		}
		return null;
	};

	return {
		apiKey: normalizeIdentifier(
			firstIdentifier([
				"Access-Token",
				"access-token",
				"X-Access-Token",
				"api_key",
				"apiKey",
			]),
		),
		macAddress: normalizeMacAddress(
			firstIdentifier(["ID", "id", "mac", "mac_address", "macAddress"]),
		),
		friendlyId: normalizeFriendlyId(
			firstIdentifier([
				"Friendly-Id",
				"friendly-id",
				"friendly_id",
				"device_friendly_id",
				"deviceFriendlyId",
			]),
		),
		refreshRate: normalizeIdentifier(
			firstIdentifier(["Refresh-Rate", "refresh-rate", "refresh_rate"]),
		),
		batteryVoltage: normalizeIdentifier(
			firstIdentifier([
				"Battery-Voltage",
				"battery-voltage",
				"battery_voltage",
			]),
		),
		fwVersion: normalizeIdentifier(
			firstIdentifier(["FW-Version", "fw-version", "fw_version"]),
		),
		rssi: normalizeIdentifier(firstIdentifier(["RSSI", "rssi"])),
		hostUrl:
			(headers.get("x-forwarded-proto") || "http") +
			"://" +
			(headers.get("x-forwarded-host") || headers.get("host") || "localhost"),
	};
};

// --- Helper Functions ---

export const generateMockMacAddress = (apiKey: string): string => {
	const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
	const macPart = hash.substring(hash.length - 6).toUpperCase();
	return `A1:B2:C3:${macPart.substring(0, 2)}:${macPart.substring(2, 4)}:${macPart.substring(4, 6)}`;
};

export const precacheImageInBackground = (
	imageUrl: string,
	friendlyId: string,
): void => {
	fetch(imageUrl, { method: "GET" })
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to cache image: ${response.status}`);
			}
			logInfo("Image pre-cached successfully", {
				source: "api/display",
				metadata: { imageUrl, friendlyId },
			});
		})
		.catch((error: Error) => {
			logError("Failed to precache image", {
				source: "api/display",
				metadata: { imageUrl, error: error.message, friendlyId },
			});
		});
};

export const isTimeInRange = (
	timeToCheck: string,
	startTime: string,
	endTime: string,
): boolean => {
	if (startTime > endTime) {
		return timeToCheck >= startTime || timeToCheck < endTime;
	}
	return timeToCheck >= startTime && timeToCheck < endTime;
};

export const calculateRefreshRate = (
	refreshSchedule: RefreshSchedule | null,
	defaultRefreshRate: number,
	timezone: string = timezones[0].value,
): number => {
	if (!refreshSchedule) {
		return defaultRefreshRate;
	}

	const now = new Date();
	const options = {
		timeZone: timezone,
		hour12: false,
	} as Intl.DateTimeFormatOptions;
	const formatter = new Intl.DateTimeFormat("en-US", {
		...options,
		hour: "2-digit",
		minute: "2-digit",
	});

	const [{ value: hour }, , { value: minute }] = formatter.formatToParts(now);
	const currentTimeString = `${hour}:${minute}`;

	for (const range of refreshSchedule.time_ranges as TimeRange[]) {
		if (isTimeInRange(currentTimeString, range.start_time, range.end_time)) {
			return range.refresh_rate;
		}
	}

	return refreshSchedule.default_refresh_rate;
};

export const getActivePlaylistItem = async (
	playlistId: string,
	currentIndex: number,
	timezone: string = "UTC",
): Promise<PlaylistItem | null> => {
	const { ready } = await checkDbConnection();
	if (!ready) return null;

	const items = await db
		.selectFrom("playlist_items")
		.selectAll()
		.where("playlist_id", "=", playlistId)
		.orderBy("order_index", "asc")
		.execute();

	if (!items || items.length === 0) {
		logError("No items in playlist", {
			source: "api/display",
			metadata: { playlistId },
		});
		return null;
	}

	const now = new Date();
	const options = {
		timeZone: timezone,
		hour12: false,
	} as Intl.DateTimeFormatOptions;

	const timeFormatter = new Intl.DateTimeFormat("en-US", {
		...options,
		hour: "2-digit",
		minute: "2-digit",
	});
	const [{ value: hour }, , { value: minute }] =
		timeFormatter.formatToParts(now);
	const currentTime = `${hour}:${minute}`;

	const dayFormatter = new Intl.DateTimeFormat("en-US", {
		...options,
		weekday: "long",
	});
	const currentDay = dayFormatter.format(now).toLowerCase();

	const metadata = {
		playlistId,
		currentIndex,
		timezone,
		currentTime,
		currentDay,
		totalItems: items.length,
	};
	logInfo("Checking playlist items for time/day match", {
		source: "api/display",
		metadata,
	});

	for (let i = 1; i < items.length + 1; i++) {
		const itemIndex = (currentIndex + i) % items.length;
		const item = items[itemIndex];

		const days_of_week = item.days_of_week as string[] | null;
		const start_time = item.start_time;
		const end_time = item.end_time;

		const isTimeValid =
			!start_time ||
			!end_time ||
			isTimeInRange(currentTime, start_time, end_time);
		const isDayValid =
			!days_of_week ||
			(Array.isArray(days_of_week) && days_of_week.includes(currentDay));

		if (isTimeValid && isDayValid) {
			return item as unknown as PlaylistItem;
		}
	}

	return null;
};

const getGrayscaleLevels = (grayscale: number | null | undefined): number => {
	if (grayscale === 2 || grayscale === 4 || grayscale === 16) {
		return grayscale;
	}
	return 2;
};

export const getDeviceRenderSettings = (device: Device) => {
	const orientation = device.screen_orientation || "landscape";
	const width =
		orientation === "landscape"
			? device.screen_width || DEFAULT_IMAGE_WIDTH
			: device.screen_height || DEFAULT_IMAGE_HEIGHT;
	const height =
		orientation === "landscape"
			? device.screen_height || DEFAULT_IMAGE_HEIGHT
			: device.screen_width || DEFAULT_IMAGE_WIDTH;

	return {
		orientation,
		width,
		height,
		grayscaleLevels: getGrayscaleLevels(device.grayscale),
	};
};

export const resolveDeviceDisplayTarget = async ({
	device,
	baseUrl,
	updatePlaylistIndex = false,
}: {
	device: Device;
	baseUrl: string;
	updatePlaylistIndex?: boolean;
}) => {
	let screenToDisplay = device.screen;
	let dynamicRefreshRate = 180;
	let imageUrl: string;
	const { width, height, grayscaleLevels } = getDeviceRenderSettings(device);
	let fallbackUsed = false;
	let fallbackReason: string | null = null;
	const fallbackScreen = device.screen || DEFAULT_SCREEN;

	switch (device.display_mode) {
		case DeviceDisplayMode.PLAYLIST:
			if (device.playlist_id) {
				const activeItem = await getActivePlaylistItem(
					device.playlist_id,
					device.current_playlist_index || 0,
					device.timezone || "UTC",
				);

				if (activeItem) {
					screenToDisplay = activeItem.screen_id;
					dynamicRefreshRate = activeItem.duration;

					if (updatePlaylistIndex) {
						await db
							.updateTable("devices")
							.set({ current_playlist_index: activeItem.order_index })
							.where("id", "=", device.id.toString())
							.execute();
					}
				} else {
					logInfo("No active playlist item found, using fallback", {
						source: "api/display",
						metadata: {
							deviceId: device.friendly_id,
							fallbackScreen,
							reason: "playlist_no_active_item",
						},
					});
					screenToDisplay = fallbackScreen;
					dynamicRefreshRate = 60;
					fallbackUsed = true;
					fallbackReason = "playlist_no_active_item";
				}
			} else {
				screenToDisplay = fallbackScreen;
				dynamicRefreshRate = 60;
				fallbackUsed = true;
				fallbackReason = "playlist_missing_playlist_id";
			}
			imageUrl = `${baseUrl}/${screenToDisplay || DEFAULT_SCREEN}.bmp?width=${width}&height=${height}&grayscale=${grayscaleLevels}`;
			break;

		case DeviceDisplayMode.MIXUP:
			if (device.mixup_id) {
				imageUrl = `${baseUrl}/mixup/${device.mixup_id}.bmp?width=${width}&height=${height}&grayscale=${grayscaleLevels}`;
				logInfo("Using mixup display mode", {
					source: "api/display",
					metadata: {
						deviceId: device.friendly_id,
						mixupId: device.mixup_id,
					},
				});
			} else {
				imageUrl = `${baseUrl}/${fallbackScreen}.bmp?width=${width}&height=${height}&grayscale=${grayscaleLevels}`;
				screenToDisplay = fallbackScreen;
				fallbackUsed = true;
				fallbackReason = "mixup_missing_mixup_id";
			}
			dynamicRefreshRate = calculateRefreshRate(
				device.refresh_schedule as unknown as RefreshSchedule,
				180,
				device.timezone || "UTC",
			);
			break;

		default:
			dynamicRefreshRate = calculateRefreshRate(
				device.refresh_schedule as unknown as RefreshSchedule,
				180,
				device.timezone || "UTC",
			);
			imageUrl = `${baseUrl}/${(screenToDisplay || DEFAULT_SCREEN).trim()}.bmp?width=${width}&height=${height}&grayscale=${grayscaleLevels}`;
			break;
	}

	return {
		imageUrl,
		screenToDisplay: screenToDisplay || DEFAULT_SCREEN,
		refreshRate: dynamicRefreshRate,
		userId: device.user_id,
		width,
		height,
		grayscaleLevels,
		fallbackUsed,
		fallbackReason,
	};
};

// --- Device Management ---

export const updateDeviceStatus = async (
	device: Device,
	headers: RequestHeaders,
	refreshDurationSeconds: number,
): Promise<void> => {
	const now = new Date();
	const nextExpectedUpdate = new Date(
		now.getTime() + refreshDurationSeconds * 1000,
	);

	const updateData: Partial<Device> = {
		last_update_time: now.toISOString(),
		next_expected_update: nextExpectedUpdate.toISOString(),
		last_refresh_duration: Math.round(refreshDurationSeconds),
		updated_at: now.toISOString(),
	};

	if (headers.batteryVoltage) {
		updateData.battery_voltage = Number.parseFloat(headers.batteryVoltage);
	}
	if (headers.fwVersion) {
		updateData.firmware_version = headers.fwVersion;
	}
	if (headers.rssi) {
		updateData.rssi = Number.parseInt(headers.rssi, 10);
	}
	if (device.timezone) {
		updateData.timezone = device.timezone;
	}

	try {
		await db
			.updateTable("devices")
			.set(updateData)
			.where("id", "=", device.id.toString())
			.execute();
	} catch (_error) {
		logError("Error updating device status", {
			source: "api/display",
			metadata: { deviceId: device.id, headers },
		});
	}
};

export const findOrCreateDevice = async (
	headers: RequestHeaders,
): Promise<{
	device: Device | null;
	matchedBy:
		| "api_key"
		| "mac_address"
		| "friendly_id"
		| "created"
		| "mock"
		| null;
	foundByApiKey: boolean;
	foundByMac: boolean;
	foundByFriendlyId: boolean;
	created: boolean;
}> => {
	const { apiKey, macAddress, friendlyId } = headers;
	const match = await findDeviceByIdentity({ apiKey, macAddress, friendlyId });

	if (match.device) {
		const device = match.device;
		const updateData: Partial<Device> = {
			updated_at: new Date().toISOString(),
		};
		let shouldUpdate = false;

		if (apiKey && apiKey !== device.api_key && !match.foundByApiKey) {
			const apiKeyOwner = await db
				.selectFrom("devices")
				.select("id")
				.where("api_key", "=", apiKey)
				.executeTakeFirst();
			if (!apiKeyOwner) {
				updateData.api_key = apiKey;
				shouldUpdate = true;
			}
		}

		if (macAddress && macAddress !== device.mac_address && !match.foundByMac) {
			const macOwner = await db
				.selectFrom("devices")
				.select("id")
				.where("mac_address", "=", macAddress)
				.executeTakeFirst();
			if (!macOwner) {
				updateData.mac_address = macAddress;
				shouldUpdate = true;
			}
		}

		if (shouldUpdate) {
			await db
				.updateTable("devices")
				.set(updateData)
				.where("id", "=", device.id.toString())
				.execute();
		}

		return {
			device: {
				...device,
				api_key: updateData.api_key || device.api_key,
				mac_address: updateData.mac_address || device.mac_address,
			},
			matchedBy: match.matchedBy,
			foundByApiKey: match.foundByApiKey,
			foundByMac: match.foundByMac,
			foundByFriendlyId: match.foundByFriendlyId,
			created: false,
		};
	}

	if (macAddress) {
		const friendly_id = generateFriendlyId(
			macAddress,
			new Date().toISOString().replace(/[-:Z]/g, ""),
		);
		const generatedApiKey = generateApiKey(
			macAddress,
			new Date().toISOString().replace(/[-:Z]/g, ""),
		);

		try {
			const newDevice = await db
				.insertInto("devices")
				.values({
					mac_address: macAddress,
					name: `TRMNL Device ${friendly_id}`,
					friendly_id,
					api_key: apiKey || generatedApiKey,
					refresh_schedule: JSON.stringify({
						default_refresh_rate: headers.refreshRate
							? Number.parseInt(headers.refreshRate, 10)
							: 60,
						time_ranges: [],
					}),
					last_update_time: new Date().toISOString(),
					next_expected_update: new Date(
						Date.now() + 3600 * 1000,
					).toISOString(),
					timezone: "UTC",
					screen: DEFAULT_SCREEN,
				})
				.returningAll()
				.executeTakeFirst();

			if (newDevice) {
				logInfo("Created new device from MAC address", {
					source: "api/display",
					metadata: { friendly_id },
				});
				return {
					device: newDevice as unknown as Device,
					matchedBy: "created",
					foundByApiKey: false,
					foundByMac: false,
					foundByFriendlyId: false,
					created: true,
				};
			}
		} catch (e) {
			logError("Error creating device from MAC address", {
				source: "api/display",
				metadata: { error: e, macAddress },
			});

			const existingDevice = await db
				.selectFrom("devices")
				.selectAll()
				.where((eb) =>
					eb.or([
						eb("mac_address", "=", macAddress),
						...(apiKey ? [eb("api_key", "=", apiKey)] : []),
					]),
				)
				.executeTakeFirst();

			if (existingDevice) {
				return {
					device: existingDevice as unknown as Device,
					matchedBy:
						apiKey && existingDevice.api_key === apiKey
							? "api_key"
							: "mac_address",
					foundByApiKey: Boolean(apiKey && existingDevice.api_key === apiKey),
					foundByMac: Boolean(existingDevice.mac_address === macAddress),
					foundByFriendlyId: false,
					created: false,
				};
			}

			// If the insert failed and we still cannot resolve by MAC/API key,
			// do not fall through to mock provisioning for a real hardware device.
			return {
				device: null,
				matchedBy: null,
				foundByApiKey: false,
				foundByMac: false,
				foundByFriendlyId: false,
				created: false,
			};
		}

		// A real device provided a MAC address but could not be resolved/created.
		// Stop here to avoid creating conflicting mock rows.
		return {
			device: null,
			matchedBy: null,
			foundByApiKey: false,
			foundByMac: false,
			foundByFriendlyId: false,
			created: false,
		};
	}

	if (apiKey) {
		const existingByApiKey = await db
			.selectFrom("devices")
			.selectAll()
			.where("api_key", "=", apiKey)
			.executeTakeFirst();
		if (existingByApiKey) {
			return {
				device: existingByApiKey as unknown as Device,
				matchedBy: "api_key",
				foundByApiKey: true,
				foundByMac: false,
				foundByFriendlyId: false,
				created: false,
			};
		}

		const mockMacAddress = generateMockMacAddress(apiKey);
		const existingMock = await db
			.selectFrom("devices")
			.selectAll()
			.where("mac_address", "=", mockMacAddress)
			.executeTakeFirst();

		if (existingMock) {
			const device = existingMock as unknown as Device;
			logInfo("Using existing mock device", {
				source: "api/display",
				metadata: { friendly_id: device.friendly_id },
			});
			return {
				device,
				matchedBy: "mock",
				foundByApiKey: false,
				foundByMac: false,
				foundByFriendlyId: false,
				created: false,
			};
		}

		// Create Mock Device
		const friendly_id = generateFriendlyId(
			mockMacAddress,
			new Date().toISOString().replace(/[-:Z]/g, ""),
		);
		const new_api_key = macAddress
			? apiKey
			: generateApiKey(
					mockMacAddress,
					new Date().toISOString().replace(/[-:Z]/g, ""),
				);

		try {
			const newDevice = await db
				.insertInto("devices")
				.values({
					mac_address: macAddress || mockMacAddress,
					name: `Unknown device with API ${apiKey.substring(0, 4)}...`,
					friendly_id: friendly_id,
					api_key: new_api_key,
					refresh_schedule: JSON.stringify({
						default_refresh_rate: 60,
						time_ranges: [],
					}),
					last_update_time: new Date().toISOString(),
					next_expected_update: new Date(
						Date.now() + 3600 * 1000,
					).toISOString(),
					timezone: "UTC",
					screen: DEFAULT_SCREEN,
				})
				.returningAll()
				.executeTakeFirst();

			if (newDevice) {
				logger.info(`Created new mock device: ${friendly_id}`);
				return {
					device: newDevice as unknown as Device,
					matchedBy: "mock",
					foundByApiKey: false,
					foundByMac: false,
					foundByFriendlyId: false,
					created: true,
				};
			}
		} catch (e) {
			logger.error("Error creating mock device", { error: e });
			const existingDevice = await db
				.selectFrom("devices")
				.selectAll()
				.where((eb) =>
					eb.or([
						eb("mac_address", "=", mockMacAddress),
						eb("api_key", "=", new_api_key),
					]),
				)
				.executeTakeFirst();

			if (existingDevice) {
				return {
					device: existingDevice as unknown as Device,
					matchedBy: "mock",
					foundByApiKey: false,
					foundByMac: false,
					foundByFriendlyId: false,
					created: false,
				};
			}
		}
	}

	return {
		device: null,
		matchedBy: null,
		foundByApiKey: false,
		foundByMac: false,
		foundByFriendlyId: false,
		created: false,
	};
};

// --- Response Builder ---

export const buildDisplayResponse = (
	imageUrl: string,
	filename: string,
	refreshRate: number,
	extra: Record<string, unknown> = {},
) => {
	return NextResponse.json(
		{
			status: 0,
			image_url: imageUrl,
			filename,
			refresh_rate: refreshRate,
			reset_firmware: false,
			update_firmware: false,
			firmware_url: null,
			special_function: "restart_playlist",
			...extra,
		},
		{
			status: 200,
			headers: {
				"Cache-Control": "no-store, max-age=0",
			},
		},
	);
};

export const appendImageCacheBust = (
	imageUrl: string,
	uniqueId: string,
	userId?: string | null,
) => {
	const params = new URLSearchParams({ _cb: uniqueId });
	if (userId) {
		params.set("_owner", userId);
	}
	const separator = imageUrl.includes("?") ? "&" : "?";
	return `${imageUrl}${separator}${params.toString()}`;
};

export const buildErrorResponse = (
	message: string,
	baseUrl: string,
	uniqueId: string,
) => {
	const notFoundImageUrl = `${baseUrl}/not-found.bmp`;
	return NextResponse.json(
		{
			status: 0,
			image_url: notFoundImageUrl,
			filename: `not-found_${uniqueId}.bmp`,
			refresh_rate: 60,
			reset_firmware: false,
			update_firmware: false,
			firmware_url: null,
			special_function: "restart_playlist",
			message,
		},
		{
			status: 200,
			headers: {
				"Cache-Control": "no-store, max-age=0",
			},
		},
	);
};

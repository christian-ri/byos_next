import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import { maskApiKey } from "../device-identification";
import {
	appendImageCacheBust,
	buildDisplayResponse,
	buildErrorResponse,
	parseRequestHeaders,
	precacheImageInBackground,
	resolveDeviceDisplayTarget,
	resolveDeviceForDisplay,
	updateDeviceStatus,
} from "./utils";

export const DEFAULT_SCREEN = "album";
export const DEFAULT_REFRESH_RATE = 180;

const summarizeIdentityState = ({
	apiKey,
	macAddress,
	friendlyId,
	matchedBy,
	foundByApiKey,
	foundByMac,
	foundByFriendlyId,
	headerKeys,
}: {
	apiKey: string | null;
	macAddress: string | null;
	friendlyId: string | null;
	matchedBy: string | null;
	foundByApiKey: boolean;
	foundByMac: boolean;
	foundByFriendlyId: boolean;
	headerKeys: string[];
}) => {
	const headerPreview = headerKeys.slice(0, 8).join(",");
	return [
		`token=${apiKey ? "yes" : "no"}`,
		apiKey ? `tokenValue=${maskApiKey(apiKey)}` : null,
		`mac=${macAddress ? "yes" : "no"}`,
		macAddress ? `macValue=${macAddress}` : null,
		`friendly=${friendlyId ? "yes" : "no"}`,
		friendlyId ? `friendlyValue=${friendlyId}` : null,
		`foundByToken=${foundByApiKey ? "yes" : "no"}`,
		`foundByMac=${foundByMac ? "yes" : "no"}`,
		`foundByFriendly=${foundByFriendlyId ? "yes" : "no"}`,
		`matchedBy=${matchedBy || "none"}`,
		headerPreview ? `headers=${headerPreview}` : null,
	]
		.filter(Boolean)
		.join(" | ");
};

export async function GET(request: Request) {
	const headers = parseRequestHeaders(request);

	if (!headers.apiKey && !headers.macAddress && !headers.friendlyId) {
		const hostUrl = new URL(request.url).origin || "http://localhost:3000";
		const baseUrl = `${hostUrl}/api/bitmap`;
		const detail = summarizeIdentityState({
			apiKey: headers.apiKey,
			macAddress: headers.macAddress,
			friendlyId: headers.friendlyId,
			matchedBy: null,
			foundByApiKey: false,
			foundByMac: false,
			foundByFriendlyId: false,
			headerKeys: headers.headerKeys,
		});
		return buildErrorResponse(
			"Device identity header is required",
			baseUrl,
			"missing-id",
			{
				reason: "No device identity received",
				detail,
				width: headers.width,
				height: headers.height,
				grayscale: 2,
			},
		);
	}

	console.table({
		...headers,
		apiKey: maskApiKey(headers.apiKey),
	});

	const { ready } = await checkDbConnection();
	const baseUrl = `${headers.hostUrl}/api/bitmap`;
	const uniqueId =
		Math.random().toString(36).substring(2, 7) +
		Date.now().toString(36).slice(-3);

	if (!ready) {
		console.warn("Database client not initialized, using noDB mode");
		logInfo("Database client not initialized, using noDB mode", {
			source: "api/display",
			metadata: {
				...headers,
				apiKey: maskApiKey(headers.apiKey),
			},
		});
		return buildDisplayResponse(
			appendImageCacheBust(
				`${baseUrl}/${DEFAULT_SCREEN}.bmp?grayscale=2`,
				uniqueId,
			),
			`${DEFAULT_SCREEN}_${uniqueId}.bmp`,
			DEFAULT_REFRESH_RATE,
		);
	}

	logInfo("Display API Request", {
		source: "api/display",
		metadata: {
			...headers,
			apiKey: maskApiKey(headers.apiKey),
			debug: {
				accessTokenPresent: Boolean(headers.apiKey),
				macPresent: Boolean(headers.macAddress),
				friendlyIdPresent: Boolean(headers.friendlyId),
				modelPresent: Boolean(headers.model),
				width: headers.width,
				height: headers.height,
				updateSource: headers.updateSource,
			},
		},
	});

	try {
		const deviceResolution = await resolveDeviceForDisplay(headers);
		const device = deviceResolution.device;

		if (!device) {
			const detail = summarizeIdentityState({
				apiKey: headers.apiKey,
				macAddress: headers.macAddress,
				friendlyId: headers.friendlyId,
				matchedBy: deviceResolution.matchedBy,
				foundByApiKey: deviceResolution.foundByApiKey,
				foundByMac: deviceResolution.foundByMac,
				foundByFriendlyId: deviceResolution.foundByFriendlyId,
				headerKeys: headers.headerKeys,
			});
			logError(`Display device identity not found | ${detail}`, {
				source: "api/display",
				metadata: {
					apiKey: maskApiKey(headers.apiKey),
					macAddress: headers.macAddress,
					friendlyId: headers.friendlyId,
					matchedBy: deviceResolution.matchedBy,
					foundByApiKey: deviceResolution.foundByApiKey,
					foundByMac: deviceResolution.foundByMac,
					foundByFriendlyId: deviceResolution.foundByFriendlyId,
					model: headers.model,
					width: headers.width,
					height: headers.height,
					updateSource: headers.updateSource,
					headerKeys: headers.headerKeys,
				},
			});
			return buildErrorResponse("Device not found", baseUrl, uniqueId, {
				reason: "Display device identity not found",
				detail,
				width: headers.width,
				height: headers.height,
				grayscale: 2,
			});
		}

		const {
			imageUrl,
			screenToDisplay,
			refreshRate,
			userId,
			fallbackUsed,
			fallbackReason,
		} = await resolveDeviceDisplayTarget({
			device,
			baseUrl,
			updatePlaylistIndex: true,
		});

		const cacheBustedImageUrl = appendImageCacheBust(
			imageUrl,
			uniqueId,
			userId,
			{
				_battery_voltage:
					headers.batteryVoltage || device.battery_voltage?.toString() || null,
				_battery_percent:
					headers.batteryPercent || device.battery_percent?.toString() || null,
			},
		);

		precacheImageInBackground(cacheBustedImageUrl, device.friendly_id);

		// Update device status in background
		updateDeviceStatus(device, headers, refreshRate);
		const metadata = {
			deviceId: device.friendly_id,
			screen: screenToDisplay,
			refreshRate,
			displayMode: device.display_mode,
			imageUrl: cacheBustedImageUrl,
			matchedBy: deviceResolution.matchedBy,
			debug: {
				accessTokenPresent: Boolean(headers.apiKey),
				macPresent: Boolean(headers.macAddress),
				foundByApiKey: deviceResolution.foundByApiKey,
				foundByMac: deviceResolution.foundByMac,
				finalScreen: screenToDisplay,
				fallbackUsed,
				fallbackReason,
			},
		};
		logInfo("Display request device resolution", {
			source: "api/display",
			metadata: {
				apiKey: maskApiKey(headers.apiKey),
				macAddress: headers.macAddress,
				friendlyId: headers.friendlyId,
				deviceId: device.friendly_id,
				matchedBy: deviceResolution.matchedBy,
				foundByApiKey: deviceResolution.foundByApiKey,
				foundByMac: deviceResolution.foundByMac,
				foundByFriendlyId: deviceResolution.foundByFriendlyId,
				finalScreen: screenToDisplay,
				imageUrl: cacheBustedImageUrl,
				fallbackUsed,
				fallbackReason,
				model: headers.model,
				width: headers.width,
				height: headers.height,
				updateSource: headers.updateSource,
			},
		});
		logInfo("Display request successful", { source: "api/display", metadata });

		return buildDisplayResponse(
			cacheBustedImageUrl,
			`${screenToDisplay || "not-found"}_${uniqueId}.bmp`,
			refreshRate,
		);
	} catch (_error) {
		logError("Internal server error", {
			source: "api/display",
			metadata: {
				...headers,
				apiKey: maskApiKey(headers.apiKey),
			},
		});
		return buildErrorResponse("Internal server error", baseUrl, uniqueId, {
			reason: "Display route internal error",
			detail: summarizeIdentityState({
				apiKey: headers.apiKey,
				macAddress: headers.macAddress,
				friendlyId: headers.friendlyId,
				matchedBy: null,
				foundByApiKey: false,
				foundByMac: false,
				foundByFriendlyId: false,
				headerKeys: headers.headerKeys,
			}),
			width: headers.width,
			height: headers.height,
			grayscale: 2,
		});
	}
}

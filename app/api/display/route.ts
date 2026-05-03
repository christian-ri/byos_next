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

export async function GET(request: Request) {
	const headers = parseRequestHeaders(request);

	if (!headers.apiKey && !headers.macAddress && !headers.friendlyId) {
		const hostUrl = new URL(request.url).origin || "http://localhost:3000";
		const baseUrl = `${hostUrl}/api/bitmap`;
		return buildErrorResponse(
			"Device identity header is required",
			baseUrl,
			"missing-id",
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
			logError("Display device identity not found", {
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
			return buildErrorResponse("Device not found", baseUrl, uniqueId);
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
		);

		precacheImageInBackground(cacheBustedImageUrl, device.friendly_id);

		// Update device status in background
		updateDeviceStatus(device, headers, refreshRate);
		const metadata = {
			deviceId: device.friendly_id,
			screen: screenToDisplay,
			refreshRate,
			displayMode: device.display_mode,
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
		return buildErrorResponse("Internal server error", baseUrl, uniqueId);
	}
}

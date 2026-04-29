import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import {
	appendImageCacheBust,
	buildDisplayResponse,
	buildErrorResponse,
	findOrCreateDevice,
	parseRequestHeaders,
	precacheImageInBackground,
	resolveDeviceDisplayTarget,
	updateDeviceStatus,
} from "./utils";

export const DEFAULT_SCREEN = "album";
export const DEFAULT_REFRESH_RATE = 180;

export async function GET(request: Request) {
	const headers = parseRequestHeaders(request);

	// TRMNL API requires Access-Token header
	if (!headers.apiKey) {
		return NextResponse.json(
			{
				status: 401,
				error: "Access-Token header is required",
			},
			{ status: 401 },
		);
	}

	// log all headers in console for debugging
	console.table(headers);

	const { ready } = await checkDbConnection();
	const baseUrl = `${headers.hostUrl}/api/bitmap`;
	const uniqueId =
		Math.random().toString(36).substring(2, 7) +
		Date.now().toString(36).slice(-3);

	if (!ready) {
		console.warn("Database client not initialized, using noDB mode");
		logInfo("Database client not initialized, using noDB mode", {
			source: "api/display",
			metadata: { headers },
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
		metadata: { headers },
	});

	try {
		const device = await findOrCreateDevice(headers);

		if (!device) {
			logError("Error fetching/creating device", {
				source: "api/display",
				metadata: { headers },
			});
			return buildErrorResponse("Device not found", baseUrl, uniqueId);
		}

		const { imageUrl, screenToDisplay, refreshRate } =
			await resolveDeviceDisplayTarget({
				device,
				baseUrl,
				updatePlaylistIndex: true,
			});

		const cacheBustedImageUrl = appendImageCacheBust(imageUrl, uniqueId);

		precacheImageInBackground(cacheBustedImageUrl, device.friendly_id);

		// Update device status in background
		updateDeviceStatus(device, headers, refreshRate);
		const metadata = {
			deviceId: device.friendly_id,
			screen: screenToDisplay,
			refreshRate,
			displayMode: device.display_mode,
		};
		logInfo("Display request successful", { source: "api/display", metadata });

		return buildDisplayResponse(
			cacheBustedImageUrl,
			`${screenToDisplay || "not-found"}_${uniqueId}.bmp`,
			refreshRate,
		);
	} catch (_error) {
		logError("Internal server error", {
			source: "api/display",
			metadata: { headers },
		});
		return buildErrorResponse("Internal server error", baseUrl, uniqueId);
	}
}

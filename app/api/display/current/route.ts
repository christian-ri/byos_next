import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import type { Device } from "@/lib/types";
import {
	appendImageCacheBust,
	buildDisplayResponse,
	parseRequestHeaders,
	resolveDeviceDisplayTarget,
} from "../utils";

/**
 * GET /api/display/current
 * Fetch the current screen for a device
 *
 * Headers:
 * - Access-Token (required): Device API Key
 */
export async function GET(request: Request) {
	const headers = parseRequestHeaders(request);
	const { apiKey } = headers;

	if (!apiKey) {
		return NextResponse.json(
			{
				status: 401,
				error: "Access-Token header is required",
			},
			{ status: 401 },
		);
	}

	const { ready } = await checkDbConnection();
	if (!ready) {
		logInfo("Database not available for /api/display/current", {
			source: "api/display/current",
			metadata: { apiKey },
		});
		return NextResponse.json(
			{
				status: 503,
				error: "Database not available",
			},
			{ status: 503 },
		);
	}

	try {
		const device = await db
			.selectFrom("devices")
			.selectAll()
			.where("api_key", "=", apiKey)
			.executeTakeFirst();

		if (!device) {
			return NextResponse.json(
				{
					status: 404,
					error: "Device not found",
				},
				{ status: 404 },
			);
		}

		const deviceData = device as unknown as Device;
		const baseUrl = `${headers.hostUrl}/api/bitmap`;
		const { imageUrl, screenToDisplay, refreshRate, userId } =
			await resolveDeviceDisplayTarget({
				device: deviceData,
				baseUrl,
			});
		const uniqueId = Date.now().toString(36);

		logInfo("Current display request successful", {
			source: "api/display/current",
			metadata: {
				deviceId: deviceData.friendly_id,
				screen: screenToDisplay,
			},
		});

		return buildDisplayResponse(
			appendImageCacheBust(imageUrl, uniqueId, userId, {
				_battery_voltage: deviceData.battery_voltage?.toString() || null,
				_battery_percent: deviceData.battery_percent?.toString() || null,
			}),
			`${screenToDisplay}_${uniqueId}.bmp`,
			refreshRate,
			{
				rendered_at: deviceData.last_update_time || new Date().toISOString(),
			},
		);
	} catch (error) {
		logError(error as Error, {
			source: "api/display/current",
			metadata: { apiKey },
		});
		return NextResponse.json(
			{
				status: 500,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}

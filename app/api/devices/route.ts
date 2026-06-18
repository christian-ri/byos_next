import { NextResponse } from "next/server";
import { withUserScope } from "@/lib/database/scoped-db";
import { checkDbConnection } from "@/lib/database/utils";
import { logError, logInfo } from "@/lib/logger";
import type { Device } from "@/lib/types";
import { estimateBatteryLife } from "@/utils/helpers";

/**
 * GET /api/devices
 * List all devices
 *
 * Note: In TRMNL API, this requires bearer auth, but for BYOS we'll return all devices
 * since there's no user authentication system yet. This can be enhanced later.
 */
export async function GET(_request: Request) {
	const { ready } = await checkDbConnection();

	if (!ready) {
		logInfo("Database not available for /api/devices", {
			source: "api/devices",
		});
		return NextResponse.json(
			{
				error: "Database not available",
			},
			{ status: 503 },
		);
	}

	try {
		const devices = await withUserScope((scopedDb) =>
			scopedDb
				.selectFrom("devices")
				.selectAll()
				.orderBy("created_at", "desc")
				.execute(),
		);

		// Transform devices to match TRMNL API format
		const deviceData = devices.map((device) => {
			const deviceObj = device as unknown as Device;
			const batteryVoltage =
				deviceObj.battery_voltage !== null &&
				deviceObj.battery_voltage !== undefined
					? Number.parseFloat(deviceObj.battery_voltage.toString())
					: null;
			const batteryPercent =
				deviceObj.battery_percent !== null &&
				deviceObj.battery_percent !== undefined
					? Number.parseFloat(deviceObj.battery_percent.toString())
					: null;
			const percentCharged =
				batteryPercent ??
				(batteryVoltage
					? estimateBatteryLife(batteryVoltage, 48).batteryPercentage
					: null);
			return {
				id: Number.parseInt(device.id.toString(), 10),
				name: deviceObj.name,
				friendly_id: deviceObj.friendly_id,
				mac_address: deviceObj.mac_address,
				battery_voltage: batteryVoltage,
				battery_percent: batteryPercent,
				rssi: deviceObj.rssi,
				percent_charged: percentCharged,
				wifi_strength: deviceObj.rssi
					? Math.min(100, Math.max(0, ((deviceObj.rssi + 100) / 70) * 100))
					: null,
			};
		});

		logInfo("Devices list request successful", {
			source: "api/devices",
			metadata: { count: deviceData.length },
		});

		return NextResponse.json(
			{
				data: deviceData,
			},
			{ status: 200 },
		);
	} catch (error) {
		logError(error as Error, {
			source: "api/devices",
		});
		return NextResponse.json(
			{
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}

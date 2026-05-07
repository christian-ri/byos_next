import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const TARGET_SLUGS = [
	"apple-photos",
	"bitmap-patterns",
	"calendar-apple",
	"f1-race-standings",
	"f1-weekend-teams",
	"lp-weather",
	"pollen-air-quality",
	"skywatch",
	"whos-that-pokemon",
];

const PORT = 3123;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_ROOT = path.join(
	process.cwd(),
	"debug-renders",
	new Date().toISOString().replace(/[:.]/g, "-"),
);

async function waitForServer(timeoutMs = 30000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const response = await fetch(
				`${BASE_URL}/api/render-debug/apple-photos?format=bitmap`,
			);
			if (response.ok || response.status >= 500) {
				return;
			}
		} catch (_error) {
			// keep polling until server is ready
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
	throw new Error(`Timed out waiting for Next dev server on ${BASE_URL}`);
}

async function fetchBinary(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Request failed for ${url}: ${response.status}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

async function main() {
	await fs.mkdir(OUTPUT_ROOT, { recursive: true });

	const server = spawn(
		process.platform === "win32" ? "node.exe" : "./node_modules/.bin/next",
		["dev", "-p", String(PORT)],
		{
			cwd: process.cwd(),
			env: { ...process.env, AUTH_ENABLED: "false" },
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	server.stdout.on("data", (chunk) => process.stdout.write(chunk));
	server.stderr.on("data", (chunk) => process.stderr.write(chunk));

	try {
		await waitForServer();

		for (const slug of TARGET_SLUGS) {
			const rendererPng = await fetchBinary(
				`${BASE_URL}/api/render-debug/${slug}?format=renderer-png`,
			);
			const bitmap = await fetchBinary(
				`${BASE_URL}/api/render-debug/${slug}?format=bitmap`,
			);
			const finalPng = await fetchBinary(
				`${BASE_URL}/api/render-debug/${slug}?format=final-png`,
			);

			await fs.writeFile(
				path.join(OUTPUT_ROOT, `${slug}.renderer.png`),
				rendererPng,
			);
			await fs.writeFile(path.join(OUTPUT_ROOT, `${slug}.final.bmp`), bitmap);
			await fs.writeFile(
				path.join(OUTPUT_ROOT, `${slug}.final-1bit.png`),
				finalPng,
			);
		}

		console.log(`Rendered debug outputs to ${OUTPUT_ROOT}`);
	} finally {
		server.kill("SIGTERM");
	}
}

main().catch((error) => {
	console.error("Failed to render recipe debug outputs:", error);
	process.exitCode = 1;
});

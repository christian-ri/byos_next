import { existsSync } from "node:fs";
import { platform } from "node:os";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const LOCAL_EXECUTABLE_CANDIDATES: Record<string, string[]> = {
	darwin: [
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
		"/Applications/Chromium.app/Contents/MacOS/Chromium",
	],
	linux: [
		"/usr/bin/google-chrome-stable",
		"/usr/bin/google-chrome",
		"/usr/bin/chromium-browser",
		"/usr/bin/chromium",
	],
	win32: [
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
	],
};

const resolveLocalExecutablePath = () => {
	const configuredPath = process.env.CHROMIUM_EXECUTABLE_PATH?.trim();
	if (configuredPath) {
		return existsSync(configuredPath) ? configuredPath : null;
	}

	const candidates = LOCAL_EXECUTABLE_CANDIDATES[platform()] ?? [];
	return candidates.find((candidate) => existsSync(candidate)) ?? null;
};

const launchLocalBrowser = async (executablePath: string) => {
	return puppeteer.launch({
		defaultViewport: null,
		executablePath,
		headless: true,
	});
};

export async function getChromiumBrowser() {
	const localExecutablePath = resolveLocalExecutablePath();

	if (localExecutablePath) {
		try {
			return await launchLocalBrowser(localExecutablePath);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unknown local Chromium launch error";
			throw new Error(
				`Failed to launch local Chromium executable at ${localExecutablePath}. Set CHROMIUM_EXECUTABLE_PATH to a working Chrome/Chromium binary if needed. ${message}`,
			);
		}
	}

	try {
		const executablePath = await chromium.executablePath();
		const chromiumWithOptionalHeadless = chromium as typeof chromium & {
			headless?: boolean | "shell";
		};
		if (!executablePath) {
			throw new Error(
				"Chromium executable path was empty. Ensure @sparticuz/chromium is installed for the current runtime.",
			);
		}

		return await puppeteer.launch({
			args: chromium.args,
			defaultViewport: null,
			executablePath,
			headless: chromiumWithOptionalHeadless.headless ?? true,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown Chromium launch error";
		throw new Error(
			`Failed to launch Chromium renderer. Verify puppeteer-core and @sparticuz/chromium are installed and compatible with the deployment runtime, or set CHROMIUM_EXECUTABLE_PATH for local development. ${message}`,
		);
	}
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	trailingSlash: false,
	skipTrailingSlashRedirect: true,
	cacheComponents: true,
	outputFileTracingIncludes: {
		"/api/render/*": [
			"./node_modules/@sparticuz/chromium/bin/**/*",
			"./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**/*",
		],
		"/api/bitmap/*": [
			"./node_modules/@sparticuz/chromium/bin/**/*",
			"./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**/*",
		],
		"/api/display": [
			"./node_modules/@sparticuz/chromium/bin/**/*",
			"./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**/*",
		],
	},
	// Mark native modules as external for server components
	serverExternalPackages: ["@takumi-rs/core", "@takumi-rs/helpers"],
};

export default nextConfig;

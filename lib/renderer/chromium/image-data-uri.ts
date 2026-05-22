import fs from "node:fs/promises";
import path from "node:path";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

function getMimeType(filePath: string) {
	const extension = path.extname(filePath).toLowerCase();
	switch (extension) {
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".webp":
			return "image/webp";
		case ".gif":
			return "image/gif";
		case ".svg":
			return "image/svg+xml";
		default:
			return "image/png";
	}
}

function normalizePublicAssetPath(assetPath: string) {
	try {
		if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
			const parsed = new URL(assetPath);
			return decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
		}

		return assetPath.replace(/^\/+/, "");
	} catch {
		return assetPath.replace(/^\/+/, "");
	}
}

export async function publicAssetToDataUri(assetPath: string) {
	const normalizedPath = normalizePublicAssetPath(assetPath);
	if (!normalizedPath) return null;

	const absolutePath = path.resolve(PUBLIC_ROOT, normalizedPath);
	if (!absolutePath.startsWith(PUBLIC_ROOT)) {
		return null;
	}

	try {
		const file = await fs.readFile(absolutePath);
		return `data:${getMimeType(absolutePath)};base64,${file.toString("base64")}`;
	} catch {
		return null;
	}
}

export async function fetchImageUrlToDataUri(
	imageUrl: string,
	allowedHosts: string[],
) {
	try {
		const parsed = new URL(imageUrl);
		if (!["http:", "https:"].includes(parsed.protocol)) {
			return null;
		}

		if (!allowedHosts.includes(parsed.hostname)) {
			return null;
		}

		const response = await fetch(imageUrl, {
			headers: { Accept: "image/*" },
			next: { revalidate: 300 },
		});
		if (!response.ok) {
			return null;
		}

		const contentType = response.headers.get("content-type") || "image/png";
		const bytes = Buffer.from(await response.arrayBuffer());
		return `data:${contentType};base64,${bytes.toString("base64")}`;
	} catch {
		return null;
	}
}

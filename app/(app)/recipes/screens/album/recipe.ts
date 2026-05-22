import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { publicAssetToDataUri } from "@/lib/renderer/chromium/image-data-uri";

export const id = "album";
export const title = "Album";
export const renderer = "chromium";

type AlbumRecipeData = {
	params?: {
		imageUrl?: string;
	};
};

function formatClock(timeZone: string) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	})
		.format(new Date())
		.replace(" ", "");
}

function formatZoneLabel(timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone,
		timeZoneName: "short",
	}).formatToParts(new Date());
	return parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
}

export async function renderHtml(data: AlbumRecipeData) {
	const imageUrl = data.params?.imageUrl || "/album/london.png";
	const imageDataUri =
		(await publicAssetToDataUri(imageUrl)) ||
		(await publicAssetToDataUri("/album/london.png"));
	const timeZone = "Europe/London";

	const bodyHtml = `
		<section class="screen album-screen">
			<div class="album-photo">
				${
					imageDataUri
						? `<img src="${imageDataUri}" alt="Album" class="album-photo__image" />`
						: `<div class="album-photo__fallback"></div>`
				}
				<div class="album-overlay">
					<div class="album-clock-card">
						<div class="album-clock">${escapeHtml(formatClock(timeZone))}</div>
						<div class="album-zone">London ${escapeHtml(formatZoneLabel(timeZone))}</div>
					</div>
				</div>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.album-screen {
				position: relative;
				background: #000;
			}

			.album-photo,
			.album-photo__image,
			.album-photo__fallback {
				width: 100%;
				height: 100%;
			}

			.album-photo {
				position: relative;
			}

			.album-photo__image {
				display: block;
				object-fit: cover;
				filter: grayscale(1) contrast(1.06);
			}

			.album-photo__fallback {
				background:
					linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.2)),
					radial-gradient(circle at top left, #dcdcdc, #4a4a4a 58%, #111 100%);
			}

			.album-overlay {
				position: absolute;
				top: 20px;
				right: 20px;
			}

			.album-clock-card {
				background: rgba(0, 0, 0, 0.62);
				border: 2px solid rgba(255,255,255,0.15);
				padding: 16px 18px 14px;
				display: grid;
				justify-items: end;
				gap: 8px;
				color: #fff;
			}

			.album-clock {
				font-size: 52px;
				line-height: 0.9;
				font-weight: 800;
				letter-spacing: -0.05em;
				text-transform: uppercase;
			}

			.album-zone {
				font-size: 14px;
				line-height: 1.1;
				font-weight: 700;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}
		`,
	});
}

import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";
import { fetchImageUrlToDataUri } from "@/lib/renderer/chromium/image-data-uri";
import getData from "./getData";

export const id = "bitcoin-price";
export const title = "Crypto Price Tracker";
export const renderer = "chromium";

export { getData };

type CryptoPriceData = {
	price?: string;
	change24h?: string;
	marketCap?: string;
	volume24h?: string;
	lastUpdated?: string;
	high24h?: string;
	low24h?: string;
	historicalPrices?: Array<{ timestamp: number; price: number }>;
	cryptoName?: string;
	cryptoImage?: string;
};

function buildSparkline(prices: Array<{ timestamp: number; price: number }>) {
	const points = prices.slice(-28);
	if (points.length < 2) return "";

	const width = 382;
	const height = 124;
	const padding = 10;
	const values = points.map((point) => point.price);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const spread = Math.max(1, max - min);

	const polyline = points
		.map((point, index) => {
			const x =
				padding +
				(index / Math.max(1, points.length - 1)) * (width - padding * 2);
			const y =
				height -
				padding -
				((point.price - min) / spread) * (height - padding * 2);
			return `${x},${y}`;
		})
		.join(" ");

	return `
		<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
			<rect x="0" y="0" width="${width}" height="${height}" rx="16" fill="#fff"></rect>
			<line x1="10" y1="112" x2="372" y2="112" stroke="#d6d1c7" stroke-width="2"></line>
			<polyline fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${polyline}"></polyline>
		</svg>
	`;
}

export async function renderHtml(data: CryptoPriceData) {
	const isPositive = !String(data.change24h || "0").startsWith("-");
	const cleanChange = isPositive
		? String(data.change24h || "0")
		: String(data.change24h || "0").slice(1);
	const chartSvg = buildSparkline(data.historicalPrices || []);
	const logoDataUri = data.cryptoImage
		? await fetchImageUrlToDataUri(data.cryptoImage, [
				"assets.coingecko.com",
				"coin-images.coingecko.com",
			])
		: null;

	const stats = [
		{ label: "Market Cap", value: data.marketCap || "N/A" },
		{ label: "24h Volume", value: data.volume24h || "N/A" },
		{ label: "24h High", value: data.high24h || "N/A" },
		{ label: "24h Low", value: data.low24h || "N/A" },
	];

	const bodyHtml = `
		<section class="screen crypto-screen">
			<div class="crypto-shell">
				<header class="crypto-header">
					<div>
						<div class="meta">${escapeHtml(data.cryptoName || "Bitcoin")} price tracker</div>
						<h1 class="title">$${escapeHtml(data.price || "N/A")}</h1>
						<div class="crypto-change crypto-change--${isPositive ? "up" : "down"}">
							${isPositive ? "↑" : "↓"} ${escapeHtml(cleanChange)}%
						</div>
					</div>
					${
						logoDataUri
							? `<div class="crypto-logo"><img src="${logoDataUri}" alt="${escapeHtml(data.cryptoName || "Crypto")} logo" /></div>`
							: ""
					}
				</header>
				<div class="crypto-main">
					<section class="crypto-chart">
						<div class="title title--small">24 hour movement</div>
						${chartSvg || `<div class="crypto-empty">No historical data available</div>`}
					</section>
					<section class="crypto-stats">
						${stats
							.map(
								(stat) => `
									<div class="crypto-stat">
										<div class="meta">${escapeHtml(stat.label)}</div>
										<div class="value">$${escapeHtml(stat.value)}</div>
									</div>
								`,
							)
							.join("")}
					</section>
				</div>
				<footer class="crypto-footer">
					<div class="footer">${escapeHtml(data.cryptoName || "Crypto")}</div>
					<div class="meta">Updated ${escapeHtml(data.lastUpdated || "N/A")}</div>
				</footer>
			</div>
		</section>
	`;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
			.crypto-screen {
				padding: 24px;
				background: #f5f2ec;
			}

			.crypto-shell {
				height: 100%;
				border: 2px solid #111;
				padding: 18px;
				background: linear-gradient(180deg, #fbfaf7 0%, #f1eee7 100%);
				display: grid;
				grid-template-rows: auto 1fr auto;
				gap: 14px;
			}

			.crypto-header,
			.crypto-footer {
				display: flex;
				justify-content: space-between;
				align-items: end;
				gap: 16px;
			}

			.crypto-logo {
				width: 88px;
				height: 88px;
				border: 2px solid #111;
				border-radius: 44px;
				background: #fff;
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
			}

			.crypto-logo img {
				width: 64px;
				height: 64px;
				display: block;
				object-fit: contain;
				filter: grayscale(1);
			}

			.crypto-change {
				margin-top: 8px;
				font-size: 26px;
				line-height: 1.05;
				font-weight: 800;
			}

			.crypto-main {
				display: grid;
				grid-template-columns: 1.25fr 1fr;
				gap: 14px;
				min-height: 0;
			}

			.crypto-chart,
			.crypto-stat {
				border: 2px solid #111;
				background: #fff;
			}

			.crypto-chart {
				padding: 14px;
				display: grid;
				gap: 12px;
				align-content: start;
			}

			.crypto-stats {
				display: grid;
				grid-template-columns: 1fr;
				gap: 10px;
			}

			.crypto-stat {
				padding: 14px;
				display: grid;
				gap: 8px;
				align-content: start;
			}

			.crypto-stat .value {
				font-size: 22px;
				line-height: 1.1;
				word-break: break-word;
			}

			.crypto-empty {
				height: 124px;
				display: flex;
				align-items: center;
				justify-content: center;
				border: 2px dashed #b6b0a5;
				font-size: 16px;
				font-weight: 600;
			}
		`,
	});
}

import { getTrmnlRenderHeight, getTrmnlRenderWidth } from "@/lib/renderer/env";
import { escapeHtml } from "./escape-html";

export function buildTrmnlHtmlShell(options: {
	title?: string;
	bodyHtml: string;
	width?: number;
	height?: number;
	extraCss?: string;
}): string {
	const width = options.width ?? getTrmnlRenderWidth();
	const height = options.height ?? getTrmnlRenderHeight();
	const title = escapeHtml(options.title ?? "TRMNL Chromium Render");
	const extraCss = options.extraCss?.trim() ?? "";

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>${title}</title>
  <style>
    html, body {
      width: ${width}px;
      height: ${height}px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #fff;
      color: #000;
      box-sizing: border-box;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: Inter, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }

    #root,
    .screen {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #fff;
      color: #000;
    }

    .layout {
      display: flex;
      gap: 16px;
    }

    .layout--col {
      flex-direction: column;
    }

    .title {
      margin: 0;
      font-size: 32px;
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .title--small {
      font-size: 20px;
      line-height: 1.2;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 18px 20px;
      border: 2px solid #111;
      background: #fff;
    }

    .meta {
      font-size: 14px;
      line-height: 1.3;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .value {
      font-size: 24px;
      line-height: 1.25;
      font-weight: 700;
    }

    .description {
      font-size: 18px;
      line-height: 1.4;
      font-weight: 500;
    }

    .footer {
      font-size: 15px;
      line-height: 1.35;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* TODO: Replace this baseline with bundled local TRMNL Framework CSS. */
    ${extraCss}
  </style>
</head>
<body>
  <div id="root">${options.bodyHtml}</div>
</body>
</html>`;
}

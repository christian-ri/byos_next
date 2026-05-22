import { escapeHtml } from "@/lib/renderer/chromium/escape-html";
import { buildTrmnlHtmlShell } from "@/lib/renderer/chromium/html-shell";

export const id = "chromium-simple-text";
export const title = "Chromium Simple Text";
export const renderer = "chromium";

export type ChromiumSimpleTextData = {
	title: string;
	body: string;
	footer: string;
};

export async function getData(): Promise<ChromiumSimpleTextData> {
	return {
		title: "Chromium Renderer",
		body: "Rendered as HTML/CSS at 800×480, captured by Chromium, then postprocessed for TRMNL.",
		footer: "Pixel-perfect path",
	};
}

export function renderHtml(data: ChromiumSimpleTextData) {
	const bodyHtml = `
    <section class="screen">
      <div class="layout layout--col" style="padding: 28px; justify-content: space-between;">
        <div class="layout layout--col" style="gap: 24px;">
          <header class="layout layout--col" style="gap: 10px;">
            <p class="meta">Future renderer</p>
            <h1 class="title">${escapeHtml(data.title)}</h1>
          </header>
          <article class="item">
            <div class="content">
              <p class="title title--small">Canonical output</p>
              <p class="description">${escapeHtml(data.body)}</p>
            </div>
          </article>
        </div>
        <footer class="footer">${escapeHtml(data.footer)}</footer>
      </div>
    </section>
  `;

	return buildTrmnlHtmlShell({
		title,
		bodyHtml,
		extraCss: `
      .screen {
        border: 2px solid #111;
      }
    `,
	});
}

const HTML_ESCAPE_LOOKUP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function escapeHtml(value: unknown): string {
	return String(value ?? "").replace(/[&<>"']/g, (character) => {
		return HTML_ESCAPE_LOOKUP[character] ?? character;
	});
}

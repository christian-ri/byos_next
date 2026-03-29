export async function fetchWithTimeout(
	url: string,
	init: RequestInit = {},
	timeoutMs = 8000,
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal,
			next: { revalidate: 0 },
		});

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		return response;
	} finally {
		clearTimeout(timeoutId);
	}
}

export async function fetchJsonWithTimeout<T>(
	url: string,
	init: RequestInit = {},
	timeoutMs = 8000,
): Promise<T> {
	const response = await fetchWithTimeout(url, init, timeoutMs);
	return response.json() as Promise<T>;
}

export async function fetchTextWithTimeout(
	url: string,
	init: RequestInit = {},
	timeoutMs = 8000,
): Promise<string> {
	const response = await fetchWithTimeout(url, init, timeoutMs);
	return response.text();
}

export function parseLooseHeaderString(
	value?: string,
): Record<string, string> | undefined {
	if (!value?.trim()) {
		return undefined;
	}

	const pairs = value
		.split(/[\n&]/)
		.map((part) => part.trim())
		.filter(Boolean);

	const headers = pairs.reduce<Record<string, string>>((acc, pair) => {
		const separator = pair.includes(":") ? ":" : "=";
		const index = pair.indexOf(separator);
		if (index === -1) {
			return acc;
		}

		const key = pair.slice(0, index).trim();
		const headerValue = pair.slice(index + 1).trim();
		if (key && headerValue) {
			acc[key] = headerValue;
		}
		return acc;
	}, {});

	return Object.keys(headers).length > 0 ? headers : undefined;
}

export function formatDateTime(
	value: string | Date,
	options: Intl.DateTimeFormatOptions,
	timeZone?: string,
) {
	const date = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat("en-US", {
		...options,
		...(timeZone ? { timeZone } : {}),
	}).format(date);
}

export function formatUpdatedAt(value: string | Date, timeZone?: string) {
	return formatDateTime(
		value,
		{
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		},
		timeZone,
	);
}

export function dateSeedKey(timeZone = "UTC") {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());

	const values = parts.reduce<Record<string, string>>((acc, part) => {
		if (part.type !== "literal") {
			acc[part.type] = part.value;
		}
		return acc;
	}, {});

	return `${values.year}-${values.month}-${values.day}`;
}

export function hashSeed(input: string) {
	let hash = 0;

	for (let index = 0; index < input.length; index += 1) {
		hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
	}

	return hash;
}

export function pickDeterministicIndex(length: number, seed: string) {
	if (length <= 0) return 0;
	return hashSeed(seed) % length;
}

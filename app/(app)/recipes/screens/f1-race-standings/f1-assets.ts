const TRACK_BASE_URL =
	"https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits/minimal/black";

export function safeLower(value: unknown) {
	if (typeof value === "string") {
		return value.toLowerCase();
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value).toLowerCase();
	}
	return "";
}

function normalizeKey(value: unknown) {
	return safeLower(value)
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

const TRACK_LAYOUT_BY_KEY: Record<string, string> = {
	austin: "austin-1",
	"circuit of the americas": "austin-1",
	bahrain: "bahrain-1",
	baku: "baku-1",
	barcelona: "catalunya-6",
	catalunya: "catalunya-6",
	"abu dhabi": "yas-marina-2",
	interlagos: "interlagos-2",
	imola: "imola-3",
	jeddah: "jeddah-1",
	"las vegas": "las-vegas-1",
	lusail: "lusail-1",
	qatar: "lusail-1",
	"marina bay": "marina-bay-4",
	singapore: "marina-bay-4",
	melbourne: "melbourne-2",
	"mexico city": "mexico-city-3",
	miami: "miami-1",
	monaco: "monaco-6",
	montreal: "montreal-6",
	monza: "monza-7",
	"red bull ring": "spielberg-3",
	spielberg: "spielberg-3",
	"sao paulo": "interlagos-2",
	shanghai: "shanghai-1",
	silverstone: "silverstone-8",
	spa: "spa-francorchamps-4",
	"spa francorchamps": "spa-francorchamps-4",
	suzuka: "suzuka-2",
	"yas marina": "yas-marina-2",
	zandvoort: "zandvoort-5",
	madrid: "madring-1",
	madring: "madring-1",
	hungaroring: "hungaroring-3",
};

const TEAM_BADGE_BY_NAME: Record<string, string> = {
	alpine: "A",
	audi: "Au",
	"audi revolut f1 team": "Au",
	"stake f1 team kick sauber": "Au",
	"sauber motorsport": "Au",
	sauber: "Au",
	"aston martin": "AM",
	"aston martin aramco": "AM",
	cadillac: "Ca",
	"cadillac formula 1 team": "Ca",
	ferrari: "F",
	haas: "H",
	mclaren: "Mc",
	mercedes: "M",
	"racing bulls": "RB",
	"visa cash app racing bulls": "RB",
	rb: "RB",
	"red bull racing": "RB",
	oracle: "RB",
	williams: "W",
};

export function getTrackImageUrl(
	...candidates: Array<string | null | undefined>
) {
	for (const candidate of candidates) {
		if (!candidate) continue;
		const key = normalizeKey(candidate);
		const layout = TRACK_LAYOUT_BY_KEY[key];
		if (layout) {
			return `${TRACK_BASE_URL}/${layout}.svg`;
		}
	}

	return null;
}

export function getTeamBadgeLabel(teamName: string) {
	const key = normalizeKey(teamName);
	const fallbackLabel = String(teamName || "").trim().slice(0, 2).toUpperCase();
	return TEAM_BADGE_BY_NAME[key] || fallbackLabel || "??";
}

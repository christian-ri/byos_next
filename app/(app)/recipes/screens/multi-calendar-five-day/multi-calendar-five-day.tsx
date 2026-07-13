import { getData, renderHtml } from "./recipe";

export default async function MultiCalendarFiveDayScreen() {
	const data = await getData();
	return (
		<iframe
			title="Multi-Kalender · Nächste 5 Tage"
			srcDoc={renderHtml(data)}
			style={{
				display: "block",
				width: 800,
				height: 480,
				border: "none",
				background: "#fff",
			}}
		/>
	);
}

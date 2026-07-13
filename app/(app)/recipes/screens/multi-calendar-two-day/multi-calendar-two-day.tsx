import { getData, renderHtml } from "./recipe";

export default async function MultiCalendarTwoDayScreen() {
	const data = await getData();
	return (
		<iframe
			title="Multi-Kalender · Zwei Tage"
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

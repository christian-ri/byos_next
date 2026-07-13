import { getData, renderHtml } from "./recipe";

export default async function MultiCalendarTodayScreen() {
	const data = await getData();
	return (
		<iframe
			title="Multi-Kalender · Heute"
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

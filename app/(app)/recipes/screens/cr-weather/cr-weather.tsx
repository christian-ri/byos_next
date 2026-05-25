import { getData, renderHtml } from "./recipe";

export default async function CrWeatherScreen() {
	const data = await getData();
	const html = renderHtml(data);

	return (
		<iframe
			title="CR Weather"
			srcDoc={html}
			style={{
				display: "block",
				width: "800px",
				height: "480px",
				border: "none",
				background: "#fff",
			}}
		/>
	);
}

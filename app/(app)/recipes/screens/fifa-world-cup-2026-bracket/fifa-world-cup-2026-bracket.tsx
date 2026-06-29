import { getData, renderHtml } from "./recipe";

export default async function FifaWorldCup2026BracketScreen() {
	const data = await getData();
	const html = renderHtml(data);

	return (
		<iframe
			title="FIFA World Cup 2026 Bracket"
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

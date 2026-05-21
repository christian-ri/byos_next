import { use } from "react";
import { getData, renderHtml } from "./recipe";

export default function ChromiumSimpleTextScreen() {
	const data = use(getData());
	const html = renderHtml(data);

	return (
		<iframe
			title="Chromium Simple Text"
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

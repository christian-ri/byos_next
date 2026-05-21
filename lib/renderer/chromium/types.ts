export type ChromiumRenderOptions = {
	width?: number;
	height?: number;
	timeoutMs?: number;
	deviceScaleFactor?: number;
};

export type ChromiumRenderResult = {
	png: Buffer;
	width: number;
	height: number;
	renderedAt: string;
};

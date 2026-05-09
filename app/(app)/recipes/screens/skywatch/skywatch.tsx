import { PreSatori } from "@/utils/pre-satori";
import type { SkyWatchRecipeData } from "./getData";

type Props = SkyWatchRecipeData & {
	width?: number;
	height?: number;
};

const WIDTH = 800;
const HEIGHT = 480;
const MAP_LEFT = 0;
const MAP_TOP = 0;
const MAP_WIDTH = WIDTH;
const MAP_HEIGHT = HEIGHT - 42;
const LABEL_WIDTH = 168;
const LABEL_HEIGHT = 64;
const GRID_COLUMNS = [100, 200, 300, 400, 500, 600, 700];
const GRID_ROWS = [80, 160, 240, 320, 400];

function formatTimeLabel(updatedAt: string) {
	const match = updatedAt.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
	return match ? match[1].toUpperCase() : updatedAt;
}

function labelPlacement(x: number, y: number, index: number) {
	const prefersLeft = x > 0.7;
	const prefersAbove = y > 0.72;
	const offsetX = prefersLeft ? -LABEL_WIDTH - 18 : 18;
	const offsetYBase = prefersAbove ? -LABEL_HEIGHT - 10 : -6;
	const offsetY = offsetYBase + ((index % 3) - 1) * 6;

	return {
		left: Math.max(
			8,
			Math.min(WIDTH - LABEL_WIDTH - 8, x * MAP_WIDTH + offsetX),
		),
		top: Math.max(
			8,
			Math.min(MAP_HEIGHT - LABEL_HEIGHT - 8, y * MAP_HEIGHT + offsetY),
		),
		align: prefersLeft ? "right" : "left",
	};
}

function PlaneIcon({
	heading = 0,
	size = 34,
	opacity = 1,
}: {
	heading?: number;
	size?: number;
	opacity?: number;
}) {
	return (
		<svg
			viewBox="0 0 238.45445 228.24998"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			style={{
				transform: `rotate(${heading + 45}deg)`,
				display: "block",
				opacity,
			}}
		>
			<path
				fill="#ffffff"
				fillRule="evenodd"
				d="M194.67321 0 70.641958 53.625c-10.38227-6.92107-34.20058-21.27539-38.90545-23.44898-39.4400301-18.22079-36.9454001 14.73107-20.34925 24.6052 4.53917 2.70065 27.72352 17.17823 43.47345 26.37502l17.90625 133.9375 22.21875 13.15625 11.531252-120.9375 71.53125 36.6875 3.84375 39.21875 14.53125 8.625 11.09375-42.40625.125.0625 30.8125-31.53125-14.875-8-35.625 16.90625-68.28125-42.4375L217.36071 12.25 194.67321 0z"
			/>
		</svg>
	);
}

function CrosshairIcon() {
	return (
		<svg viewBox="0 0 40 40" width={22} height={22} aria-hidden="true">
			<circle
				cx="20"
				cy="20"
				r="7.5"
				fill="none"
				stroke="#fff"
				strokeWidth="2.6"
			/>
			<path
				d="M20 3.5v8M20 28.5v8M3.5 20h8M28.5 20h8"
				stroke="#fff"
				strokeWidth="2.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export default function SkyWatch({
	title,
	locationLabel,
	radiusLabel,
	updatedAt,
	map,
	aircraft,
	width = 800,
	height = 480,
}: Props) {
	const timestampLabel = formatTimeLabel(updatedAt);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					background: "#111111",
					color: "#ffffff",
					fontFamily: "var(--font-geneva-9)",
					position: "relative",
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "rgba(0,0,0,0.12)",
					}}
				/>

				<div
					style={{
						position: "absolute",
						left: MAP_LEFT,
						top: MAP_TOP,
						width: MAP_WIDTH,
						height: MAP_HEIGHT,
						overflow: "hidden",
					}}
				>
					{map.tiles.map((tile) => (
						<div
							key={tile.id}
							style={{
								position: "absolute",
								left: tile.left * (MAP_WIDTH / map.width),
								top: tile.top * (MAP_HEIGHT / map.height),
								width: tile.size * (MAP_WIDTH / map.width),
								height: tile.size * (MAP_HEIGHT / map.height),
								backgroundImage: `url(${tile.src})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
								opacity: 0.62,
							}}
						/>
					))}
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: "rgba(0,0,0,0.08)",
						}}
					/>
					<svg
						viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
						width={MAP_WIDTH}
						height={MAP_HEIGHT}
						aria-hidden="true"
						style={{
							position: "absolute",
							left: 0,
							top: 0,
							display: "block",
						}}
					>
						{GRID_COLUMNS.map((left) => (
							<line
								key={`grid-col-overlay-${left}`}
								x1={left}
								y1="0"
								x2={left}
								y2={MAP_HEIGHT}
								stroke="rgba(255,255,255,0.06)"
								strokeWidth="1"
							/>
						))}
						{GRID_ROWS.map((top) => (
							<line
								key={`grid-row-overlay-${top}`}
								x1="0"
								y1={top}
								x2={MAP_WIDTH}
								y2={top}
								stroke="rgba(255,255,255,0.06)"
								strokeWidth="1"
							/>
						))}
						<circle
							cx={MAP_WIDTH / 2}
							cy={MAP_HEIGHT / 2}
							r="210"
							fill="none"
							stroke="rgba(255,255,255,0.10)"
							strokeWidth="1"
						/>
						<circle
							cx={MAP_WIDTH / 2}
							cy={MAP_HEIGHT / 2}
							r="135"
							fill="none"
							stroke="rgba(255,255,255,0.16)"
							strokeWidth="1"
						/>
						<circle
							cx={MAP_WIDTH / 2}
							cy={MAP_HEIGHT / 2}
							r="60"
							fill="none"
							stroke="rgba(255,255,255,0.22)"
							strokeWidth="1"
						/>
						<line
							x1="0"
							y1={MAP_HEIGHT / 2}
							x2={MAP_WIDTH}
							y2={MAP_HEIGHT / 2}
							stroke="rgba(255,255,255,0.14)"
							strokeWidth="1"
						/>
						<line
							x1={MAP_WIDTH / 2}
							y1="0"
							x2={MAP_WIDTH / 2}
							y2={MAP_HEIGHT}
							stroke="rgba(255,255,255,0.14)"
							strokeWidth="1"
						/>
					</svg>

					<div
						style={{
							position: "absolute",
							left: MAP_WIDTH / 2 - 11,
							top: MAP_HEIGHT / 2 - 11,
							width: 22,
							height: 22,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<CrosshairIcon />
					</div>

					<div
						style={{
							position: "absolute",
							left: MAP_WIDTH / 2 + 18,
							top: MAP_HEIGHT / 2 - 18,
							fontSize: 13,
							letterSpacing: 1.2,
							textTransform: "uppercase",
							color: "rgba(255,255,255,0.9)",
							display: "flex",
						}}
					>
						{radiusLabel}
					</div>

					{aircraft.map((plane, index) => {
						const label = labelPlacement(plane.x, plane.y, index);
						const connectorStartX = plane.x * MAP_WIDTH;
						const connectorStartY = plane.y * MAP_HEIGHT;
						const connectorEndX =
							label.align === "right" ? label.left + LABEL_WIDTH : label.left;
						const connectorEndY = label.top + LABEL_HEIGHT / 2;

						return (
							<div key={plane.id}>
								<div
									style={{
										position: "absolute",
										left: connectorStartX,
										top: connectorStartY,
										width: Math.max(
											2,
											Math.abs(connectorEndX - connectorStartX),
										),
										height: Math.max(
											2,
											Math.abs(connectorEndY - connectorStartY),
										),
										borderTop: "1px solid rgba(255,255,255,0.12)",
										transformOrigin: "0 0",
										transform: `rotate(${Math.atan2(connectorEndY - connectorStartY, connectorEndX - connectorStartX)}rad)`,
									}}
								/>

								<div
									style={{
										position: "absolute",
										left: connectorStartX - 18,
										top: connectorStartY - 18,
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<PlaneIcon
										heading={plane.heading}
										size={34}
										opacity={Math.max(0.55, plane.brightness)}
									/>
								</div>

								<div
									style={{
										position: "absolute",
										left: label.left,
										top: label.top,
										width: LABEL_WIDTH,
										height: LABEL_HEIGHT,
										padding: "6px 8px",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										background: "rgba(17,17,17,0.44)",
										borderBottom: "1px solid rgba(255,255,255,0.28)",
										textAlign: label.align as "left" | "right",
									}}
								>
									<div
										style={{
											fontSize: 13,
											fontFamily: "var(--font-block-kie)",
											letterSpacing: 0.7,
											display: "flex",
											textTransform: "uppercase",
										}}
									>
										{plane.callsign}
									</div>
									<div
										style={{
											fontSize: 10,
											opacity: 0.92,
											display: "flex",
											textTransform: "uppercase",
											whiteSpace: "nowrap",
											overflow: "hidden",
										}}
									>
										{plane.aircraftType}
									</div>
									{plane.routeLabel ? (
										<div
											style={{
												fontSize: 10,
												opacity: 0.68,
												display: "flex",
												textTransform: "uppercase",
												whiteSpace: "nowrap",
												overflow: "hidden",
											}}
										>
											{plane.routeLabel}
										</div>
									) : null}
									<div
										style={{
											fontSize: 11,
											display: "flex",
											gap: 4,
											justifyContent:
												label.align === "right" ? "flex-end" : "flex-start",
											textTransform: "uppercase",
										}}
									>
										<span>{plane.altitudeLabel}</span>
										<span style={{ opacity: 0.7 }}>·</span>
										<span>{plane.speedLabel}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div
					style={{
						marginTop: "auto",
						height: 42,
						borderTop: "1px solid rgba(255,255,255,0.18)",
						background: "rgba(255,255,255,0.08)",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 16px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<PlaneIcon heading={310} size={20} opacity={1} />
						<div
							style={{
								fontSize: 17,
								fontFamily: "var(--font-block-kie)",
								letterSpacing: 0.6,
								display: "flex",
							}}
						>
							{title}
						</div>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 16,
							fontFamily: "var(--font-block-kie)",
							letterSpacing: 0.5,
						}}
					>
						<span>{locationLabel}</span>
						<span style={{ opacity: 0.8 }}>·</span>
						<span>{timestampLabel}</span>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

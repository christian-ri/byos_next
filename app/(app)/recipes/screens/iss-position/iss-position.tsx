import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import { getBitmapLayoutProfile } from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { IssPositionRecipeData } from "./getData";

function IssIcon({ size = 26 }: { size?: number }) {
	return (
		<svg
			viewBox="0 0 401.294 401.294"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
		>
			<path
				fill="#111"
				d="M115.342,188.015c-7.025,0-12.741,5.716-12.741,12.741s5.716,12.741,12.741,12.741c7.026,0,12.742-5.716,12.742-12.741
S122.368,188.015,115.342,188.015z M115.342,205.497c-2.614,0-4.741-2.127-4.741-4.741s2.127-4.741,4.741-4.741
c2.615,0,4.742,2.127,4.742,4.741S117.957,205.497,115.342,205.497z M397.294,164.141c2.209,0,4-1.791,4-4V89.215c0-2.209-1.791-4-4-4
h-33.219c-2.209,0-4,1.791-4,4v70.926c0,2.209,1.791,4,4,4h12.61v8.999h-36.205c-6.008-4.585-13.401-7.094-20.986-7.094
c-17.762,0-32.434,13.455-34.376,30.706h-3.421v-9.79c0-2.209-1.791-4-4-4h-28.993l-6.173-11.125c-0.705-1.271-2.044-2.059-3.498-2.059
h-39.513v-6.524h16.196c2.209,0,4-1.791,4-4V73.281c0-2.209-1.791-4-4-4h-40.266c-2.209,0-4,1.791-4,4v85.972c0,2.209,1.791,4,4,4
h16.069v6.524h-38.468c-2.209,0-4,1.791-4,4v22.974h-4.52c-1.97-15.047-14.865-26.705-30.44-26.705c-10.313,0-19.703,5.125-25.326,13.331
c-5.623-8.206-15.012-13.331-25.326-13.331H44.653v-5.905h6.324c2.209,0,4-1.791,4-4V89.215c0-2.209-1.791-4-4-4H17.758
c-2.209,0-4,1.791-4,4v70.926c0,2.209,1.791,4,4,4h6.325v5.905H4c-2.209,0-4,1.791-4,4v53.419c0,2.209,1.791,4,4,4h20.083v5.905
h-6.325c-2.209,0-4,1.791-4,4v70.927c0,2.209,1.791,4,4,4h33.219c2.209,0,4-1.791,4-4v-70.927c0-2.209-1.791-4-4-4h-6.325v-5.905
h18.789c10.313,0,19.703-5.125,25.326-13.331c5.624,8.205,15.013,13.331,25.326,13.331c15.578,0,28.476-11.663,30.441-26.714h4.518
v22.765c0,2.209,1.791,4,4,4h38.468v6.524h-16.069c-2.209,0-4,1.791-4,4v85.972c0,2.209,1.791,4,4,4h40.266c2.209,0,4-1.791,4-4
V242.04c0-2.209-1.791-4-4-4h-16.196v-6.524h39.513c1.454,0,2.792-0.789,3.498-2.059l6.173-11.125h28.993c2.209,0,4-1.791,4-4
v-9.581h3.447c2.037,17.151,16.66,30.497,34.35,30.497c7.581,0,14.972-2.507,20.978-7.087h36.214v9.209h-12.61
c-2.209,0-4,1.791-4,4v70.927c0,2.209,1.791,4,4,4h33.219c2.209,0,4-1.791,4-4v-70.927c0-2.209-1.791-4-4-4h-12.609v-9.209h12.435
c2.209,0,4-1.791,4-4V177.14c0-2.209-1.791-4-4-4h-12.435v-8.999H397.294z"
			/>
		</svg>
	);
}

function StatBlock({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				border: "2px solid #111",
				padding: "12px 14px",
				display: "flex",
				flexDirection: "column",
				gap: 4,
				backgroundColor: "#fff",
			}}
		>
			<MetaText>{label}</MetaText>
			<ReadableText size={24} weight={700}>
				{value}
			</ReadableText>
		</div>
	);
}

export default function IssPosition({
	title,
	subtitle,
	showFootprint,
	showTimestamp,
	latitudeLabel,
	longitudeLabel,
	altitudeLabel,
	velocityLabel,
	visibilityLabel,
	updatedAt,
	footprintLabel,
	mapX,
	mapY,
	footprintPercent,
	note,
	width = 800,
	height = 480,
}: IssPositionRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const mapWidth = 380;
	const mapHeight = 214;
	const markerLeft = Math.round(mapX * mapWidth);
	const markerTop = Math.round(mapY * mapHeight);
	const footprintSize = Math.round(
		Math.min(mapWidth, mapHeight) * footprintPercent * 1.25,
	);

	return (
		<PreSatori useDoubling={true} width={width} height={height}>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundColor: "#f5f2ec",
					padding: profile.padding,
					display: "flex",
					flexDirection: "column",
					gap: 12,
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						gap: 12,
						borderBottom: "2px solid #111",
						paddingBottom: 10,
					}}
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<MetaText>{title}</MetaText>
						<SafeTitle size={32} lines={2}>
							{subtitle}
						</SafeTitle>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<ReadableText size={20} weight={700} align="right">
							{visibilityLabel}
						</ReadableText>
						{showTimestamp ? (
							<MetaText align="right">{`Updated ${updatedAt}`}</MetaText>
						) : null}
					</div>
				</div>
				<div style={{ display: "flex", gap: 14, flex: 1 }}>
					<div
						style={{
							width: 382,
							border: "2px solid #111",
							backgroundColor: "#fff",
							padding: 12,
							boxSizing: "border-box",
							display: "flex",
							flexDirection: "column",
							gap: 10,
						}}
					>
						<div
							style={{
								position: "relative",
								width: mapWidth,
								height: mapHeight,
								border: "2px solid #111",
								overflow: "hidden",
								backgroundColor: "#fafafa",
							}}
						>
							<div
								style={{
									position: "absolute",
									inset: 8,
									borderRadius: 999,
									border: "2px solid #111",
								}}
							/>
							{[0.25, 0.5, 0.75].map((ratio) => (
								<div
									key={`lon-${ratio}`}
									style={{
										position: "absolute",
										left: Math.round(mapWidth * ratio),
										top: 10,
										bottom: 10,
										borderLeft: "1px solid #bcbcbc",
									}}
								/>
							))}
							{[0.33, 0.66].map((ratio) => (
								<div
									key={`lat-${ratio}`}
									style={{
										position: "absolute",
										left: 10,
										right: 10,
										top: Math.round(mapHeight * ratio),
										borderTop: "1px solid #bcbcbc",
									}}
								/>
							))}
							{showFootprint ? (
								<div
									style={{
										position: "absolute",
										left: markerLeft - footprintSize / 2,
										top: markerTop - footprintSize / 2,
										width: footprintSize,
										height: footprintSize,
										borderRadius: footprintSize / 2,
										border: "2px solid #c3c3c3",
									}}
								/>
							) : null}
							<div
								style={{
									position: "absolute",
									left: markerLeft - 18,
									top: markerTop - 18,
									width: 36,
									height: 36,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									backgroundColor: "#fff",
									borderRadius: 999,
									border: "2px solid #111",
								}}
							>
								<IssIcon size={22} />
							</div>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 10,
							}}
						>
							<StatBlock label="Latitude" value={latitudeLabel} />
							<StatBlock label="Longitude" value={longitudeLabel} />
						</div>
					</div>
					<div
						style={{
							flex: 1,
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gridAutoRows: "1fr",
							gap: 10,
						}}
					>
						<StatBlock label="Altitude" value={altitudeLabel} />
						<StatBlock label="Velocity" value={velocityLabel} />
						<StatBlock label="Visibility" value={visibilityLabel} />
						<StatBlock label="Footprint" value={footprintLabel} />
						<div
							style={{
								gridColumn: "1 / span 2",
								border: "2px solid #111",
								padding: "12px 14px",
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
								backgroundColor: "#fff",
							}}
						>
							<MetaText>Status</MetaText>
							<SafeTitle size={28} lines={2}>
								{note || "Live orbital snapshot of the ISS."}
							</SafeTitle>
						</div>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

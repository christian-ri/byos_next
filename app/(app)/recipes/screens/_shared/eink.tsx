import React from "react";

export const MIN_TEXT = 14;
export const META_TEXT = 16;
export const BODY_TEXT = 20;
export const TITLE_TEXT = 32;
export const HERO_TEXT = 72;
export const GAP = 16;
export const BORDER_WIDTH = 2;

type TextProps = {
	children: React.ReactNode;
	size?: number;
	align?: "left" | "center" | "right";
	color?: string;
	weight?: number | string;
	uppercase?: boolean;
	style?: React.CSSProperties;
	className?: string;
};

export function ReadableText({
	children,
	size = BODY_TEXT,
	align = "left",
	color = "#111",
	weight = 400,
	uppercase = false,
	style,
	className = "font-geneva9",
}: TextProps) {
	return (
		<div
			className={className}
			style={{
				fontSize: Math.max(MIN_TEXT, size),
				lineHeight: 1.15,
				textAlign: align,
				color,
				fontWeight: weight,
				textTransform: uppercase ? "uppercase" : "none",
				...style,
			}}
		>
			{children}
		</div>
	);
}

export function MetaText(props: Omit<TextProps, "size"> & { size?: number }) {
	return (
		<ReadableText
			{...props}
			size={Math.max(META_TEXT, props.size ?? META_TEXT)}
		/>
	);
}

export function SafeTitle({
	children,
	size = TITLE_TEXT,
	lines,
	align = "left",
	style,
}: {
	children: React.ReactNode;
	size?: number;
	lines?: number;
	align?: "left" | "center" | "right";
	style?: React.CSSProperties;
}) {
	return (
		<div
			className="font-blockkie"
			style={{
				fontSize: size,
				lineHeight: 1.08,
				textAlign: align,
				whiteSpace: "normal",
				wordBreak: "normal",
				overflowWrap: "break-word",
				...(lines
					? {
							maxHeight: `${Math.ceil(size * 1.12 * lines)}px`,
							overflow: "hidden",
						}
					: {}),
				...style,
			}}
		>
			{children}
		</div>
	);
}

export function EInkCard({
	children,
	inverted = false,
	padding = 16,
	radius = 16,
	style,
}: {
	children: React.ReactNode;
	inverted?: boolean;
	padding?: number;
	radius?: number;
	style?: React.CSSProperties;
}) {
	return (
		<div
			style={{
				border: `${BORDER_WIDTH}px solid ${inverted ? "#fff" : "#111"}`,
				borderRadius: radius,
				backgroundColor: inverted ? "#111" : "#fff",
				color: inverted ? "#fff" : "#111",
				padding,
				boxSizing: "border-box",
				...style,
			}}
		>
			{children}
		</div>
	);
}

export function TwoLineEvent({
	time,
	title,
	style,
	inverted = false,
}: {
	time: string;
	title: string;
	style?: React.CSSProperties;
	inverted?: boolean;
}) {
	return (
		<EInkCard
			inverted={inverted}
			padding={12}
			radius={12}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 6,
				...style,
			}}
		>
			<ReadableText
				size={16}
				weight={700}
				color={inverted ? "#fff" : "#111"}
				style={{ lineHeight: 1 }}
			>
				{time}
			</ReadableText>
			<ReadableText size={20} color={inverted ? "#fff" : "#111"}>
				{title}
			</ReadableText>
		</EInkCard>
	);
}

export function TemperatureWithUnit({
	value,
	unit = "",
	size = HERO_TEXT,
	unitSize = 28,
	color = "#111",
}: {
	value: string | number;
	unit?: string;
	size?: number;
	unitSize?: number;
	color?: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 6,
				color,
			}}
		>
			<div
				className="font-blockkie"
				style={{ fontSize: size, lineHeight: 0.92 }}
			>
				{value}
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					gap: unit ? 4 : 0,
					paddingTop: 10,
				}}
			>
				<svg
					width={unitSize}
					height={unitSize}
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle
						cx="12"
						cy="12"
						r="6.5"
						fill="none"
						stroke={color}
						strokeWidth="2.5"
					/>
				</svg>
				{unit ? (
					<div
						className="font-blockkie"
						style={{ fontSize: unitSize, lineHeight: 1 }}
					>
						{unit}
					</div>
				) : null}
			</div>
		</div>
	);
}

const AIRPLANE_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

export function quantizeHeading(heading: number) {
	const normalized = ((heading % 360) + 360) % 360;
	return AIRPLANE_ROTATIONS[
		Math.round(normalized / 45) % AIRPLANE_ROTATIONS.length
	];
}

export function AirplaneIcon({
	heading = 0,
	size = 28,
	color = "#111",
}: {
	heading?: number;
	size?: number;
	color?: string;
}) {
	const rotation = quantizeHeading(heading);
	return (
		<svg
			viewBox="0 0 64 64"
			width={size}
			height={size}
			aria-hidden="true"
			focusable="false"
			style={{ transform: `rotate(${rotation}deg)` }}
		>
			<path
				d="M30 4h4l4 14 12 9-2 5-14-5-2 14 5 16-4 3-9-12-9 12-4-3 5-16-2-14-14 5-2-5 12-9 4-14h4l4 16h2L30 4Z"
				fill={color}
			/>
			<path
				d="M31 12h2l2 12 8 6-1 2-9-3-2 13 3 10-2 1-6-8-6 8-2-1 3-10-2-13-9 3-1-2 8-6 2-12h2l3 12h2l3-12Z"
				fill="#fff"
			/>
		</svg>
	);
}

const TEAM_BADGE_LOOKUP: Record<
	string,
	{ label: string; fill: string; text: string }
> = {
	mercedes: { label: "M", fill: "#111", text: "#fff" },
	ferrari: { label: "F", fill: "#111", text: "#fff" },
	mclaren: { label: "MC", fill: "#111", text: "#fff" },
	"red bull racing": { label: "RB", fill: "#111", text: "#fff" },
	redbull: { label: "RB", fill: "#111", text: "#fff" },
	alpine: { label: "AL", fill: "#111", text: "#fff" },
	"aston martin": { label: "AM", fill: "#111", text: "#fff" },
	williams: { label: "WI", fill: "#111", text: "#fff" },
	"racing bulls": { label: "VC", fill: "#111", text: "#fff" },
	rb: { label: "VC", fill: "#111", text: "#fff" },
	haas: { label: "HA", fill: "#111", text: "#fff" },
	sauber: { label: "SA", fill: "#111", text: "#fff" },
	audi: { label: "AU", fill: "#111", text: "#fff" },
	cadillac: { label: "CA", fill: "#111", text: "#fff" },
};

function normalizeTeamKey(team: string) {
	return team
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

export function TeamBadge({
	team,
	size = 32,
}: {
	team: string;
	size?: number;
}) {
	const normalized = normalizeTeamKey(team);
	const badge = TEAM_BADGE_LOOKUP[normalized] ||
		Object.entries(TEAM_BADGE_LOOKUP).find(([key]) =>
			normalized.includes(key),
		)?.[1] || {
			label: team.slice(0, 2).toUpperCase(),
			fill: "#111",
			text: "#fff",
		};

	return (
		<div
			className="font-blockkie"
			style={{
				width: size,
				height: size,
				borderRadius: Math.round(size / 2),
				backgroundColor: badge.fill,
				color: badge.text,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: Math.max(12, Math.round(size * 0.42)),
				lineHeight: 1,
				border: `${BORDER_WIDTH}px solid ${badge.text === "#fff" ? "#111" : badge.fill}`,
				flexShrink: 0,
			}}
		>
			{badge.label}
		</div>
	);
}

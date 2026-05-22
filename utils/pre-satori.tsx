import React from "react";
import { extractFontFamily } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import {
	getResetStyles,
	processDither,
	processGap,
	processResponsive,
} from "./pre-satori-tailwind";

/**
 * @deprecated Legacy React-to-image renderer compatibility layer.
 *
 * New TRMNL recipes should use the Chromium HTML/CSS renderer path.
 * This file is retained for existing Satori/Takumi screens during migration.
 */
export type RendererType = "takumi" | "satori";

interface PreSatoriProps {
	useDoubling?: boolean;
	width?: number;
	height?: number;
	children: React.ReactNode;
}

export const getRendererType = (): RendererType => {
	return "takumi";
};

export const PreSatori: React.FC<PreSatoriProps> = ({
	useDoubling = false,
	width = 800,
	height = 480,
	children,
}) => {
	const rendererType = getRendererType();

	const normalizeImageElement = (
		child: React.ReactElement<
			unknown,
			string | React.JSXElementConstructor<unknown>
		>,
	): React.ReactElement<
		unknown,
		string | React.JSXElementConstructor<unknown>
	> => {
		const typedChild = child as React.ReactElement<{
			className?: string;
			style?: React.CSSProperties;
			children?: React.ReactNode;
			src?: string;
			srcSet?: string;
			alt?: string;
			[key: string]: unknown;
		}>;

		if (typeof typedChild.type !== "string" || typedChild.type !== "picture") {
			return child;
		}

		const pictureChildren = React.Children.toArray(
			typedChild.props.children,
		) as React.ReactElement[];
		const sourceChild = pictureChildren.find(
			(node) => React.isValidElement(node) && node.type === "source",
		) as React.ReactElement<{ srcSet?: string }> | undefined;
		const imgChild = pictureChildren.find(
			(node) => React.isValidElement(node) && node.type === "img",
		) as
			| React.ReactElement<{
					src?: string;
					alt?: string;
					className?: string;
					style?: React.CSSProperties;
					[key: string]: unknown;
			  }>
			| undefined;

		const mergedClassName = cn(
			typedChild.props.className,
			imgChild?.props.className,
		);
		const mergedStyle = {
			...typedChild.props.style,
			...imgChild?.props.style,
		};

		return React.createElement("img", {
			...imgChild?.props,
			src: imgChild?.props.src || sourceChild?.props.srcSet || "",
			alt: imgChild?.props.alt || "",
			className: mergedClassName,
			style: mergedStyle,
		});
	};

	// Define a helper to recursively transform children.
	const transform = (child: React.ReactNode): React.ReactNode => {
		if (React.isValidElement(child)) {
			if (typeof child.type === "string" && child.type === "source") {
				return null;
			}

			const normalizedChild = normalizeImageElement(child);
			const {
				className,
				style,
				children: childChildren,
				...restProps
			} = normalizedChild.props as {
				className?: string;
				style?: React.CSSProperties;
				children?: React.ReactNode;
				[key: string]: unknown;
			};
			const fontFamily = extractFontFamily(className);
			const newStyle: React.CSSProperties = {
				...style,
				boxSizing: "border-box",
				minWidth: style?.minWidth ?? 0,
				minHeight: style?.minHeight ?? 0,
				fontSmooth: "always",
				...(fontFamily ? { fontFamily } : {}),
			};

			if (
				typeof normalizedChild.type === "string" &&
				normalizedChild.type === "img"
			) {
				newStyle.display = style?.display || "block";
			}

			// Special handling for display properties
			if (rendererType === "satori") {
				if (
					style?.display !== "flex" &&
					style?.display !== "contents" &&
					style?.display !== "none"
				) {
					newStyle.display = "flex";
				}
			}

			// Process className for dither patterns, gap classes, and responsive breakpoints
			const responsiveClass = processResponsive(className, width);
			// Check if element should be hidden - don't render it at all
			if (responsiveClass.includes("hidden") && rendererType === "satori") {
				return null;
			}
			let afterGapClass = responsiveClass;
			let gapStyle = {};
			if (rendererType === "satori") {
				({ style: gapStyle, className: afterGapClass } =
					processGap(responsiveClass));
			}
			const { style: ditherStyle, className: finalClass } =
				processDither(afterGapClass);

			Object.assign(newStyle, gapStyle, ditherStyle);

			// Determine reset styles
			const resetStyles = getResetStyles(child);

			// Construct new props
			const newProps: Record<string, unknown> = {
				...restProps,
				style: newStyle,
				className: cn(resetStyles, finalClass), // Keep for browser/React
				// Pass Tailwind classes to 'tw' prop for Takumi/Satori rendering
				// We combine reset styles with user classes
				tw: cn(resetStyles, finalClass),
			};

			// Recursively transform children
			if (childChildren) {
				newProps.children = React.Children.map(childChildren, (c) =>
					transform(c),
				);
			}

			return React.cloneElement(normalizedChild, newProps);
		}
		return child;
	};

	return (
		<div
			style={{
				display: "flex",
				width: `${width}px`,
				height: `${height}px`,
				transformOrigin: "top left",
				...(useDoubling ? { transform: "scale(2)" } : {}),
			}}
		>
			{React.Children.map(children, (child) => transform(child))}
			{/* {children} */}
		</div>
	);
};

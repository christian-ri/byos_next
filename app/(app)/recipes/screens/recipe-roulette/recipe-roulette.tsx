import {
	MetaText,
	ReadableText,
	SafeTitle,
} from "@/app/(app)/recipes/screens/_shared/eink";
import {
	clampText,
	getBitmapLayoutProfile,
	scaleText,
} from "@/app/(app)/recipes/screens/_shared/responsive-layout";
import { PreSatori } from "@/utils/pre-satori";
import type { RecipeRouletteRecipeData } from "./getData";

function formatIngredientLines(
	ingredients: RecipeRouletteRecipeData["ingredients"],
) {
	return ingredients
		.map((ingredient) =>
			ingredient.measure
				? `${ingredient.name}  ${ingredient.measure}`
				: ingredient.name,
		)
		.join("\n");
}

export default function RecipeRoulette({
	title,
	label,
	updatedAt,
	mode,
	mealTitle,
	category,
	area,
	imageUrl,
	ingredients,
	showIngredientsCount,
	note,
	width = 800,
	height = 480,
}: RecipeRouletteRecipeData & { width?: number; height?: number }) {
	const profile = getBitmapLayoutProfile(width, height);
	const titleSize = scaleText(34, profile, {
		compactBase: 28,
		denseBase: 24,
		min: 24,
		max: 34,
	});
	const ingredientLines = formatIngredientLines(ingredients);

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
						<SafeTitle size={30} lines={1}>
							{label}
						</SafeTitle>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
						<ReadableText size={18} weight={700} align="right">
							{mode.toUpperCase()}
						</ReadableText>
						<MetaText align="right">{`Updated ${updatedAt}`}</MetaText>
					</div>
				</div>

				<div style={{ display: "flex", gap: 14, flex: 1 }}>
					<div
						style={{
							width: 492,
							display: "flex",
							flexDirection: "column",
							gap: 12,
						}}
					>
						<div
							style={{
								border: "2px solid #111",
								backgroundColor: "#fff",
								padding: "14px 16px",
								display: "flex",
								flexDirection: "column",
								gap: 12,
								boxSizing: "border-box",
							}}
						>
							<SafeTitle size={titleSize} lines={2}>
								{mealTitle}
							</SafeTitle>
							<div style={{ display: "flex", gap: 28 }}>
								<div
									style={{
										width: 180,
										display: "flex",
										flexDirection: "column",
										gap: 2,
									}}
								>
									<MetaText>Category</MetaText>
									<ReadableText size={18} weight={700}>
										{category}
									</ReadableText>
								</div>
								<div
									style={{
										width: 180,
										display: "flex",
										flexDirection: "column",
										gap: 2,
									}}
								>
									<MetaText>Region</MetaText>
									<ReadableText size={18} weight={700}>
										{area}
									</ReadableText>
								</div>
							</div>
						</div>

						<div
							style={{
								border: "2px solid #111",
								backgroundColor: "#fff",
								padding: "12px 16px",
								display: "flex",
								flexDirection: "column",
								gap: 8,
								flex: 1,
								boxSizing: "border-box",
							}}
						>
							<div style={{ display: "flex", justifyContent: "space-between" }}>
								<MetaText>Ingredients</MetaText>
								{showIngredientsCount ? (
									<MetaText>{`${ingredients.length} shown`}</MetaText>
								) : null}
							</div>
							<ReadableText
								size={17}
								weight={700}
								style={{
									whiteSpace: "pre-wrap",
									lineHeight: 1.45,
									flex: 1,
								}}
							>
								{ingredientLines}
							</ReadableText>
							<MetaText>{clampText(note, 120)}</MetaText>
						</div>
					</div>

					<div
						style={{
							width: 262,
							border: "2px solid #111",
							backgroundColor: "#fff",
							padding: 10,
							boxSizing: "border-box",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{/* biome-ignore lint/performance/noImgElement: recipe bitmap rendering needs direct remote image URLs */}
						<img
							src={imageUrl}
							alt={mealTitle}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								display: "block",
							}}
						/>
					</div>
				</div>
			</div>
		</PreSatori>
	);
}

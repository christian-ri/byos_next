import Link from "next/link";
import { Suspense } from "react";
import screens from "@/app/(app)/recipes/screens.json";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
	DEFAULT_IMAGE_HEIGHT,
	DEFAULT_IMAGE_WIDTH,
} from "@/lib/recipes/constants";

// Get published components
const getPublishedComponents = () => {
	const componentEntries = Object.entries(screens);

	// Filter out unpublished components in production
	return process.env.NODE_ENV === "production"
		? componentEntries.filter(([, config]) => config.published)
		: componentEntries;
};

type RecipeEntry = [string, (typeof screens)[keyof typeof screens]];

const RENDERER_SECTIONS = [
	{
		key: "chromium",
		label: "Chromium",
		description: "Future HTML/CSS renderer path.",
	},
	{
		key: "takumi",
		label: "Takumi",
		description: "Legacy renderer path still awaiting migration.",
	},
	{
		key: "satori",
		label: "Satori",
		description: "Oldest legacy renderer path.",
	},
	{
		key: "unspecified",
		label: "Unspecified",
		description: "Renderer not explicitly declared yet.",
	},
] as const;

type RendererKey = (typeof RENDERER_SECTIONS)[number]["key"];

const getRendererKey = (
	config: (typeof screens)[keyof typeof screens],
): RendererKey => {
	const renderer =
		"renderSettings" in config &&
		config.renderSettings &&
		"renderer" in config.renderSettings
			? config.renderSettings.renderer
			: undefined;

	if (
		renderer === "chromium" ||
		renderer === "takumi" ||
		renderer === "satori"
	) {
		return renderer;
	}
	return "unspecified";
};

const formatCategoryLabel = (category: string) => {
	return category.replace(/-/g, " ");
};

// Component to display a preview with Suspense
const ComponentPreview = ({
	slug,
	config,
}: {
	slug: string;
	config: (typeof screens)[keyof typeof screens];
}) => {
	return (
		<AspectRatio
			ratio={DEFAULT_IMAGE_WIDTH / DEFAULT_IMAGE_HEIGHT}
			className="bg-neutral-100 flex items-center justify-center p-0 border-b"
		>
			<picture>
				<source srcSet={`/api/bitmap/${slug}.bmp`} type="image/bmp" />
				<img
					src={`/api/bitmap/${slug}.bmp`}
					alt={`${config.title} preview`}
					width={DEFAULT_IMAGE_WIDTH}
					height={DEFAULT_IMAGE_HEIGHT}
					className="object-cover"
					style={{
						imageRendering: "pixelated",
					}}
				/>
			</picture>
		</AspectRatio>
	);
};

// Component for a single card
const RecipeCard = ({
	slug,
	config,
}: {
	slug: string;
	config: (typeof screens)[keyof typeof screens];
}) => {
	return (
		<Link
			key={slug}
			href={`/recipes/${slug}`}
			className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
		>
			<ComponentPreview slug={slug} config={config} />

			<div className="p-4 flex flex-col flex-grow">
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight group-hover:text-blue-600 transition-colors">
					{config.title}
				</h4>
				<p className="text-gray-600 text-sm mt-2 mb-4 flex-grow">
					{config.description}
				</p>

				<div className="flex flex-wrap gap-2 mt-auto">
					<Badge variant="secondary">
						{RENDERER_SECTIONS.find(
							(section) => section.key === getRendererKey(config),
						)?.label || "Renderer"}
					</Badge>
					<Badge variant="outline">
						{formatCategoryLabel(config.category)}
					</Badge>
					{config.tags.slice(0, 3).map((tag: string) => (
						<Badge key={tag} variant="outline">
							{tag}
						</Badge>
					))}
					{config.tags.length > 3 && (
						<Badge variant="outline">+{config.tags.length - 3} more</Badge>
					)}
				</div>
				<div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
					<span>v{config.version}</span>
					<span>{new Date(config.updatedAt).toLocaleDateString()}</span>
				</div>
			</div>
		</Link>
	);
};

// Component for a category section
const CategorySection = ({
	category,
	components,
}: {
	category: string;
	components: RecipeEntry[];
}) => {
	return (
		<div key={category} className="mb-8">
			<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
				{formatCategoryLabel(category)}
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{components.map(([slug, config]) => (
					<RecipeCard key={slug} slug={slug} config={config} />
				))}
			</div>
		</div>
	);
};

const RendererSummary = ({ components }: { components: RecipeEntry[] }) => {
	const counts = RENDERER_SECTIONS.map((section) => ({
		...section,
		count: components.filter(
			([, config]) => getRendererKey(config) === section.key,
		).length,
	}));

	return (
		<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
			{counts.map((section) => (
				<div key={section.key} className="rounded-lg border p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium">{section.label}</p>
							<p className="text-xs text-muted-foreground">
								{section.description}
							</p>
						</div>
						<Badge variant="secondary">{section.count}</Badge>
					</div>
				</div>
			))}
		</div>
	);
};

const RendererSection = ({
	renderer,
	components,
}: {
	renderer: (typeof RENDERER_SECTIONS)[number];
	components: RecipeEntry[];
}) => {
	const componentsByCategory = components.reduce(
		(acc, [slug, config]) => {
			const category = config.category || "uncategorized";
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push([slug, config]);
			return acc;
		},
		{} as Record<string, RecipeEntry[]>,
	);

	const sortedCategories = Object.keys(componentsByCategory).sort((a, b) =>
		formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)),
	);

	return (
		<section className="space-y-5">
			<div className="space-y-1">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold tracking-tight">
						{renderer.label}
					</h2>
					<Badge variant="secondary">{components.length}</Badge>
				</div>
				<p className="text-sm text-muted-foreground">{renderer.description}</p>
			</div>
			<div className="space-y-8">
				{sortedCategories.map((category) => (
					<CategorySection
						key={`${renderer.key}-${category}`}
						category={category}
						components={componentsByCategory[category]}
					/>
				))}
			</div>
		</section>
	);
};

// Main component that organizes recipes by renderer and category
const RecipesGrid = () => {
	const publishedComponents = getPublishedComponents();
	const componentsByRenderer = RENDERER_SECTIONS.map((renderer) => ({
		renderer,
		components: publishedComponents
			.filter(([, config]) => getRendererKey(config) === renderer.key)
			.sort((a, b) => a[1].title.localeCompare(b[1].title)),
	})).filter((section) => section.components.length > 0);

	return (
		<div className="flex flex-col gap-10">
			<RendererSummary components={publishedComponents} />
			{componentsByRenderer.map((section) => (
				<RendererSection
					key={section.renderer.key}
					renderer={section.renderer}
					components={section.components}
				/>
			))}
		</div>
	);
};

export default function RecipesIndex() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold">Recipes</h1>
				<p className="text-muted-foreground">
					Browse recipes by renderer status first, then by content category, so
					it stays obvious which screens still need Chromium migration.
				</p>
			</div>
			<Suspense fallback={<div>Loading recipes...</div>}>
				<RecipesGrid />
			</Suspense>
		</div>
	);
}

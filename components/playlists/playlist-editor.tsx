import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import screens from "@/app/(app)/recipes/screens.json";
import { fetchPlaylistWithItems } from "@/app/actions/playlist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaylistForm } from "./playlist-form";
import { PlaylistItem } from "./playlist-item";

type PlaylistEditorItem = {
	id: string;
	screen_id: string;
	duration: number;
	order_index: number;
	start_time?: string;
	end_time?: string;
	days_of_week?: string[];
};

interface PlaylistEditorProps {
	playlist?: {
		id: string;
		name: string;
		items?: PlaylistEditorItem[];
	};
	onSave: (data: {
		id?: string;
		name: string;
		items: PlaylistEditorItem[];
	}) => void;
	onCancel: () => void;
}

function normalizeItems(items: PlaylistEditorItem[]) {
	return [...items]
		.sort((a, b) => a.order_index - b.order_index)
		.map((item, index) => ({ ...item, order_index: index }));
}

function PlaylistDropZone({
	index,
	isDragging,
	onDropItem,
}: {
	index: number;
	isDragging: boolean;
	onDropItem: (draggedId: string, insertionIndex: number) => void;
}) {
	const [isActive, setIsActive] = useState(false);

	return (
		<div
			data-playlist-drop-index={index}
			aria-hidden={!isDragging}
			className={`group relative flex items-center justify-center rounded-md border-2 border-dashed transition-[height,border-color,background-color,opacity] duration-150 ${
				isDragging
					? "my-1 h-9 border-muted-foreground/35 bg-muted/25 opacity-100"
					: "h-3 border-transparent opacity-0"
			} ${isActive ? "!h-12 !border-primary !bg-primary/10" : ""}`}
			onDragEnter={(event) => {
				event.preventDefault();
				setIsActive(true);
			}}
			onDragOver={(event) => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				setIsActive(true);
			}}
			onDragLeave={(event) => {
				const nextTarget = event.relatedTarget;
				if (
					!(nextTarget instanceof Node) ||
					!event.currentTarget.contains(nextTarget)
				) {
					setIsActive(false);
				}
			}}
			onDrop={(event) => {
				event.preventDefault();
				setIsActive(false);
				const draggedId =
					event.dataTransfer.getData("application/x-playlist-item-id") ||
					event.dataTransfer.getData("text/plain");
				if (draggedId) onDropItem(draggedId, index);
			}}
		>
			<span className="pointer-events-none text-xs font-medium text-muted-foreground">
				{isActive ? "Hier einfügen" : "Zwischenposition"}
			</span>
		</div>
	);
}

export function PlaylistEditor({
	playlist,
	onSave,
	onCancel,
}: PlaylistEditorProps) {
	const [name, setName] = useState(playlist?.name || "");
	const [items, setItems] = useState<PlaylistEditorItem[]>(
		normalizeItems(playlist?.items || []),
	);
	const [screenOptions, setScreenOptions] = useState<
		{ id: string; name: string }[]
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

	// Fetch playlist items if editing an existing playlist
	useEffect(() => {
		const loadItems = async () => {
			if (playlist?.id && (!playlist.items || playlist.items.length === 0)) {
				setIsLoading(true);
				try {
					const result = await fetchPlaylistWithItems(playlist.id);
					if (result.playlist) {
						setName(result.playlist.name);
					}
					// Convert null to undefined for optional fields
					setItems(
						normalizeItems(
							result.items.map((item) => ({
								id: item.id,
								screen_id: item.screen_id,
								duration: item.duration,
								order_index: item.order_index,
								start_time: item.start_time ?? undefined,
								end_time: item.end_time ?? undefined,
								days_of_week: item.days_of_week ?? undefined,
							})),
						),
					);
				} catch (error) {
					console.error("Error fetching playlist items:", error);
				} finally {
					setIsLoading(false);
				}
			} else if (playlist?.items) {
				setItems(
					normalizeItems(
						playlist.items.map((item) => ({
							...item,
							start_time: item.start_time ?? undefined,
							end_time: item.end_time ?? undefined,
							days_of_week: item.days_of_week ?? undefined,
						})),
					),
				);
			}
		};

		loadItems();

		setScreenOptions(
			Object.entries(screens)
				.map(([id, config]) => ({
					id,
					name: config.title,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		);
	}, [playlist?.id, playlist?.items]);

	const handleAddItem = () => {
		const newItem: PlaylistEditorItem = {
			id: `temp-${Date.now()}`,
			screen_id: "simple-text",
			duration: 30,
			order_index: items.length,
			start_time: undefined,
			end_time: undefined,
			days_of_week: undefined,
		};
		setItems((currentItems) => normalizeItems([...currentItems, newItem]));
	};

	const handleUpdateItem = (id: string, data: Partial<PlaylistEditorItem>) => {
		setItems((currentItems) =>
			currentItems.map((item) =>
				item.id === id ? { ...item, ...data } : item,
			),
		);
	};

	const handleDeleteItem = (id: string) => {
		setItems((currentItems) =>
			normalizeItems(currentItems.filter((item) => item.id !== id)),
		);
	};

	const handleReorderItem = (draggedId: string, insertionIndex: number) => {
		setItems((currentItems) => {
			const draggedIndex = currentItems.findIndex(
				(item) => item.id === draggedId,
			);

			if (draggedIndex === -1) {
				return currentItems;
			}

			const reorderedItems = [...currentItems];
			const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
			const adjustedIndex = Math.max(
				0,
				Math.min(
					reorderedItems.length,
					draggedIndex < insertionIndex ? insertionIndex - 1 : insertionIndex,
				),
			);
			reorderedItems.splice(adjustedIndex, 0, draggedItem);

			return normalizeItems(reorderedItems);
		});
		setDraggedItemId(null);
	};

	const handleSave = () => {
		if (name.trim()) {
			onSave({
				id: playlist?.id, // Pass the playlist ID if editing
				name: name.trim(),
				items,
			});
		}
	};

	return (
		<div className="space-y-6">
			<PlaylistForm name={name} onNameChange={setName} />

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div className="space-y-1">
							<CardTitle>Playlist Items</CardTitle>
							<p className="text-sm text-muted-foreground">
								Am Griff ziehen und zwischen zwei Einträgen ablegen.
							</p>
						</div>
						<Button onClick={handleAddItem} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Add Item
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-2 sm:p-6">
					{isLoading ? (
						<div className="text-center py-8 text-muted-foreground">
							Loading playlist items...
						</div>
					) : items.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No items in this playlist. Click &quot;Add Item&quot; to get
							started.
						</div>
					) : (
						<div>
							<PlaylistDropZone
								index={0}
								isDragging={Boolean(draggedItemId)}
								onDropItem={handleReorderItem}
							/>
							{items.map((item, index) => (
								<div key={item.id}>
									<PlaylistItem
										item={item}
										onUpdate={handleUpdateItem}
										onDelete={handleDeleteItem}
										onDragStart={setDraggedItemId}
										onDragEnd={() => setDraggedItemId(null)}
										isDragging={draggedItemId === item.id}
										screenOptions={screenOptions}
									/>
									<PlaylistDropZone
										index={index + 1}
										isDragging={Boolean(draggedItemId)}
										onDropItem={handleReorderItem}
									/>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<div className="sticky bottom-4 z-20 flex gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
				<Button onClick={handleSave} disabled={!name.trim()}>
					{playlist ? "Playlist speichern" : "Playlist erstellen"}
				</Button>
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	);
}

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

	const handleSavePlaylist = (data: { name: string }) => {
		setName(data.name);
	};

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

	const handleReorderItem = (draggedId: string, targetId: string) => {
		if (draggedId === targetId) {
			return;
		}

		setItems((currentItems) => {
			const draggedIndex = currentItems.findIndex(
				(item) => item.id === draggedId,
			);
			const targetIndex = currentItems.findIndex(
				(item) => item.id === targetId,
			);

			if (draggedIndex === -1 || targetIndex === -1) {
				return currentItems;
			}

			const reorderedItems = [...currentItems];
			const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
			reorderedItems.splice(targetIndex, 0, draggedItem);

			return normalizeItems(reorderedItems);
		});
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
			<PlaylistForm
				playlist={playlist ? { id: playlist.id, name } : undefined}
				onSave={handleSavePlaylist}
				onCancel={onCancel}
			/>

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Playlist Items</CardTitle>
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
						<div className="space-y-4">
							{items.map((item) => (
								<PlaylistItem
									key={item.id}
									item={item}
									onUpdate={handleUpdateItem}
									onDelete={handleDeleteItem}
									onReorder={handleReorderItem}
									screenOptions={screenOptions}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex gap-2">
				<Button onClick={handleSave} disabled={!name.trim()}>
					{playlist ? "Update Playlist" : "Create Playlist"}
				</Button>
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	);
}

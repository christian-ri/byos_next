import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlaylistFormProps {
	name: string;
	onNameChange: (name: string) => void;
}

export function PlaylistForm({ name, onNameChange }: PlaylistFormProps) {
	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Playlist Details</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<Label htmlFor="name">Playlist Name</Label>
					<Input
						id="name"
						value={name}
						onChange={(event) => onNameChange(event.target.value)}
						placeholder="Enter playlist name"
						required
					/>
				</div>
			</CardContent>
		</Card>
	);
}

import CalendarScreen from "@/app/(app)/recipes/screens/_shared/calendar-screen";
import type { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";

export default function CalendarGoogle(
	props: CalendarRecipeData & { width?: number; height?: number },
) {
	return <CalendarScreen {...props} />;
}

import type { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";
import CalendarScreen from "@/app/(app)/recipes/screens/_shared/calendar-screen";

export default function CalendarOutlook(
	props: CalendarRecipeData & { width?: number; height?: number },
) {
	return <CalendarScreen {...props} />;
}

import type { CalendarRecipeData } from "@/app/(app)/recipes/screens/_shared/calendar-data";
import CalendarScreen from "@/app/(app)/recipes/screens/_shared/calendar-screen";
import type { RendererType } from "@/utils/pre-satori";

export default function CalendarApple(
	props: CalendarRecipeData & {
		width?: number;
		height?: number;
		rendererType?: RendererType;
	},
) {
	return <CalendarScreen {...props} />;
}

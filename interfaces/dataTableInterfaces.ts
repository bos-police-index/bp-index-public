import { SvgIconTypeMap } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

declare global {
	interface TableDefinition {
		source: string | React.JSX.Element;
		table: string;
		query: string;
		image: {
			component: React.JSX.Element;
			src: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {};
		};
		isFake: boolean;
		shortDescription: string;
		longDescription: string;
	}
}

export {};

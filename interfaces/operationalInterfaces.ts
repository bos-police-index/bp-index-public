import { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

export interface QueryOptions {
	filterModel: GridFilterModel;
	orderBy: GridSortModel;
}

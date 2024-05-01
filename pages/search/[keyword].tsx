import { FunctionComponentElement, useEffect, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { styled } from "@mui/material";
import { useRouter } from "next/router";
import SearchBar from "@components/SearchBar";
import Link from "next/link";
import { fetchData } from "@utility/dataUtils";

export default function SearchResult(): FunctionComponentElement<{}> {
	const router = useRouter();
	const { keyword } = router.query;
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// fetchData returns a promise that resolves to an array of objects representing rows in the table
	useEffect(() => {
		if (keyword) {
			setLoading(true);
			fetchData({ keyword: keyword as string | string[] })
				.then((data) => {
					setSearchResData(data);
				})
				.catch((error) => {
					console.error("Failed to fetch data", error);
					// TODO - Handle error state here
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [keyword]);

	const cols: GridColDef[] = [
		{
			field: "employee_no",
			headerName: "Employee No.",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
		},
		{
			field: "name",
			headerName: "Full Name",
			width: 200,
			type: "string",
			renderCell: (params) => {
				return (
					<Link
						href={{
							pathname: "/profile/[employee_id]",
							query: { employee_id: params.row.employee_no, keyword: keyword },
						}}
						className="link hover:text-blue-500"
					>
						{params.row.name}
					</Link>
				);
			},
		},
		{
			field: "badge_no",
			headerName: "Badge No.",
			width: 100,
			type: "string",
		},
		{
			field: "zipCode",
			headerName: "Zip Code",
			type: "string",
			valueFormatter: (params) => {
				return params.value ? "0" + params.value : null;
			}
		},
		// {
		// 	field: "title",
		// 	headerName: "Title",
		// 	width: 150,
		// 	type: "string",
		// },
		{
			field: "rank",
			headerName: "Rank",
			width: 150,
			type: "number",
		},
		{
			field: "org",
			headerName: "Org",
			width: 250,
			type: "string",
		},
		{
			field: "ia_no",
			headerName: "No. of IA",
			width: 100,
			type: "number",
		},
		{
			field: "totalPay",
			headerName: "2021 Total Pay",
			width: 130,
			type: "number",
		},
		{
			field: "injuredPay",
			headerName: "Injured Pay",
			width: 130,
			type: "number",
		},
		{
			field: "otPay",
			headerName: "OT Pay",
			width: 130,
			type: "number",
		},
		{
			field: "otherPay",
			headerName: "Other Pay",
			width: 130,
			type: "number",
		},
		{
			field: "quinnPay",
			headerName: "Quinn Pay",
			width: 130,
			type: "number",
		},
		{
			field: "regularPay",
			headerName: "Regular Pay",
			width: 130,
			type: "number",
		},
		{
			field: "retroPay",
			headerName: "Retro Pay",
			width: 130,
			type: "number",
		},

	];

	

	const StyledGridOverlay = styled("div")(() => ({
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		"& .ant-empty-img-1": {
			fill: "#aeb8c2",
		},
		"& .ant-empty-img-2": {
			fill: "#f5f5f7",
		},
		"& .ant-empty-img-3": {
			fill: "#dce0e6",
		},
		"& .ant-empty-img-4": {
			fill: "#fff",
		},
		"& .ant-empty-img-5": {
			fillOpacity: "0.8",
			fill: "#f5f5f5",
		},
	}));

	function noRowsOverlay(keyword: string) {
		return (
			<StyledGridOverlay>
				<svg width="120" height="100" viewBox="0 0 184 152" aria-hidden focusable="false">
					<g fill="none" fillRule="evenodd">
						<g transform="translate(24 31.67)">
							<ellipse className="ant-empty-img-5" cx="67.797" cy="106.89" rx="67.797" ry="12.668" />
							<path className="ant-empty-img-1" d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z" />
							<path className="ant-empty-img-2" d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" />
							<path
								className="ant-empty-img-3"
								d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
							/>
						</g>
						<path className="ant-empty-img-3" d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z" />
						<g className="ant-empty-img-4" transform="translate(149.65 15.383)">
							<ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
							<path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
						</g>
					</g>
				</svg>
				<p className="mt-1">No records for '{keyword}'</p>
			</StyledGridOverlay>
		);
	}

	return (
		<>
			<SearchBar title="Search" officerName={""} />
			{/* Table */}
			<section className="w-full pt-16 pb-16">
				<DataGrid
					columns={cols}
					rows={searchResData}
					className="max-w-5xl mx-auto min-h-[300px] bg-white"
					initialState={{
						pagination: { paginationModel: { pageSize: 10 } },
					}}
					pageSizeOptions={[5, 10, 15, 20]}
					autoHeight
					slots={{
						toolbar: GridToolbar,
						noRowsOverlay: () => noRowsOverlay(keyword as string),
					}}
					loading={loading}
				/>
			</section>
		</>
	);
}

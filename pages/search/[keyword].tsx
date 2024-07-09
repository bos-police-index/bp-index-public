import { FunctionComponentElement, useEffect, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { Tooltip, styled } from "@mui/material";
import { useRouter } from "next/router";
import SearchBar from "@components/SearchBar";
import Link from "next/link";
import { fetchHompage } from "@utility/dataUtils";
import properCaseName from "@utility/properNameCasing";
import { StyledGridOverlay } from "@styles/reusedStyledComponents";

export default function SearchResult(): FunctionComponentElement<{}> {
	const router = useRouter();
	const { keyword } = router.query;
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// fetchData returns a promise that resolves to an array of objects representing rows in the table
	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => {
				const formattedData = data.map((row, index) => ({
					...row,
					id: row.bpiId, // Assuming employee_no is unique
				}));
				setSearchResData(formattedData);
			})
			.catch((error) => {
				console.error("Failed to fetch data", error);
				// TODO - Handle error state here
			})
			.finally(() => {
				setLoading(false);
			});
	}, [keyword]);

	const cols: GridColDef[] = [
		{
			field: "fullName",
			headerName: "Full Name",
			width: 200,
			type: "string",
			renderCell: (params) => {
				// const properCasedName = properCaseName(params.row.name);
				const properCasedName = params.row.fullName;
				return (
					<Link
						href={{
							pathname: `/profile/[bpiId]`,
							query: { bpiId: params.row.bpiId, keyword: params.row.fullName },
						}}
						className="link hover:text-blue-500"
					>
						{properCasedName}
					</Link>
				);
			},
			renderHeader: (params) => (
				<Tooltip title="The full name of the police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "badgeNo",
			headerName: "Badge No.*",
			width: 200,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				const badgeText = row.badgeNo === "Unknown Badge" ? (row.rank === "Civilian" ? "Not Applicable" : "Unknown") : row.badgeNo;
				return <span style={badgeText === "Not Applicable" || badgeText === "Unknown" ? { color: "#B3B3B3" } : {}}>{badgeText}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="The badge number assigned to the police officer; used for identification">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},
		{
			field: "rank",
			headerName: "Rank",
			width: 150,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The job title or rank of the police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},
		{
			field: "org",
			headerName: "Org",
			width: 250,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The department or unit within the Boston Police Department where the officer works">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Race
		//BLOCKER: data in raw form

		//TO DO: Add Gender
		//BLOCKER: data in raw form
		{
			field: "numOfIa",
			headerName: "No. of IA",
			width: 100,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				return `${row.numOfIa.toLocaleString()}`;
			},
			renderHeader: (params) => (
				<Tooltip title="The cumulative number of Internal Affairs complaints linked to the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "totalPay",
			headerName: "Total Pay",
			width: 150,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				if (row.totalPay != null || undefined) {
					return `$${row.totalPay.toLocaleString()}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="The total gross earnings of the police officer for the specified period">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Arrests
		//BLOCKER: data hasn't been found

		//TO DO: Add FOI
		// BLOCKER: data not in database

		//TO DO: Add News
		// BLOCKER: data hasn't been found

		{
			field: "overtimePay",
			headerName: "Overtime Pay",
			width: 150,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				if (row.overtimePay != null || undefined) {
					return `$${row.overtimePay.toLocaleString()}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from overtime work">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "detailPay",
			headerName: "Detail Pay",
			width: 150,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				if (row.detailPay != null || undefined) {
					return `$${row.detailPay.toLocaleString()}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from detailed assignments or special duties">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "otherPay",
			headerName: "Other Pay",
			width: 150,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				if (row.otherPay != null || undefined) {
					return `$${row.otherPay.toLocaleString()}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Other types of earnings not classified elsewhere">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Parking Tickets
		// BLOCKER: data in raw form only

		//TO DO: Add Shooting Report
		// BLOCKER: data doesn't exist
	];

	function noRowsOverlay(keyword: string) {
		return (
			<StyledGridOverlay style={{ marginTop: "2.5rem" }}>
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

	function noResultsOverlay() {
		return (
			<StyledGridOverlay style={{ marginTop: "2.5rem" }}>
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

				<p className="mt-1">No records for this filter given available data</p>
			</StyledGridOverlay>
		);
	}

	return (
		<>
			{/* Table */}
			<section className="w-full pt-16 pb-16 ">
				<DataGrid
					density="compact"
					columns={cols}
					rows={searchResData}
					className="mx-auto min-h-[300px] bg-white"
					initialState={{
						pagination: { paginationModel: { pageSize: 10 } },
						columns: {
							columnVisibilityModel: {
								employee_no: false,
							},
						},
					}}
					pageSizeOptions={[5, 10, 15, 20]}
					autoHeight
					slots={{
						toolbar: GridToolbar,
						noRowsOverlay: () => noRowsOverlay(keyword as string),
						noResultsOverlay: () => noResultsOverlay(),
					}}
					loading={loading}
					style={{ maxWidth: "1128px" }}
				/>
			</section>
			<p className="text-xs text-white mt-[-3.5em] text-center mx-auto w-full max-w-[70em]">* Not Applicable in Badge No. is due to Civilians not having one. Unknown means there is missing data for this officer's badge.</p>
		</>
	);
}

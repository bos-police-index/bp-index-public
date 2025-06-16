import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import { 
	GridColDef, 
	gridFilteredSortedRowIdsSelector, 
	gridPaginationModelSelector
} from "@mui/x-data-grid";

import backgroundImage from "../public/fist-in-air.jpeg";
import FadeIn from "@components/FadeIn";
import DataTable from "@components/DataTable";
import { fetchHompage } from "services/homepage/data_fetchers";
import { bpi_light_gray } from "@styles/theme/lightTheme";

export default function Home() {
	const [keyword, setKeyword] = useState<string>("");
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => {
				const formattedData = data.map((row, index) => ({
					...row,
					id: row.bpiId
				}));
				setSearchResData(formattedData);
			})
			.catch((error) => {
				console.error("Failed to fetch data", error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const cols: GridColDef[] = [
		{
			field: "fullName",
			headerName: "Full Name",
			width: 200,
			type: "string",
			renderCell: (params) => {
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
		}, {
			field: "badgeNo",
			headerName: "Badge No.",
			width: 100,
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
		}, {
			field: "race",
			headerName: "Race",
			width: 100,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The race of the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "sex",
			headerName: "Sex",
			width: 100,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The sex of the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "rank",
			headerName: "Rank",
			width: 150,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The job title or rank of the police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "org",
			headerName: "Org",
			width: 250,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The department or unit within the Boston Police Department where the officer works">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "numOfIa",
			headerName: "No. of IA",
			width: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				return `${row.numOfIa}`;
			},
			renderHeader: (params) => (
				<Tooltip title="The cumulative number of Internal Affairs complaints linked to the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "totalPay",
			headerName: "Total Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.totalPay != null || undefined) {
					return `$${row.totalPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="The total gross earnings of the police officer for the specified period">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "overtimePay",
			headerName: "Overtime Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.overtimePay != null || undefined) {
					return `$${row.overtimePay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from overtime work">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "detailPay",
			headerName: "Detail Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.detailPay != null || undefined) {
					return `$${row.detailPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from detailed assignments or special duties">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "otherPay",
			headerName: "Other Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.otherPay != null || undefined) {
					return `$${row.otherPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Other types of earnings not classified elsewhere">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}
	];

	const getRowsToExportHandler = ({ apiRef }) => {
		const selectedRowKeys = apiRef.current.getSelectedRows().keys();
		const selectedRowIds = Array.from(selectedRowKeys);

		if (selectedRowIds && selectedRowIds.length > 0) {
			return selectedRowIds;
		}

		const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
		const paginationModel = gridPaginationModelSelector(apiRef);
		const pagedRowIds = filteredSortedRowIds.slice(
			paginationModel.page * paginationModel.pageSize,
			(paginationModel.page + 1) * paginationModel.pageSize,
		);
		return pagedRowIds;
	};

	return (
		<div style={{ backgroundColor: bpi_light_gray }}>
			<div className="w-full overflow-visible mb-[2.5rem">
				<div
					className="bg-cover bg-center"
					style={{
						backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImage.src})`,
						width: "110vw",
						paddingBottom: "0rem",
						marginBottom: "3rem",
						marginLeft: "-10vw",
					}}
				>
					<section className="hero py-0">
						<div className="hero-content text-center px-0">
							<div className="flex flex-col items-start gap-8 w-full pt-2 mx-auto relative ml-[14rem]">
								<h1 className="text-8xl font-bold text-white text-left break-words">
									Boston <br />
									Police Index
								</h1>
								<p
									style={{
										textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
										width: "70%",
										display: "flex",
										alignItems: "center",
										justifyContent: "start",
										marginLeft: "0rem",
									}}
									className="text-l text-white text-left mx-auto"
								>
									The Boston Police Index is a resource to bring transparency to the activities of law enforcers in our communities. We wish to be a resource for journalists, policy makers, residents, workers, and students of the City of Boston. All information here is data from
									public sources and public records requests.
								</p>
								<div className="relative w-full">
									<div className="flex items-center w-full bg-white join-item rounded-3xl"></div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
			<FadeIn>
				<section className="max-w-1128 pb-16">
					<DataTable
						cols={cols}
						table={searchResData}
						table_name="boston-police-index"
						pageSize={10}
						pageSizeOptions={[5, 10, 15, 20]}
						rowCount={searchResData.length}
						hide={[]}
						isServerSideRendered={false}
						keyword={keyword}
						loading={loading}
						checkboxSelection={true}
						className="mx-auto min-h-[300px] bg-white rounded-xl shadow-lg print:shadow-none print:rounded-none"
						style={{ minWidth: "80%" }}
						initialState={{
							pagination: { paginationModel: { pageSize: 10 } },
							columns: {
								columnVisibilityModel: cols.reduce((acc, col) => {
									acc[col.field] = true; 
									return acc;
								}, {}),
							},
						}}
						exportOptions={{
							csvOptions: {
								getRowsToExport: getRowsToExportHandler,
								fileName: "boston-police-index-export",
							},
							printOptions: {
								getRowsToExport: getRowsToExportHandler,
								disableToolbarButton: true,
							},
						}}
					/>
				</section>
				<div style={{ height: "2.5rem" }}></div>
			</FadeIn>
		</div>
	);
}

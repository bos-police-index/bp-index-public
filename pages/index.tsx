import React, { useState, useEffect } from "react";
import FadeIn from "@components/FadeIn";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { styled, Tooltip } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { fetchData } from "@utility/dataUtils";
import backgroundImage from '../public/fist-bg.webp'

export default function Home() {
	const [keyword, setKeyword] = useState<string>("");
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const router = useRouter();

	// fetchData returns a promise that resolves to an array of objects representing rows in the table
	useEffect(() => {
		setLoading(true);
		fetchData({ keyword: null })
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
	}, []);

	const handleSearch = () => {
		let validatedKeyword: string = keyword.trim();
		if (validatedKeyword.length > 0) {
			router
				.push({
					pathname: "/search/[keyword]",
					query: { keyword: validatedKeyword },
				})
				.then(() => {});
		} else {
			toast.error("Please enter a valid keyword");
		}
	};

	const cols: GridColDef[] = [
		{
			field: "employee_no",
			headerName: "Employee No.",
			width: 100,
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			renderHeader: (params) => (
				<Tooltip title="A unique identifier assigned to each police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
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
							query: { employee_id: params.row.employee_no, keyword: params.row.name },
						}}
						className="link hover:text-blue-500"
					>
						{params.row.name}
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
			field: "badge_no",
			headerName: "Badge No.",
			width: 200,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The badge number assigned to the police officer; used for identification">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},
		// {
		// 	field: "postal",
		// 	headerName: "Zip Code",
		// 	type: "string",
		// 	renderHeader: (params) => (
		// 		<Tooltip title="The postal code associated with the officer’s pay data">
		// 			<span>{params.colDef.headerName}</span>
		// 		</Tooltip>
		// 	),
		// },
		// {
		// 	field: "title",
		// 	headerName: "Title",
		// 	width: 150,
		// 	type: "string",
		// 	renderHeader: (params) => (
		// 		<Tooltip title="The job title or rank of the police officer">
		// 			<span>{params.colDef.headerName}</span>
		// 		</Tooltip>
		// 	),
		// },
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
		{
			field: "ia_no",
			headerName: "No. of IA",
			width: 100,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The number of Internal Affairs complaints linked to the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
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
		<div>
    <div style={{backgroundImage: `url(${backgroundImage.src})`, backgroundPosition: '0rem 0rem', backgroundSize: "contain", paddingBottom: '3rem', marginBottom: '1.5rem'}}>
        <section className="hero py-0">
            <div className="hero-content text-center pb-10 px-0 min-w-full">
                <div className="flex flex-col items-start gap-10 w-full pt-4 max-w-5xl mx-auto relative">
                    <h1 className="text-8xl font-bold text-white text-left break-words">Boston Police <br/>Index</h1>
                    <p className="text-2xl text-white mt-[-3.5em] ml-[15em] text-left">
                        The Boston Police Index is a resource to bring transparency to the activities of law enforcers in our communities. We wish to be a resource for journalists, policy makers, residents, workers, and students of the City of Boston. All information here is data from public
                        sources and public records requests.
                    </p>
                    <div className="mt-2 relative w-full">
                        <div className="flex items-center w-full bg-white join-item rounded-3xl">
                            <div className="pl-8">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="transform scale-x-[-1] h-6 w-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Employee ID, Name, Department, Title, Postal Code"
                                className="input w-full h-12 bg-white join-item rounded-3xl pl-8 pe-20 placeholder:text-gray text-2xl focus:outline-none"
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
			<FadeIn>
				<section className="w-full pb-16">
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
						style={{minWidth: "80%"}}
						loading={loading}
					/>
				</section>
			</FadeIn>
		</div>
	);
}

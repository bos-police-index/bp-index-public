import { FunctionComponentElement, useEffect, useState } from "react";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import SearchBar from "@components/SearchBar";
import Link from "next/link";
import { styled } from "@mui/material";
import Fuse from "fuse.js";
import { gql } from '@apollo/client';
import apolloClient from '../../lib/apollo-client';

// Temporary solution until the rank data in the API is fixed
const rankDict = {
	"16": "NA",
	"17": "Patrol Officer",
	"18": "Sergeant Detective",
	"19": "Detective",
	"20": "Civilian",
	"21": "Lieutenant Detective",
	"22": "Depsup",
	"23": "Sergeant",
	"24": "Police Officer",
	"25": "Lieutenant",
	"26": "Captain",
	"27": "Lieutenant",
	"28": "Superintendent",
	"29": "Civil Contractor",
	"30": "Sergeant",
	"31": "Civilian",
	"32": "Deputy",
	"33": "Commissioner"
  }

export default function SearchResult(): FunctionComponentElement<{}> {
	const router = useRouter();
	const { keyword } = router.query;
	const [searchResData, setSearchResData] = useState<Array<any>>([])
	const [loading, setLoading] = useState<boolean>(true)
	const employeeDataQuery = gql`
	query MyQuery {
		allEmployeeFromFa23Data(orderBy: EMPLOYEE_NO_ASC){
			edges {
			node {
				firstName
				lastName
				nameMi
				employeeId
				employeeNo
				namePrefix
				nameSuffix
				badgeNo
				postalCode
				rankId
				orgId
			}
			}
		}
		}
	`;
	const orgDataQuery = gql`query MyQuery {
		allOrganizationFromFa23Data {
		  edges {
			node {
			  organizationId
			  orgCode
			  orgDesc
			}
		  }
		}
	  }
	`;
	const iaDataQuery = gql`query MyQuery {
		allEmployeeIaLinkeds {
		  edges {
			node {
				employeeNo
			}
		  }
		}
	  }
	`;
	const fuseOptions = {
		keys: ["employeeId", "employeeNo", "firstName", "lastName", "nameMi", "namePrefix", "nameSuffix", "badgeNo"],
		threshold: 1,
		includeScore: true,
	};

	useEffect(() => {
		const getData = async () => {
			try {
				const empData: any = await apolloClient.query({query: employeeDataQuery });
				const orgData: any = await apolloClient.query({query: orgDataQuery});
				const iaData: any = await apolloClient.query({query: iaDataQuery});
				let orgs = {};
				let iaCounts = {};
				orgData.data.allOrganizationFromFa23Data.edges.map((edge) => {
					const node = edge.node;
					orgs[node.orgCode] = node.orgDesc;
				})
				iaData.data.allEmployeeIaLinkeds.edges.map((edge) => {
					if (iaCounts[edge.node.employeeNo]) {
						iaCounts[edge.node.employeeNo] += 1;
					} else {
						iaCounts[edge.node.employeeNo] = 1;
					}
				})
				let emp_nos = new Set([]);
				let i = 0;
				// Combines duplicate records in employee table, selecting non null values across rows
				const model = empData.data.allEmployeeFromFa23Data.edges.reduce((acc, record) => {
					const node = record.node;
					if (emp_nos.has(node.employeeNo)) {
						acc[i-1] = {
							firstName: acc[i-1].firstName || node.firstName,
							lastName: acc[i-1].lastName || node.lastName,
							nameMi: acc[i-1].nameMi || node.nameMi,
							employeeId: acc[i-1].employeeId || node.employeeId,
							employeeNo: acc[i-1].employeeNo || node.employeeNo,
							namePrefix: acc[i-1].namePrefix || node.namePrefix,
							nameSuffix: acc[i-1].nameSuffix || node.nameSuffix,
							badgeNo: acc[i-1].badgeNo || node.badgeNo,
							rankId: acc[i-1].rankId || node.rankId,
							orgId: acc[i-1].orgId || node.orgId
							// postalCode: acc[i-1].postalCode || node.postalCode
						}
					} else {
						acc.push({
							firstName: node.firstName,
							lastName: node.lastName,
							nameMi: node.nameMi,
							employeeId: node.employeeId,
							employeeNo: node.employeeNo,
							namePrefix: node.namePrefix,
							nameSuffix: node.nameSuffix,
							badgeNo: node.badgeNo,
							rankId: node.rankId,
							orgId: node.orgId
							// postalCode: node.postalCode
						});
						emp_nos.add(node.employeeNo);
						i += 1;
					}
					return acc;
				}, []);
		
				const fuse = new Fuse(model, fuseOptions);
				const searchRes = fuse.search(keyword as string);
				
				if (searchRes.length && searchRes.length > 0) {
					setSearchResData(searchRes.map((item: any) => {
						let fullName = item.item.namePrefix ? item.item.namePrefix + " " : "";
						fullName += item.item.firstName + " ";
						fullName += item.item.nameMi ? item.item.nameMi + " " : "";
						fullName += item.item.lastName + " ";
						fullName += item.item.nameSuffix ? item.item.nameSuffix : "";

						return {
								id: item.item.employeeId,
								employee_no: item.item.employeeNo,
								name: fullName,
								postal: item.item.postalCode,
								// title: "Police Officer",
								badge_no: item.item.badgeNo,
								rank: item.item.rankId ? rankDict[item.item.rankId] : null,
								org: item.item.orgId ? orgs[item.item.orgId] : null,
								ia_no: iaCounts[item.item.employeeNo] || 0
							}
					}));
				}
			} finally {
				setLoading(false);
			}
		}
		if (keyword) {
			getData();
		}
	}, [keyword])
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
		// {
		// 	field: "postal",
		// 	headerName: "Zip Code",
		// 	type: "string",
		// },
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

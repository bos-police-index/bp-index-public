import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import FadeIn from "@components/FadeIn";
import demo_table from "../public/demo_table.png";
import { GetServerSideProps } from "next";
import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { getMUIGrid } from "@utility/createMUIGrid";
import { extractID, tableExists } from "@utility/utility";

export const getServerSideProps: GetServerSideProps = async () => {
	const table_name = "employee";
	const data: object[] = await prisma.$queryRaw(Prisma.sql([`SELECT * FROM ${table_name}`]));

	let dataArr = data.map((item) => extractID(item, table_name));
	if (table_name === "employee") {
		dataArr.forEach((item) => {
			delete item["officer_photo"];
		});
	}

	return {
		props: {
			rows: dataArr,
			table_name,
		},
	};
};

export default function Home({ rows, table_name }) {
	const [keyword, setKeyword] = useState<string>("");
	const router = useRouter();
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

	const tables = getMUIGrid(table_name, rows, "", [], []);

	return (
		<div>
			<section className="hero pt-14 m">
				<div className="hero-content text-center pb-10 px-0 min-w-full">
					<div className="flex flex-col items-start gap-10 w-full pt-16 max-w-5xl mx-auto relative">
						<h1 className="text-9xl font-bold text-white text-left break-words">Boston Police Index</h1>
						<p className="text-3xl text-white mt-[-3.5em] ml-[15em] text-left">
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
									className="input w-full h-12 bg-white join-item rounded-3xl pl-8 pe-20 placeholder:text-gray text-2xl"
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
			<FadeIn>
				<div className="flex justify-center items-center m-40">{tables.fullTable}</div>
			</FadeIn>
		</div>
	);
}

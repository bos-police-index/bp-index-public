import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface SearchBarProps {
	title: string;
	officerName: string;
}

export default function SearchBar({ title, officerName }: SearchBarProps) {
	const router = useRouter();
	const [keyword, setKeyword] = useState<string>("");
	const initialKeyword = (router.query.keyword as string) || "";

	const handleSearch = () => {
		if (keyword.length > 0) {
			router
				.push({
					pathname: "/search/[keyword]",
					query: { keyword: keyword },
				})
				.then(() => {});
		} else {
			toast.error("Please enter a valid keyword");
		}
	};

	return (
		<div className="flex justify-between px-9 w-screen items-center shrink mt-[0em]">
			<span className="font-urbanist" style={{ color: "#032752" }}>
				{/* <h2 className="font-bold text-2xl">{title}</h2>
        <HeaderText /> */}
			</span>

			<div className="w-full max-w-[80%] relative">
				<button type="button" style={{ marginRight: "-1.8rem" }} className="absolute inset-y-0 grid w-8 place-content-center bg-white rounded-r-[2.4rem] text-gray-400 hover:bg-gray-300 transition-background duration-300 z-10 right-0" onClick={handleSearch}>
					<span className="sr-only">Search</span>
					<svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
				</button>
				<input
					type="text"
					value={keyword}
					placeholder="Search Officers"
					style={{
						boxShadow: "0px 0px 6px 1.8px rgba(0, 0, 0, 0.1)",
						color: "#000",
						boxSizing: "border-box",
						fontSize: "1.2rem",
					}}
					className="input h-8 w-[14.6rem] bg-white join-item ml-[35rem] rounded-[2.4rem] pl-5 pr-6 placeholder:text-gray text-base md:text-lg focus:outline-none" // Adjusted input styles
					onChange={(e) => setKeyword(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleSearch();
							setKeyword("");
						}
					}}
				/>
			</div>
		</div>
	);
}

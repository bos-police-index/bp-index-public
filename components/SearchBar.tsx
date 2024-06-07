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
	let HeaderText = () => {
		if (router.pathname === "/search/[keyword]") {
			return <h4 className={`font-normal text-l`} style={{ color: '#032752'}}>Search results for "{router.query.keyword}"</h4>;
		}
		return (
			<h4 className={`font-light text-l `}
			
			style={{ color: '#032752', maxWidth: '80%'}}>
				<Link
					href={{
						pathname: "/search/[keyword]",
						query: { keyword: initialKeyword },
					}}
					className="link hover:text-gray-300 transition-font-color duration-300"
				>
					Search results for "{router.query.keyword}"
				</Link>{" "}
				
			</h4>
		);
	};
	return (
		<div className="flex justify-between px-12 w-screen items-center shrink mt-10">
			<span className={"font-urbanist"} style={{ color: '#032752',}}>
				<h2 className="font-bold text-2xl">{title}</h2>
				<HeaderText />
			</span>
			
			<div className="w-full max-w-sm mt-2 relative ">
				<button
					type="button"
					style={{marginRight: '-2rem'}}
					className="absolute inset-y-0 grid w-10 place-content-center bg-white
					rounded-r-3xl text-gray-400 hover:bg-gray-300 transition-background duration-300 z-10 absolute right-0"
					onClick={() => handleSearch()}
				>
					<span className="sr-only">Search</span>
					<svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="h-6 w-6">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
				</button>
				<input
				type="text"
				placeholder="Search"
				style={{boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)"}}
				className="input h-12 w-[calc(100% - 8rem)] bg-white join-item ml-[8rem] rounded-3xl pl-8 pr-10 placeholder:text-gray text-xl focus:outline-none "					
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
	);
}

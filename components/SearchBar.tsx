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
			return <h4 className={`font-normal text-xl text-white`}>Search results for "{router.query.keyword}"</h4>;
		}
		return (
			<h4 className={`font-light text-xl text-white`}>
				<Link
					href={{
						pathname: "/search/[keyword]",
						query: { keyword: initialKeyword },
					}}
					className="link hover:text-gray-300 transition-font-color duration-300"
				>
					Search results for "{router.query.keyword}"
				</Link>{" "}
				&gt; {officerName}
			</h4>
		);
	};
	return (
		<div className="flex justify-between px-16 w-screen items-center shrink mt-10">
			<span className={"font-urbanist"}>
				<h2 className="font-bold text-4xl text-white">{title}</h2>
				<HeaderText />
			</span>
			<div className="w-full max-w-md mt-2 relative">
				<button
					type="button"
					className="absolute inset-y-0 grid w-16 end-0 place-content-center bg-gray-200
            rounded-r-2xl text-gray-400 hover:bg-gray-300 transition-background duration-300 z-10"
					onClick={() => handleSearch()}
				>
					<span className="sr-only">Search</span>
					<svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="h-6 w-6">
						<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
					</svg>
				</button>
				<input
					type="text"
					placeholder={`Search`}
					className="z-0 pr-16 input w-full bg-white/[.5] join-item rounded-2xl pe-20 placeholder:text-white/[.6] text-xl font-bold placeholder:text-xl text-white"
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

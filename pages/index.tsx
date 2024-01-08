import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function Home() {
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

	return (
		<section className="hero pt-14 m">
			<div className="hero-content text-center pb-10 px-0 min-w-full">
				<div className="flex flex-col place-items-center gap-10 w-full pt-16">
					<h1 className="text-5xl font-bold text-white">Boston Police Index</h1>
					<div className="mt-2 relative w-3/5">
						<input
							type="text"
							placeholder="Search by Employee ID, Name, Department, Title, or Postal Code"
							className="input w-full bg-white/[.55] join-item rounded-2xl border-gray-200 pe-20 placeholder:text-white text-white"
							onChange={(e) => setKeyword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSearch();
								}
							}}
						/>
						<button
							type="button"
							className="absolute inset-y-0 end-0 grid w-24 place-content-center
                bg-gray-200 rounded-r-2xl hover:bg-gray-300 text-gray-400"
							onClick={() => handleSearch()}
						>
							<span className="sr-only">Search</span>
							<svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="h-6 w-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
							</svg>
						</button>
					</div>
					<span className={"w-full"}>
						<p className="my-8 text-lg w-3/5 text-white m-auto text-center">
							The Boston Police Index is a resource to bring transparency to the activities of law enforcers in our communities.
							<br />
							We wish to be a resource for journalists, policy makers, residents, workers, and students of the City of Boston.
							<br />
							All information here is data from public sources and public records requests.
						</p>
					</span>
				</div>
			</div>
		</section>
	);
}

export default function About() {
	return (
		<div className={"w-full h-fit py-[50px] flex flex-col text-white justify-center px-[200px]"}>
			<span className={"w-full flex items-start flex-col gap-[50px] py-[50px]"}>
			<h1 className="text-8xl font-bold text-white text-left break-words">About</h1>
				<p className={"font-regular text-2xl leading-[40px]"}>
					The Boston Police Index is a resource to bring transparency to the activities of law enforcers in our communities. We wish to be a resource for journalists, policy makers, residents, workers, and students of the City of Boston. All information here is data from public sources and
					public records requests.
				</p>
				<div className={"w-full flex flex-row gap-4"}>
					<div className={"w-2/5 flex flex-col"}></div>
					<p className={"w-3/5 text-[22px] leading-[35px] font-regular"}>
						The Boston Police Index was modeled from Woke Windows, a crucial resource for accessing police records. Founder Nathan Story announced in July 2022 that the site would no longer be updated. The data displayed on this site was collected from various sources. We gathered
						records from Woke Windows, Analyze Boston via the City of Boston, and other publicly-maintained resources. We also filed several public records requests to supplement information not published on these sites. The data is combined through a series of tables that link common
						information between types of records (eg.). At this time, our focus is only the Boston Police Department limiting database scope to BPD to ensure quality and comprehensive data.
					</p>
				</div>
			</span>
			<span className={"w-full flex items-start flex-col gap-[50px] py-[50px]"}>
			<h1 className="text-8xl font-bold text-white text-left break-words">Data Sources</h1>
				<p className={"font-regular text-2xl leading-[40px]"}>
					Collections of public records regarding the Boston Police Department (BPD). This is a full list of the data sources we use to populate the BPI (and some data sources we have yet to incorporate). Most of these data sets are spreadsheets or other tabular data that were received in
					response to public records requests. Looking for Boston Police data to analyze? See our Data Exports for CSV files that have already been combined, cleaned, and documented. Do you know of or possess a source of data we do not list here? Please contact us at nstory@wokewindows.org
					so we may include it on this list.
				</p>
			</span>
			<span className={"w-full flex items-start flex-col gap-[50px] py-[50px]"}>
			<h1 className="text-8xl font-bold text-white text-left break-words">Contributors</h1>
				<div className={"flex flex-row gap-4 text-2xl w-full justify-between italic"}>
					<a target={"_blank"} href={"https://www.bu.edu/spark/"} className={"flex gap-4 flex-row items-center"}>
						<img src={"./spark-logo.png"} alt={"BU Spark"} className={"w-12 aspect-square"} />
						<p className={"hover:text-blue-200 underline hover:decoration-blue-200 transition-font-color duration-100"}>BU Spark!</p>
					</a>
					<a target={"_blank"} href={"https://www.nlg.org/"} className={"flex gap-4 flex-row items-center"}>
						<img src={"./NLG.png"} alt={"BU Spark"} className={"w-12 aspect-square bg-black rounded-full"} />
						<p className={"hover:text-blue-200 underline hover:decoration-blue-200 transition-font-color duration-100"}>National Lawyers Guild</p>
					</a>
				</div>
			</span>
		</div>
	);
}

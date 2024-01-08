export default function About() {
	return (
		<div className={"w-full h-fit py-8 flex text-white justify-center px-2"}>
			<span className={"w-full flex items-center flex-col gap-4"}>
				<p className={"text-4xl font-bold border-b-2 text-center pb-2 px-10"}>About</p>
				<p className={"px-12 text-lg"}>
					The Boston Police Index is a comprehensive database of law enforcement records relating to the Boston Police Department. It can be used as a resource for lawyers, journalists, and policy makers. We also encourage residents, workers, and students of the City of Boston to explore
					BPI to understand the activities of law enforcement in their communities. By making public records more accessible, we hope to promote police transparency and encourage better policing practices. The Boston Police Index was modeled from Woke Windows, a crucial resource for
					accessing police records. Founder Nathan Story announced in July 2022 that the site would no longer be updated. The data displayed on this site was collected from various sources. We gathered records from Woke Windows, Analyze Boston via the City of Boston, and other
					publicly-maintained resources. We also filed several public records requests to supplement information not published on these sites. The data is combined through a series of tables that link common information between types of records (eg.). At this time, our focus is only the
					Boston Police Department limiting database scope to BPD to ensure quality and comprehensive data.
				</p>
			</span>
			<span className={"w-full flex flex-col justify-between "}>
				<span className={"w-full flex justify-center items-center"}>
					<div className={"w-full text-white flex gap-6 flex-col items-center"}>
						<p className={"text-4xl font-bold border-b-2 text-center pb-2 px-10"}>Data Sources</p>
						<p className={"px-12 text-lg"}>
							Collections of public records regarding the Boston Police Department (BPD). <br />
							This is a full list of the data sources we use to populate the BPI (and some data sources we have yet to incorporate). <br />
							Most of these data sets are spreadsheets or other tabular data that were received in response to public records requests. <br />
							Looking for Boston Police data to analyze? See our Data Exports for CSV files that have already been combined, cleaned, and documented. <br />
							Do you know of or possess a source of data we do not list here? Please contact us at nstory@wokewindows.org so we may include it on this list. <br />
						</p>
					</div>
				</span>
				<span className={"w-full flex items-center justify-center flex-col "}>
					<div className="w-4/5 text-white flex gap-6 flex-col items-center">
						<p className={"text-4xl font-bold border-b-2 px-10 pb-2"}>Contributors</p>
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
					</div>
				</span>
			</span>
		</div>
	);
}

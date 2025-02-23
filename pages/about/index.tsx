import CollapsibleDescription, { CollapsibleDescriptionProps } from "@components/CollapsibleDescription";
import { bpi_deep_green } from "@styles/theme/lightTheme";

const sectionContent: CollapsibleDescriptionProps[] = [
	{
		title: "Overview",
		content:
			"The Boston Police Index (BPI) aims to be a comprehensive and accessible database on the activities of the Boston Police Department. By compiling public data sources and data obtained through public records requests, we aim to provide a clear and insightful view into the operations and impacts of policing within the community. This project is a collaboration between academic institutions, legal experts, and community advocates with data science and software development support from BU Spark!",
		defaultOpen: true,
	},
	{
		title: "Mission",
		content:
			"Our mission is to enhance transparency and accountability within the Boston Police Department through meticulous data collection and analysis. We strive to offer a platform that empowers community members, researchers, and policymakers with the information necessary to foster informed discussions and decisions regarding policing practices. ",
	},
	{
		title: "Who We Are",
		content:
			"The Massachusetts Chapter of the National Lawyers Guild works to change the structure of our political and economic system. We seek to unite the legal community with organizers and activists in the service of the people, to the end that human rights shall be regarded as more sacred than property interests. \n\n \n\n BU Spark! is an innovation and experiential learning lab for computing and data science projects. Boston University students work on public interest technology projects for external partners, primarily government agencies, civil society organizations, and social ventures. If you have a project you’d like to work with us on, please fill out a project intake form here. Other contributors to this project have included: ACLU-MA and Center for Juvenile Justice.",
	},
	{
		title: "Key Features",
		content:
			"Officer Activity Pages: Detailed profiles for each police officer, summarizing internal affairs (IA) data, complaints, arrests, tickets, and other activities. \n\n- Data Visualizations: Interactive charts and dashboards that help users understand trends and patterns in police data. \n\n- News Integration: Links to news articles mentioning police officers, providing context and additional information about their activities. \n\n	- Career Tracking: Information on promotions, role changes, and district assignments throughout an officer's career.",
	},
	{
		title: "Data Sources",
		content:
			"Collections of public records regarding the Boston Police Department (BPD). This is a full list of the data sources we use to populate the BPI (and some data sources we have yet to incorporate). Most of these data sets are spreadsheets or other tabular data that were received in response to public records requests.",
	},
	{
		title: "Contact Us",
		content: "For inquiries, collaboration opportunities, or more information about the Boston Police Index Project, please reach out to: buspark@bu.edu \n\nJoin us in making Boston a safer, more transparent, and accountable community.",
	},
];

export default function About() {
	return (
		<div className="w-[68.25%] h-fit py-20 flex flex-col justify-center max-w-6xl mx-auto" style={{ color: bpi_deep_green }}>
			<h1 className="text-5xl font-bold text-[bpi_deep_green] text-left mb-6">About</h1>
			<div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "3rem" }}>
				{sectionContent.map((section, index) => {
					return <CollapsibleDescription title={section.title} content={section.content} defaultOpen={section.defaultOpen} key={index} />;
				})}
			</div>
		</div>
	);
}

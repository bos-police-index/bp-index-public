import BPILogo from "../../public/BPI Logo Big White 1.png";

const Section = ({ title, content }) => {
	const formatContent = (text) => {
		const paragraphs = text.split("\n").filter(Boolean); // Filter out empty strings

		// Map paragraphs to add bullet points to lines starting with '-'
		const formattedText = paragraphs.map((paragraph, index) => {
			if (paragraph.trim().startsWith("-")) {
				return (
					<li key={index} style={{ marginBottom: "0.5rem" }}>
						{paragraph.trim().slice(1).trim()} {/* Remove '-' and trim */}
					</li>
				);
			} else {
				return (
					<p key={index} style={{ marginBottom: "1rem" }}>
						{paragraph.trim()}
					</p>
				);
			}
		});

		return formattedText;
	};

	return (
		<div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "4rem", fontSize: "large" }}>
			<div
				style={{
					transform: "rotate(270deg)",
					backgroundColor: "#12569B",
					padding: "1rem 2rem",
					textAlign: "center",
					color: "white",
					minWidth: "10rem", // Adjust based on your content width
					minHeight: "4rem", // Adjust based on your content height
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				{title}
			</div>
			<div style={{ flex: 1, minHeight: "4rem", paddingLeft: "1rem" }}>
				{/* Call formatContent function to render formatted content */}
				{formatContent(content)}
			</div>
		</div>
	);
};

export default function About() {
	return (
		<div className="w-full h-fit py-20 flex flex-col text-white justify-center max-w-6xl mx-auto">
			<h1 className="text-5xl font-bold text-white text-left mb-6">About</h1>
			<div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginLeft: "-3rem", marginTop: "3rem" }}>
				<Section
					title="Overview"
					content="The Boston Police Index (BPI) aims to be a comprehensive and accessible database on the activities of the Boston Police Department. By compiling public data sources and data obtained through public records requests, we aim to provide a clear and insightful view into the operations and impacts of policing within the community. This project is a collaboration between academic institutions, legal experts, and community advocates with data science and software development support from BU Spark!"
				/>
				<Section
					title="Mission"
					content="Our mission is to enhance transparency and accountability within the Boston Police Department through meticulous data collection and analysis. We strive to offer a platform that empowers community members, researchers, and policymakers with the information necessary to foster informed discussions and decisions regarding policing practices. "
				/>
				<Section
					title={"Who We Are"}
					content={
						"The Massachusetts Chapter of the National Lawyers Guild works to change the structure of our political and economic system. We seek to unite the legal community with organizers and activists in the service of the people, to the end that human rights shall be regarded as more sacred than property interests. \n\n \n\n BU Spark! is an innovation and experiential learning lab for computing and data science projects. Boston University students work on public interest technology projects for external partners, primarily government agencies, civil society organizations, and social ventures. If you have a project you’d like to work with us on, please fill out a project intake form here. Other contributors to this project have included: ACLU-MA and Center for Juvenile Justice."
					}
				/>
				<Section
					title={"Key Features"}
					content={
						"Officer Activity Pages: Detailed profiles for each police officer, summarizing internal affairs (IA) data, complaints, arrests, tickets, and other activities. \n\n- Data Visualizations: Interactive charts and dashboards that help users understand trends and patterns in police data. \n\n- News Integration: Links to news articles mentioning police officers, providing context and additional information about their activities. \n\n	- Career Tracking: Information on promotions, role changes, and district assignments throughout an officer's career."
					}
				/>
				<Section
					title={"Data Sources"}
					content={
						"Collections of public records regarding the Boston Police Department (BPD). This is a full list of the data sources we use to populate the BPI (and some data sources we have yet to incorporate). Most of these data sets are spreadsheets or other tabular data that were received in response to public records requests."
					}
				/>
				<Section title={"Contact Us"} content={"For inquiries, collaboration opportunities, or more information about the Boston Police Index Project, please reach out to: buspark@bu.edu \n\nJoin us in making Boston a safer, more transparent, and accountable community."} />
			</div>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "end", marginTop: "-5rem" }}>
				<img src={BPILogo.src} alt="logo" width={250} />
			</div>
		</div>
	);
}

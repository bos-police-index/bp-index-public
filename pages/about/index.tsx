import FadeIn from "@components/FadeIn";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

import { Card } from "antd";

const sectionContent = [
	{
		title: "Overview",
		content: "The Boston Police Index (BPI) aims to be a comprehensive and accessible database on the activities of the Boston Police Department. By compiling public data sources and data obtained through public records requests, we aim to provide a clear and insightful view into the operations and impacts of policing within the community. This project is a collaboration between academic institutions, legal experts, and community advocates with data science and software development support from BU Spark!",
		defaultOpen: true,
	},
	{
		title: "Mission",
		content: "Our mission is to enhance transparency and accountability within the Boston Police Department through meticulous data collection and analysis. We strive to offer a platform that empowers community members, researchers, and policymakers with the information necessary to foster informed discussions and decisions regarding policing practices. ",
	},
	{
		title: "Who We Are",
		content: "The Massachusetts Chapter of the National Lawyers Guild works to change the structure of our political and economic system. We seek to unite the legal community with organizers and activists in the service of the people, to the end that human rights shall be regarded as more sacred than property interests. \n\n \n\n BU Spark! is an innovation and experiential learning lab for computing and data science projects. Boston University students work on public interest technology projects for external partners, primarily government agencies, civil society organizations, and social ventures. If you have a project you’d like to work with us on, please fill out a project intake form here. Other contributors to this project have included: ACLU-MA and Center for Juvenile Justice.",
	},
	{
		title: "Key Features",
		content: "Officer Activity Pages: Detailed profiles for each police officer, summarizing internal affairs (IA) data, complaints, arrests, tickets, and other activities. \n\n- Data Visualizations: Interactive charts and dashboards that help users understand trends and patterns in police data. \n\n- News Integration: Links to news articles mentioning police officers, providing context and additional information about their activities. \n\n	- Career Tracking: Information on promotions, role changes, and district assignments throughout an officer's career.",
	},
	{
		title: "Data Sources",
		content: "Collections of public records regarding the Boston Police Department (BPD). This is a full list of the data sources we use to populate the BPI (and some data sources we have yet to incorporate). Most of these data sets are spreadsheets or other tabular data that were received in response to public records requests.",
	},
	{
		title: "Contact Us",
		content: "For inquiries, collaboration opportunities, or more information about the Boston Police Index Project, please reach out to: buspark@bu.edu \n\nJoin us in making Boston a safer, more transparent, and accountable community.",
	},
];

export default function About() {
	return (
		<div style={{ backgroundColor: "#f8f9fa", width: "100%" }}>
			<FadeIn>
				<div
					style={{
						maxWidth: "1200px",
						margin: "0 auto",
						padding: "3rem 1.5rem",
					}}
				>
					{/* Overview Section */}
					<div className="mb-16 text-center">
						<h1
							className="text-5xl font-bold mb-6"
							style={{ color: bpi_deep_green }}
						>
							About
						</h1>
						<p
							className="text-lg max-w-3xl mx-auto"
							style={{ color: "rgba(0,0,0,0.7)" }}
						>
							Bringing transparency and accountability to the Boston Police
							Department through comprehensive data analysis and public access.
						</p>
					</div>

					{/* Mission & Overview Cards */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
						{sectionContent.slice(0, 2).map((section, index) => (
							<Card
								key={index}
								className="transform hover:-translate-y-1 transition-all duration-300"
								style={{
									borderRadius: "16px",
									overflow: "hidden",
									border: "none",
									background: "rgba(255, 255, 255, 0.9)",
									backdropFilter: "blur(10px)",
									boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
								}}
								title={
									<div className="flex items-center gap-3">
										<span
											style={{ color: bpi_deep_green }}
											className="font-bold text-2xl"
										>
											{section.title}
										</span>
									</div>
								}
								headStyle={{
									borderBottom: `2px solid ${bpi_light_green}`,
									padding: "1.5rem",
								}}
								bodyStyle={{ padding: "1.5rem" }}
							>
								<p className="text-lg leading-relaxed opacity-85">
									{section.content}
								</p>
							</Card>
						))}
					</div>

					{/* Project Details Section */}
					<div className="mb-16">
						<h2
							className="text-3xl font-bold mb-8 text-center"
							style={{ color: bpi_deep_green }}
						>
							Project Details
						</h2>
						<div className="grid grid-cols-1 gap-8">
							{sectionContent.slice(2).map((section, index) => (
								<Card
									key={index + 2}
									className="transform hover:-translate-y-1 transition-all duration-300"
									style={{
										borderRadius: "16px",
										overflow: "hidden",
										border: "none",
										background: "rgba(255, 255, 255, 0.9)",
										backdropFilter: "blur(10px)",
										boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
									}}
									title={
										<div className="flex items-center gap-3">
											<span
												style={{ color: bpi_deep_green }}
												className="font-bold text-2xl"
											>
												{section.title}
											</span>
										</div>
									}
									headStyle={{
										borderBottom: `2px solid ${bpi_light_green}`,
										padding: "1.5rem",
									}}
									bodyStyle={{ padding: "1.5rem" }}
								>
									{section.title === "Key Features" ? (
										<div className="grid gap-6">
											<div className="text-lg leading-relaxed opacity-85">
												Officer Activity Pages
												: Detailed profiles for each police officer,
												summarizing internal affairs (IA) data, complaints,
												arrests, tickets, and other activities.
											</div>
											{[
												{
													text: "Data Visualizations",
													description:
														": Interactive charts and dashboards that help users understand trends and patterns in police data.",
												},
												{
													text: "News Integration",
													description:
														": Links to news articles mentioning police officers, providing context and additional information about their activities.",
												},
												{
													text: "Career Tracking",
													description:
														": Information on promotions, role changes, and district assignments throughout an officer's career.",
												},
											].map((feature, i) => (
												<div
													key={i}
													className="flex items-start gap-3 text-lg leading-relaxed opacity-85"
												>
													<div
														style={{ color: bpi_deep_green }}
														className="mt-1.5"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															className="h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={3}
																d="M9 5l7 7-7 7"
															/>
														</svg>
													</div>
													<div>
														{feature.text}
														{feature.description}
													</div>
												</div>
											))}
										</div>
									) : section.title === "Contact Us" ? (
										<div className="text-lg leading-relaxed opacity-85">
											For inquiries, collaboration opportunities, or more
											information about the Boston Police Index Project,
											please reach out to:{" "}
											<a
												href="mailto:buspark@bu.edu"
												className="text-blue-600 hover:underline"
											>
												buspark@bu.edu
											</a>
											<p className="mt-4">
												Join us in making Boston a safer, more transparent,
												and accountable community.
											</p>
										</div>
									) : section.title === "Who We Are" ? (
										<div className="text-lg leading-relaxed opacity-85">
											<p>
												The Massachusetts Chapter of the National Lawyers Guild
												works to change the structure of our political and
												economic system. We seek to unite the legal community
												with organizers and activists in the service of the
												people, to the end that human rights shall be regarded
												as more sacred than property interests.
											</p>
											<p className="mt-4">
												<a
													href="https://www.bu.edu/spark/"
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													BU Spark!
												</a>{" "}
												is an innovation and experiential learning lab for
												computing and data science projects. Boston University
												students work on public interest technology projects for
												external partners, primarily government agencies, civil
												society organizations, and social ventures. If you have
												a project you'd like to work with us on, please{" "}
												<a
													href="https://www.bu.edu/spark/contact/"
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													fill out a project intake form here
												</a>
												. Other contributors to this project have included:{" "}
												<a
													href="https://www.aclum.org/"
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
												>
													ACLU-MA
												</a>
												{" "}and Center for Juvenile Justice.
											</p>
										</div>
									) : (
										<p className="text-lg leading-relaxed opacity-85">
											{section.content}
										</p>
									)}
								</Card>
							))}
						</div>
					</div>
				</div>
			</FadeIn>
		</div>
	);
}

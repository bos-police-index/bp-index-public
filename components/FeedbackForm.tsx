"use client";
import { Octokit } from "@octokit/rest";
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import axios from "axios";
import { bpi_deep_green } from "@styles/theme/lightTheme";

interface CreateNewIssueParams {
	title: String;
	feedback: String;
	contactInfo: String | undefined;
}

const FeedbackForm = ({ setSubmit }) => {
	const { executeRecaptcha } = useGoogleReCaptcha();

	const [title, setTitle] = useState<String>("");
	const [feedback, setFeedback] = useState<String>("");
	const [email, setEmail] = useState<String>("");

	const [titleError, setTitleError] = useState<boolean>(false);
	const [feedbackError, setFeedbackError] = useState<boolean>(false);

	const gitToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
	const gitOwner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER;
	const gitRepoName = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;
	const gitRepoAssignee = process.env.NEXT_PUBLIC_GITHUB_ASSIGNEE;
	const secretCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;

	const octokit = new Octokit({
		auth: gitToken,
	});

	async function createNewIssue({ title, feedback, contactInfo }: CreateNewIssueParams) {
		const body = `**User's Feedback:** ${feedback}\n\n**Contact Info:** ${contactInfo}`;
		// console.log(gitToken, gitOwner, gitRepoName, gitRepoAssignee);
		try {
			const response = await octokit.request(`POST /repos/${gitOwner}/${gitRepoName}/issues`, {
				owner: gitOwner,
				repo: gitRepoName,
				title,
				body,
				assignees: [gitRepoAssignee],
				labels: ["feedback"],
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			});
			// console.log("Issue created successfully:", response.data);
		} catch (error) {
			console.error("Error creating issue:", error);
		}
	}

	const handleSubmit = async (event) => {
		event.preventDefault();

		// Reset error states
		setTitleError(false);
		setFeedbackError(false);
		setSubmit("");

		if (!executeRecaptcha) {
			console.log("not available to execute captcha");
			return;
		}

		const gRecaptchaToken = await executeRecaptcha("inquirySubmit");

		const response = await axios({
			method: "post",
			url: "/api/recaptchaSubmit",
			data: {
				gRecaptchaToken,
			},
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
			},
		});

		// Validate input fields
		if (!title) setTitleError(true);
		if (!feedback) setFeedbackError(true);

		if (!title || !feedback) {
			console.error("Feedback and/or title not supplied");
			return;
		}

		if (response?.data?.success === true) {
			// console.log(`Success with score of ${response.data.score}`);
			setSubmit("Recatpcha verified and form submitted");
		} else {
			// console.log(`Failed with score ${response?.data?.score}`);
			setSubmit("Failed to verify captcha. You may be a robot.");
			return;
		}

		await createNewIssue({
			title,
			feedback,
			contactInfo: email,
		});
		setTitle("");
		setFeedback("");
		setEmail("");
	};

	return (
		<div style={{ height: "100vh", width: "100vw", padding: "4rem 0", color: bpi_deep_green }}>
			<div>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{
						"& .MuiTextField-root": { m: 1, width: "25ch" },
					}}
					noValidate
					autoComplete="off"
					style={{ margin: "0 auto", backgroundColor: "white", width: "50vw", height: "70vh", borderRadius: "14px", boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)" }}
				>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
						<p className="text-4xl font-bold">Feedback Form</p>
					</div>
					<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0rem 2rem" }}>
						<TextField label="Title" style={{ width: "90%" }} required value={title} onChange={(input) => setTitle(input.target.value)} error={titleError} />
						<TextField id="outlined-multiline-static" label="Feedback" multiline rows={3} style={{ width: "90%" }} required value={feedback} onChange={(input) => setFeedback(input.target.value)} error={feedbackError} />
						<TextField label="Email" type="email" style={{ width: "90%" }} value={email} onChange={(input) => setEmail(input.target.value)} />
						<Button style={{ backgroundColor: bpi_deep_green, marginTop: "1.5rem" }} type="submit" variant="contained">
							Submit Feedback
						</Button>
					</div>
				</Box>
			</div>
		</div>
	);
};

export default FeedbackForm;

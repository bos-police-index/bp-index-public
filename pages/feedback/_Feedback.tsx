"use client";
import { Octokit } from "@octokit/rest";
import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import axios from "axios";
import { bpi_deep_green, bpi_light_gray } from "@styles/theme/lightTheme";
import GoogleCaptchaWrapper from "@components/GoogleCaptchaWrapper";
import { checkIfEmailInputProperlyFormatted } from "@utility/utility";

interface CreateNewIssueParams {
	title: String;
	feedback: String;
	contactInfo: String | undefined;
}

const FeedbackForm = ({ setSubmit }) => {
	const { executeRecaptcha } = useGoogleReCaptcha();

	const [subject, setSubject] = useState<String>("");
	const [feedback, setFeedback] = useState<String>("");
	const [email, setEmail] = useState<String>("");

	const [subjectError, setSubjectError] = useState<boolean>(false);
	const [feedbackError, setFeedbackError] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const gitToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
	const gitOwner = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER;
	const gitRepoName = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;
	const gitRepoAssignee = process.env.NEXT_PUBLIC_GITHUB_ASSIGNEE;
	// const secretCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;

	const octokit = new Octokit({
		auth: gitToken,
	});

	async function createNewIssue({ subject, feedback, contactInfo }: { subject: String; feedback: String; contactInfo: String | undefined; }) {
		const body = `**User's Feedback:** ${feedback}\n\n**Contact Info:** ${contactInfo}`;
		try {
			const response = await octokit.request(`POST /repos/${gitOwner}/${gitRepoName}/issues`, {
				owner: gitOwner,
				repo: gitRepoName,
				title: subject,
				body,
				assignees: [gitRepoAssignee],
				labels: ["feedback"],
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			});
		} catch (error) {
			console.error("Error creating issue:", error);
		}
	}

	const handleSubmit = async (event) => {
		event.preventDefault();
		setIsSubmitting(true);

		// Reset error states
		setSubjectError(false);
		setFeedbackError(false);
		setSubmit("");

		if (!executeRecaptcha) {
			console.log("not available to execute captcha");
			setIsSubmitting(false);
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
		if (!subject) setSubjectError(true);
		if (!feedback) setFeedbackError(true);

		if (!subject || !feedback || !email) {
			setSubmit("Please fill all fields");
			setIsSubmitting(false);
			return;
		}

		if (!checkIfEmailInputProperlyFormatted(email)) {
			setSubmit("Invalid email format, please check your spelling");
			setIsSubmitting(false);
			return;
		}

		if (response?.data?.success === true) {
			setSubmit("Recatpcha verified and form submitted");
			
			await createNewIssue({
				subject,
				feedback,
				contactInfo: email,
			});
			
			setSubject("");
			setFeedback("");
			setEmail("");
		} else {
			setSubmit("Failed to verify captcha. You may be a robot.");
		}
		
		setIsSubmitting(false);
	};

	return (
		<div style={{ 
			minHeight: "100vh", 
			width: "100vw", 
			display: "flex", 
			alignItems: "center", 
			justifyContent: "center", 
			backgroundColor: bpi_light_gray,
			padding: "2rem 0"
		}}>
			<div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{
						'& .MuiTextField-root': { 
							width: '100%',
							my: 1.5,
							'& .MuiOutlinedInput-root': {
								'&:hover fieldset': {
									borderColor: bpi_deep_green,
								},
								'&.Mui-focused fieldset': {
									borderColor: bpi_deep_green,
									borderWidth: '2px',
								},
							},
							'& .MuiFormLabel-root.Mui-focused': {
								color: bpi_deep_green,
							},
						},
						boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
						borderRadius: 3,
						p: { xs: 3, sm: 5 },
						backgroundColor: 'white',
						width: { xs: '92%', sm: '70%', md: '50%', lg: '40%' },
						maxWidth: 550,
						display: 'flex',
						flexDirection: 'column',
						gap: 1,
						position: 'relative',
						overflow: 'hidden'
					}}
					noValidate
					autoComplete="off"
				>
					<div 
						style={{ 
							position: 'absolute', 
							top: 0, 
							left: 0, 
							right: 0, 
							height: '4px', 
							background: `linear-gradient(90deg, ${bpi_deep_green} 0%, #3bb78f 100%)` 
						}}
					/>
					
					<div style={{ width: '100%', textAlign: 'center', marginBottom: '1.8rem' }}>
						<h1
							className="text-4xl font-bold" 
							style={{ 
								color: bpi_deep_green, 
								letterSpacing: 1,
								margin: '0 0 0.5rem 0',
								fontSize: '2rem' 
							}}
						>
							Feedback Form
						</h1>
						<p
							style={{ 
								color: '#555', 
								fontSize: '0.95rem', 
								marginTop: 8,
								fontWeight: 400 
							}}
						>
							We value your feedback. Please share your thoughts with us.
						</p>
					</div>
					
					<TextField
						label="Email Address"
						required
						type="email"
						variant="outlined"
						value={email}
						onChange={(input) => setEmail(input.target.value)}
						InputProps={{ 
							style: { borderRadius: 8 }
						}}
					/>
					
					<TextField
						label="Subject"
						required
						variant="outlined"
						value={subject}
						onChange={(input) => setSubject(input.target.value)}
						error={subjectError}
						helperText={subjectError ? "Subject is required" : ""}
						InputProps={{ 
							style: { borderRadius: 8 }
						}}
					/>
					
					<TextField
						id="outlined-multiline-static"
						label="Feedback"
						multiline
						rows={5}
						required
						variant="outlined"
						value={feedback}
						onChange={(input) => setFeedback(input.target.value)}
						error={feedbackError}
						helperText={feedbackError ? "Feedback is required" : ""}
						InputProps={{ 
							style: { borderRadius: 8 }
						}}
					/>
					
					<div style={{ width: '100%', marginTop: '1.5rem' }}>
						<Button
							style={{
								background: `linear-gradient(90deg, ${bpi_deep_green} 0%, #3bb78f 100%)`,
								color: 'white',
								borderRadius: 8,
								padding: '0.8rem 0',
								fontWeight: 600,
								fontSize: '1rem',
								boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
								textTransform: 'none',
								transition: 'all 0.3s ease'
							}}
							type="submit"
							variant="contained"
							fullWidth
							disabled={isSubmitting}
							className="hover-scale"
						>
							{isSubmitting ? 'Submitting...' : 'Submit Feedback'}
						</Button>
					</div>
					
					<p
						style={{
							fontSize: '0.8rem',
							color: '#777',
							textAlign: 'center',
							marginTop: '1.5rem'
						}}
					>
						Your feedback helps us improve our services
					</p>
				</Box>
			</div>
		</div>
	);
};

const Feedback = ({ setSubmit }) => {
	return (
		<GoogleCaptchaWrapper>
			<FeedbackForm setSubmit={setSubmit} />
		</GoogleCaptchaWrapper>
	);
};

export default Feedback;

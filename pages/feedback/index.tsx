import { useState } from "react";
import Alert from "@mui/material/Alert";
import Feedback from "./_Feedback";

export default function Home() {
    const [submit, setSubmit] = useState<string>("");

    return (
		<div>
			{submit === "Recatpcha verified and form submitted" ? (
				<Alert
					style={{
						position: "fixed",
						top: "1rem",
						left: 0,
						right: 0,
						zIndex: 1000,
						margin: "0 auto",
						width: "fit-content",
					}}
					severity="success"
					onClose={() => {
						setSubmit("Notification Closed");
					}}
				>
					Feedback Recorded
				</Alert>
			) : submit === "Failed to verify captcha. You may be a robot." ? (
				<Alert
					style={{
						position: "fixed",
						top: "1rem",
						left: 0,
						right: 0,
						zIndex: 1000,
						margin: "0 auto",
						width: "fit-content",
					}}
					severity="error"
					onClose={() => {
						setSubmit("Notification Closed");
					}}
				>
					Submission Failed: {submit}
				</Alert>
			) : null}
			<Feedback setSubmit={setSubmit} />
		</div>
	);
}

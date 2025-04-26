import { useState } from "react";
import Alert, { AlertColor } from "@mui/material/Alert";
import Feedback from "./_Feedback";

interface AlertProps {
	severity: AlertColor;
	msg: string;
}

export default function Home() {
	const [submit, setSubmit] = useState<string>("");

	const AlertComponent: React.FC<AlertProps> = ({ severity, msg }) => {
		return (
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
				severity={severity}
				onClose={() => {
					setSubmit("Notification Closed");
				}}
			>
				{msg}
			</Alert>
		);
	};

	return (
		<div>
			{submit === "Recatpcha verified and form submitted" ? (
				<AlertComponent severity={"success"} msg={"Feedback Recorded"} />
			) : submit === "Failed to verify captcha. You may be a robot." ? (
				<AlertComponent severity={"error"} msg={"Submission Failed: Failed to verify captcha. You may be a robot."} />
			) : submit === "Please fill all fields" ? (
				<AlertComponent severity={"error"} msg={"Please fill all fields"} />
			) : submit === "Invalid email format, please check your spelling" ? (
				<AlertComponent severity={"error"} msg={"Invalid email format, please check your spelling"} />
			) : null}
			<Feedback setSubmit={setSubmit} />
		</div>
	);
}

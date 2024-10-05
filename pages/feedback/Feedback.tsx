import FeedbackForm from "./FeedbackForm";
import GoogleCaptchaWrapper from "@utility/GoogleCaptchaWrapper";

const Feedback = ({ setSubmit }) => {
	return (
		<GoogleCaptchaWrapper>
			<FeedbackForm setSubmit={setSubmit} />
		</GoogleCaptchaWrapper>
	);
};

export default Feedback;

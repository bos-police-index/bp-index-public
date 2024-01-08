import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface ErrorMessageProps {
	status: number;
	errorMessage: string;
	redirect?: boolean;
}
function ErrorMessage({ status, errorMessage, redirect = false }: ErrorMessageProps) {
	const router = useRouter();
	const [secondsLeft, setSecondsLeft] = useState<number>(5);

	useEffect(() => {
		const interval = setInterval(() => {
			setSecondsLeft((prev) => prev - 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (secondsLeft === 0) {
			if (redirect) {
				router.push("/").then();
			}
		}
	}, [secondsLeft]);

	return (
		<div className={"w-full h-full flex flex-col justify-center items-center text-white gap-2"}>
			<p className={"text-8xl font-bold"}>{status}</p>
			<p className={"text-4xl font-bold"}>{errorMessage}</p>
			{redirect && <p className={"text-lg"}>Redirecting to home page in {secondsLeft} seconds...</p>}
		</div>
	);
}

function Error({ statusCode }) {
	if (statusCode === 404) {
		return <ErrorMessage status={statusCode} errorMessage={"Page Not Found"} redirect={true} />;
	}

	return <ErrorMessage status={statusCode} errorMessage={"Something went wrong"} redirect={false} />;
}

Error.getInitialProps = ({ res, err }) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};

export default Error;

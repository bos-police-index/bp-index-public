import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const secretKey = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;

	if (req.method !== "POST") {
		return res.status(405).json({ message: "Only POST requests are allowed" });
	}

	try {
		const { gRecaptchaToken } = req.body;
		const formData = `secret=${secretKey}&response=${gRecaptchaToken}`;
		const googleRes = await axios.post("https://www.google.com/recaptcha/api/siteverify", formData, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (googleRes.data?.success && googleRes.data?.score > 0.5) {
			// console.log("Score:", googleRes.data.score);
			return res.status(200).json({ success: true, score: googleRes.data.score });
		} else {
			return res.status(200).json({ success: false, score: googleRes.data.score });
		}
	} catch (error) {
		console.error("Recaptcha verification failed:", error);
		return res.status(500).json({ success: false, error: "Recaptcha verification failed" });
	}
}

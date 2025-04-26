export default async function handler(req, res) {
	console.log("Request body:", req.body);

	// Ensure CORS headers are set properly
	res.setHeader("Access-Control-Allow-Origin", "*"); // Or specify exact origin
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	try {
		const response = await fetch("https://dev-graphql.bpindex.org/graphql", {
			method: "POST", // GraphQL typically uses POST
			headers: {
				"Content-Type": "application/json",
				...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
			},
			body: JSON.stringify(req.body),
		});

		const data = await response.json();
		return res.status(response.status).json(data);
	} catch (error) {
		console.error("Proxy error:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

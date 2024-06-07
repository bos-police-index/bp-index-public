/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			fontFamily: {
				roboto: ["Roboto", "sans-serif"],
				righteous: ["Righteous", "cursive"],
				urbanist: ["Urbanist", "sans-serif"],
			},
			transitionProperty: {
				background: "background, background-color, background-image, background-position, background-size, background-repeat",
				"font-color": "color, fill, stroke",
				size: "width, height, transform",
				button: "background, background-color, background-image, background-position, background-size, background-repeat, color, fill, stroke, width, height, transform",
			},
			colors: {
				"primary-hover": "#083b9e",
				primary: "#0949C6",
				'darkText': "#032752"
			},
			spacing: {
				68: "17rem",
			},
		},
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: false,
	},
};

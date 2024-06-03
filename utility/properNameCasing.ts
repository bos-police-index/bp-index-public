//fixed casing
export default function properCaseName(name) {
	const capitalize = (word) => {
		return word
			.split("")
			.map((char, index, arr) => {
				if (index === 0 || arr[index - 1] === "'" || arr[index - 1] === "-") {
					return char.toUpperCase();
				} else {
					return char.toLowerCase();
				}
			})
			.join("");
	};
	let nameParts = name.split(" ");

	const suffixes = ["Jr", "Sr", "II", "III", "IV", "V"];

	let processedNameParts = nameParts.map((part, index) => {
		if (index === nameParts.length - 1 && suffixes.includes(part.toUpperCase())) {
			return part.toUpperCase();
		} else {
			return capitalize(part);
		}
	});

	return processedNameParts.join(" ");
}

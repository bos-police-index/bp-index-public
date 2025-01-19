import { GridValueFormatterParams } from "@mui/x-data-grid";

export function yAndNToBoolean(value) {
	value = value.toUpperCase();
	const returnValue = value == "N" ? false : value == "Y" ? true : null;
	return returnValue;
}

//fixed casing
export function properCaseName(name) {
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

export function formatDateShort(params: GridValueFormatterParams) {
	const date = new Date(params.value as string);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	let formatted = year + "-";
	if (month < 10) {
		formatted += `0`;
	}
	formatted += `${month}-`;
	if (day < 10) {
		formatted += `0`;
	}
	formatted += `${day}`;
	return formatted;
}

export const formatTextDate = (timestamp: number) => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
	});
};

export function formatDate(params: GridValueFormatterParams) {
	const date = new Date(params.value as string);
	const hour = date.getHours();
	const minute = date.getMinutes();
	let formatted = formatDateShort(params) + " ";
	// format in am-pm
	if (hour > 12) {
		formatted += `${hour - 12}`;
	} else {
		formatted += `${hour}`;
	}
	formatted += ":";
	if (minute < 10) {
		formatted += `0`;
	}
	formatted += `${minute}`;
	if (hour > 12) {
		formatted += ` PM`;
	} else {
		formatted += ` AM`;
	}
	return formatted;
}

//changes 830 to 8.5
export function formatHours(number: number): string {
	const hours = Math.floor(number / 100);
	const minutes = (number % 100) / 60;

	const total = hours + minutes;

	return total.toString();
}

//changes 1500 to 2pm
export function formatTime(number: number): string {
	const isPm = number / 1200 >= 1;
	let hours = number / 100;
	hours = isPm && hours >= 13 ? hours - 12 : hours;
	hours = Math.floor(hours);
	const minutes = number.toString().padStart(4, "0").slice(-2);
	let total = hours.toString() + ":" + minutes;
	total += isPm ? "pm" : "am";
	return total;
}

export function formatMoney(number: number): string {
	const negative = number < 0.01;
	if (negative) {
		number *= -1;
	}
	if (number == 0) {
		return "0";
	}
	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(number);
	if (negative) {
		return `-$${formatted}`;
	}
	return `$${formatted}`;
}

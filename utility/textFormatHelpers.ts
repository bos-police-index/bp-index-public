import { GridValueFormatterParams } from "@mui/x-data-grid";

export function yAndNToBoolean(value) {
	value = value.toUpperCase();
	const returnValue = value == "N" ? false : value == "Y" ? true : null;
	return returnValue;
}

// Use for names like "Donahue,Ryan" or "Noel,Jacques Junior"
export const fixNameOrdering = (name) =>{
	let middleName = ""
	const nameParts = name.split(" ");
	if (nameParts.length > 1){
		middleName = nameParts[1].replace(".", "").trim();
	}
	 
	let newName = nameParts[0].split(',')
	newName = `${newName[1]} ${middleName} ${newName[0]}`
	return newName
}

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

// Extracts the year from a date (1/10/2020 --> 2020)
export function getYearFromDate (date){
	return String(date).substring(0,4);
}

//  Extracts the year from a date (1/10/2020 0:30 --> 2020)
export function getYearFromAnyFormat(date) {
	if (!date) return "Invalid Date"; // Handle null/undefined input

	// Check if the format is YYYY (e.g. "2019")
	if (/^(1\d{3}|2\d{3})$/.test(date)) {
		return date;
	}
	// Check if the format is YYYY-MM-DD (e.g., "1993-01-11")
	if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return date.substring(0, 4);
	}

	// Check if the format is DD/MM/YYYY or DD/MM/YYYY HH:MM
	let parts = date.split("/");
	if (parts.length === 3) {
		// The year part might have extra time data (e.g., "2020 18:00"), so split by space
		return parts[2].split(" ")[0].substring(0, 4);
	}

	return "Invalid Date"; // If format is unrecognized
}

//changes 830 to 8.5
export function formatHours(number: number): string {
	const hours = Math.floor(number / 100);
	const minutes = (number % 100) / 60;

	const total = Math.round((hours + minutes + Number.EPSILON) * 100) / 100;
	return total.toString();
}

//changes 1500 to 2pm
export function formatTime(number: number): string {
	const isPm = number / 1200 >= 1;
	let hours = number / 100;
	hours = isPm && hours >= 13 ? hours - 12 : hours;
	hours = Math.floor(hours);
	hours = hours == 0 ? 1 : hours;
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

export function formatMoneyNoCents(number: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(number);
}

export function formatPercentileNoDecimals(percent: number): string {
	let roundedPercent: number = Number(percent.toFixed(0));
	let wholeNumberPart = Math.floor(roundedPercent);
	let trailingNum = wholeNumberPart % 10;
	let suffix: string;

	// Handle special cases for 11th, 12th, and 13th
	if (wholeNumberPart % 100 >= 11 && wholeNumberPart % 100 <= 13) {
		suffix = "th";
	} else {
		switch (trailingNum) {
			case 1:
				suffix = "st";
				break;
			case 2:
				suffix = "nd";
				break;
			case 3:
				suffix = "rd";
				break;
			default:
				suffix = "th";
		}
	}

	// Ensure consistent two-decimal formatting
	return `${roundedPercent.toFixed(0)}${suffix}`;
}

export function noNullStringToBool(rowVal: string): boolean {
	if (rowVal.includes("No")) {
		return false;
	}
	return true;
}

// Converts Zip Code Strings that may be malformed (only 4 digits or XXXXX - XXXXX) into properly formed 5 digit zips
export function fixZipCode(zip: string) {
	if (zip.length == 0 || zip.startsWith("00000")) {
		return "";
	}

	// Case #1 Length > 5 (XXXXX-XXXXX)
	else if (zip.length > 5 && zip.includes("-")) {
		zip = zip.split("-")[0];
	} 
	// Case #1.5 Length > 5 (XXXXXXXXXX)
	else if (zip.length > 5) {
		zip = zip.substring(0, 5);
	}
	// Case #2 Length < 5 (XXXX)
	else if (zip.length < 5) {
		zip = zip.padStart(5, "0");
	}

	// Case #3 Length = 5 (XXXXX)
	return zip;
}
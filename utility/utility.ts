export function determinePercentile(data: number[], target: number): number {
	let lessThanTarget = 0;
	for (let i = 0; i < data.length; i++) {
		if (data[i] < target) {
			lessThanTarget++;
		}
	}
	return (lessThanTarget / data.length) * 100;
}

export function checkIfEmailInputProperlyFormatted(email: String) {
	return email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

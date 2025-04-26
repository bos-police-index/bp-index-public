// Source: https://owd.boston.gov/wp-content/uploads/2015/07/Neighborhood-Boundaries-and-Zip-Codes.pdf
const zipCodeMap: Map<string, string[]> = new Map();
zipCodeMap.set("Allston/Brighton", ["01234", "02135", "02163"]);
zipCodeMap.set("Back Bay/Beacon Hill", ["02108", "02116", "02117", "02123", "02133", "02199", "02216", "02217", "02295"]);
zipCodeMap.set("Central Boston", ["02101", "02102", "02103", "02104", "02105", "02106", "02107", "02109", "02110", "02111", "02112", "02113", "02114", "02196", "02201", "02202", "02203", "02204", "02205", "02206", "02207", "02208", "02209", "02211", "02212", "02222", "02293"]);
zipCodeMap.set("Charlestown", ["02129"]);
zipCodeMap.set("Dorchester", ["02122", "02124", "02125"]);
zipCodeMap.set("East Boston", ["02128", "02228"]);
zipCodeMap.set("Fenway/Kenmore", ["02115", "02215"]);
zipCodeMap.set("Hyde Park", ["02136"]);
zipCodeMap.set("Jamaica Plain", ["02130"]);
zipCodeMap.set("Mattapan", ["02126"]);
zipCodeMap.set("Roslindale", ["02131"]);
zipCodeMap.set("Roxbury", ["02119", "02120", "02121"]);
zipCodeMap.set("South Boston", ["02127", "02210"]);
zipCodeMap.set("South End", ["02118"]);
zipCodeMap.set("West Roxbury", ["02132"]);

export function getNeighborhoodByZip(zipCode: string): string | undefined {
	for (const [neighborhood, zipCodes] of zipCodeMap.entries()) {
		if (zipCodes.includes(zipCode)) {
			return neighborhood;
		}
	}
	return "Outside Boston";
}

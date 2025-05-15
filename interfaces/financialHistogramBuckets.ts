// Used for the financial histogram

declare global {
	interface PayTypeBucketRow {
		totalPay: number[];
		detailPay: number[];
		injuredPay: number[];
		otherPay: number[];
		regularPay: number[];
		quinnPay: number[];
		retroPay: number[];
		otPay: number[];
	}

	interface PayTypeBuckets {
		[year: number]: PayTypeBucketRow;
	}
}

export {};

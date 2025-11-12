export const mockOpenAIResponse = {
	parsing: {
		dosage: { amount: 1, unit: 'tablet' },
		frequency: { timesPerDay: 2, interval: 'every 12 hours' },
		route: 'oral',
		confidence: 'high' as const,
		warnings: []
	},
	quantity: {
		dailyQuantity: 2,
		totalQuantityNeeded: 60,
		calculation: '1 tablet × 2 times/day × 30 days = 60 tablets',
		assumptions: [],
		uncertainties: []
	},
	optimization: {
		recommendedPackages: [
			{
				ndc: '12345-678-90',
				quantity: 1,
				reason: 'Best match for quantity needed'
			}
		],
		alternatives: [],
		rationale: 'Recommended package matches quantity needed'
	},
	overallConfidence: 'high' as const,
	warnings: []
};


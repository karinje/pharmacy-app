<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import DrugSearchInput from './DrugSearchInput.svelte';
	import InstructionsInput from './InstructionsInput.svelte';
	import DaysSupplyInput from './DaysSupplyInput.svelte';
	import FormActions from './FormActions.svelte';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { calculatorFormSchema } from '$lib/utils/calculator-validation';
	import type { CalculatorFormData } from '$lib/types/calculator';

	export let isSubmitting: boolean = false;

	const dispatch = createEventDispatcher<{
		submit: CalculatorFormData;
		reset: void;
	}>();

	let formData: CalculatorFormData = {
		drugName: '',
		instructions: '',
		daysSupply: 30
	};

	let errors: Partial<Record<keyof CalculatorFormData, string>> = {};

	$: isValid =
		formData.drugName.length >= 2 &&
		formData.instructions.length >= 5 &&
		formData.daysSupply >= 1 &&
		formData.daysSupply <= 365;

	function handleSubmit() {
		console.log('Form handleSubmit called, formData:', formData);
		// Clear previous errors
		errors = {};

		try {
			// Validate form data
			const validated = calculatorFormSchema.parse(formData);
			console.log('Form validation passed, dispatching submit:', validated);

			// Dispatch submit event
			dispatch('submit', validated);
		} catch (error: any) {
			console.error('Form validation failed:', error);
			// Handle validation errors
			if (error.errors) {
				error.errors.forEach((err: any) => {
					const key = err.path[0] as keyof CalculatorFormData;
					errors[key] = err.message;
				});
			}
		}
	}

	function handleReset() {
		formData = {
			drugName: '',
			instructions: '',
			daysSupply: 30
		};
		errors = {};
		dispatch('reset');
	}
</script>

<div class="space-y-6">
	<!-- Form Card -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Prescription Details</h2>
			<p class="text-sm text-muted-foreground">
				Fill in the information below to calculate recommended NDC packages
			</p>
		</CardHeader>

		<CardContent>
			<form on:submit|preventDefault={handleSubmit} class="space-y-8">
				<DrugSearchInput
					bind:value={formData.drugName}
					error={errors.drugName}
					disabled={isSubmitting}
				/>

				<InstructionsInput
					bind:value={formData.instructions}
					error={errors.instructions}
					disabled={isSubmitting}
				/>

				<DaysSupplyInput
					bind:value={formData.daysSupply}
					error={errors.daysSupply}
					disabled={isSubmitting}
				/>

				<FormActions {isSubmitting} {isValid} onReset={handleReset} />
			</form>
		</CardContent>
	</Card>
</div>

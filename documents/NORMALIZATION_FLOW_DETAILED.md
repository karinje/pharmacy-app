# Normalization Flow - Detailed Walkthrough

This document explains how the app normalizes drug names and NDC codes, which is the foundation of accurate prescription calculations. Understanding this flow is essential for demos and troubleshooting.

## Overview: Two Types of Normalization

The app performs two critical normalization processes:

1. **Drug Name Normalization**: Converts various drug name formats (brand names, generic names, misspellings) into a standardized identifier called an RxCUI (RxNorm Concept Unique Identifier). This ensures that "Metformin 500mg", "metformin hydrochloride 500 mg", and "Glucophage 500mg" all map to the same standard concept.

2. **NDC Code Normalization**: Converts NDC codes from various formats (like "12345-678-90" or "1234-5678-90") into a standardized 11-digit format (like "12345678900"). This ensures consistent lookups and comparisons across different systems.

## The Complete Normalization Journey

When a pharmacist enters a drug name, the app follows one of two paths depending on whether they use the autocomplete feature or type manually. Both paths eventually converge at the same point, but the autocomplete path is faster because it gets the drug identifier upfront.

---

## Path 1: Autocomplete Selection (Faster Path)

**When this happens**: User types in the drug search box and selects a suggestion from the dropdown.

**Step-by-step process**:

1. **User starts typing**: When the pharmacist types "met" in the drug name field, the app waits 300 milliseconds (called "debouncing") before making any API calls. This prevents making too many requests while the user is still typing.

2. **Autocomplete API call**: After the 300ms delay, the app calls the autocomplete service, which connects to a Firebase Cloud Function. This function then calls the **CTSS RxTerms API** from the National Library of Medicine. This API is specifically designed for autocomplete and returns clean, user-friendly drug names along with their RxCUI identifiers.

3. **Display suggestions**: The API returns results like:
   - "Metformin 500mg (Oral Pill)" with RxCUI "6809"
   - "Metformin 1000mg (Oral Pill)" with RxCUI "6809"
   - "Metformin Extended Release 500mg" with RxCUI "6809"
   
   These appear in a dropdown below the search box.

4. **User selects a suggestion**: When the pharmacist clicks on "Metformin 500mg (Oral Pill)", the app immediately stores:
   - The drug name: "Metformin 500mg (Oral Pill)"
   - The RxCUI identifier: "6809"
   
   This RxCUI is the standardized identifier that all pharmaceutical systems understand.

5. **Skip normalization later**: Because we already have the RxCUI stored, when the user clicks "Calculate", the app can skip the drug normalization step entirely. This saves time and an API call.

**Why this path is faster**: The RxCUI is obtained upfront during autocomplete, so there's no need to normalize the drug name again during calculation. This eliminates one API call from the calculation process.

**Fallback behavior**: If the CTSS RxTerms API fails or returns no results, the app automatically falls back to the RxNorm approximateTerm API, which does fuzzy matching to find similar drug names.

---

## Path 2: Manual Entry (Slightly Slower Path)

**When this happens**: User types a drug name manually without selecting from the autocomplete dropdown, or the autocomplete doesn't find a match.

**Step-by-step process**:

1. **User types manually**: The pharmacist types "metformin 500mg" directly into the field without clicking any autocomplete suggestions. The autocomplete dropdown might appear, but the user ignores it and continues typing.

2. **No RxCUI stored**: Because the user didn't select from autocomplete, no RxCUI identifier is stored. The app only has the raw text the user typed.

3. **User clicks Calculate**: When the pharmacist fills out the rest of the form and clicks the "Calculate" button, the calculation service checks: "Do we have an RxCUI for this drug?" The answer is no, so normalization is required.

4. **Drug normalization begins**: The app calls the drug normalization service, which connects to a Firebase Cloud Function. This function calls the **RxNorm approximateTerm API**, which performs fuzzy matching to find the best match for the drug name.

5. **Cleaning the input**: Before sending to the API, the app cleans the drug name by removing parenthetical information (like "(Oral Pill)") and extra descriptors. So "metformin 500mg (tablet)" becomes "metformin 500mg".

6. **API returns normalized data**: The RxNorm API analyzes the input and returns:
   - **RxCUI**: "6809" (the standardized identifier)
   - **Normalized name**: "metformin" (the standard name)
   - **Confidence level**: "high", "medium", or "low" (based on how well the match scored)
   - **Alternative matches**: Other possible drugs that might match, in case the first one is wrong

7. **Confidence checking**: If the confidence is "low" and the matched name is significantly different from what the user typed, the app adds a warning message. For example, if the user typed "metformin" but the API matched it to "metformin hydrochloride" with low confidence, a warning would appear asking the pharmacist to verify this is correct.

**Why this path is slower**: This path requires an additional API call during the calculation process, which adds about 1-2 seconds to the total time. However, it's still fast enough that users don't notice a significant delay.

---

## After Drug Normalization: Both Paths Converge

At this point, regardless of which path was taken, the app has:
- **RxCUI**: A standardized identifier (like "6809")
- **Normalized drug name**: The standard name (like "metformin")
- **Confidence level**: How certain we are this is correct

Now the app moves to the next stage: finding NDC products from the FDA database.

---

## Stage 2: FDA NDC Product Search

**What happens here**: The app searches the FDA database to find all National Drug Code (NDC) products that match the normalized drug. NDC codes are the unique identifiers for each specific drug product, including manufacturer, package size, and formulation.

**The challenge**: The FDA database uses ingredient names (like "metformin"), not brand names (like "Glucophage"). So if we have a brand name, we need to convert it to the ingredient name first.

**Step-by-step process**:

1. **Get ingredient name (if needed)**: If we have an RxCUI (which we do from the normalization step), the app first tries to get the ingredient name from RxNorm. It calls the RxNorm "related concepts" API, which returns the ingredient (IN) or precise ingredient (PIN) name that the FDA database recognizes. This is important because "Glucophage" needs to become "metformin" for the FDA search to work.

2. **Multiple search strategies**: The FDA database can be finicky, so the app tries multiple search strategies in order until one succeeds:
   - **Strategy 1**: Exact match with quotes: `generic_name:"metformin"` (most specific)
   - **Strategy 2**: Exact match without quotes: `generic_name:metformin` (allows partial matches)
   - **Strategy 3**: Brand name search: `brand_name:"metformin"` (in case it's listed by brand)
   - **Strategy 4**: First word only: `generic_name:"metformin"` (for compound drug names)
   - **Strategy 5**: Uppercase variant: `generic_name:"METFORMIN"` (FDA sometimes uses uppercase)
   - **Strategy 6**: Ingredient name from RxNorm: If we got an ingredient name, try searching with that

3. **FDA API call**: The app calls the FDA NDC Directory API with one of these search queries. The API returns up to 100 products, each containing:
   - **NDC code**: The product identifier (like "12345-678-90")
   - **Generic name**: "metformin"
   - **Brand name**: "Glucophage" (if applicable)
   - **Manufacturer**: The company that makes it
   - **Package size**: "100 TABLET in 1 BOTTLE"
   - **Dosage form**: "TABLET", "CAPSULE", etc.
   - **Marketing status**: "Prescription", "Over-the-counter", or "Discontinued"
   - **Expiration date**: When the product listing expires
   - **Active ingredients**: The chemical components and their strengths

4. **Filter active vs inactive**: The app processes each product to determine if it's currently active. A product is considered active if:
   - Its marketing status indicates it's available (Prescription, OTC, etc.)
   - It hasn't expired (or expired recently, with a 30-day grace period)
   - It's not explicitly marked as discontinued, unapproved, or withdrawn

5. **Return results**: The app returns all products found, but separates them into:
   - **Active products**: Can be dispensed right now
   - **Inactive products**: Discontinued, expired, or otherwise unavailable

**Why multiple strategies**: Different drugs are listed in different ways in the FDA database. Some are listed by generic name, some by brand name, some with different capitalization. By trying multiple strategies, we maximize the chance of finding all available products.

---

## Stage 3: NDC Code Normalization

**What happens here**: NDC codes come in various formats, and the app normalizes them all to a standard 11-digit format for consistent processing.

**The problem**: NDC codes can be written in different ways:
- "12345-678-90" (5-4-2 format: 5 digits for labeler, 4 for product, 2 for package)
- "1234-5678-90" (4-4-2 format: 4 digits for labeler, 4 for product, 2 for package)
- "12345-67-89" (5-3-2 format: 5 digits for labeler, 3 for product, 2 for package)
- "12345678900" (11 digits with no hyphens)

**The solution**: The app's NDC normalization function converts all of these formats into a standard 11-digit format: "12345678900". It does this by:
- Removing all hyphens
- Padding each section with zeros to ensure:
  - **Labeler code**: Always 5 digits (padded with leading zeros if needed)
  - **Product code**: Always 4 digits (padded with leading zeros if needed)
  - **Package code**: Always 2 digits (padded with leading zeros if needed)

**Example**: 
- Input: "12345-678-90"
- Processing: Remove hyphens → "1234567890" (10 digits)
- Add leading zero to package code → "12345678900" (11 digits)
- Output: "12345678900"

**Why this matters**: Different systems store NDC codes in different formats. By normalizing to a standard format, we can reliably compare codes, look them up in databases, and ensure we're talking about the same product.

---

## Stage 4: OpenAI Calculation Process

Once we have the normalized drug name and all available NDC products, the app sends everything to OpenAI to perform the intelligent calculations. This happens in four sequential steps:

### Step 1: Parse Prescription Instructions

**What it does**: Takes the prescription instructions (like "Take 2 tablets by mouth twice daily") and converts them into structured data that the app can work with.

**How it works**: Uses GPT-4o (OpenAI's language model) to understand natural language and medical abbreviations. The model is trained to recognize:
- Medical abbreviations: BID (twice daily), TID (three times daily), QID (four times daily), PRN (as needed)
- Complex instructions: Tapering schedules, multi-phase dosing, conditional instructions
- Different units: Tablets, capsules, milliliters, units (for insulin), actuations (for inhalers)

**Input example**: 
```
Drug: metformin
Instructions: "Take 2 tablets by mouth twice daily"
Days Supply: 30
```

**Output example**:
```json
{
  "dose": 2,
  "unit": "tablet",
  "frequency": "BID",
  "frequencyPerDay": 2,
  "route": "oral",
  "confidence": "high",
  "warnings": []
}
```

**Why AI is needed**: Prescription instructions are written in natural language with lots of variation. A rule-based parser would miss edge cases, but AI can handle the variety and complexity of real-world prescriptions.

### Step 2: Calculate Total Quantity Needed

**What it does**: Takes the parsed instructions and calculates exactly how much medication is needed for the entire prescription period.

**How it works**: Uses GPT-5 (OpenAI's reasoning model) to perform mathematical calculations. This model is specifically designed for accurate math and shows its work step-by-step.

**Calculation process**:
- **Daily quantity**: Multiply the dose by the frequency per day
  - Example: 2 tablets × 2 times per day = 4 tablets per day
- **Total quantity**: Multiply daily quantity by days supply
  - Example: 4 tablets per day × 30 days = 120 tablets total

**Input example**:
```
Parsing: { dose: 2, frequencyPerDay: 2, unit: "tablet" }
Days Supply: 30
```

**Output example**:
```json
{
  "dailyQuantity": 4,
  "totalQuantityNeeded": 120,
  "calculation": "Daily: 2 tablets × 2 times/day = 4 tablets/day\nTotal: 4 tablets/day × 30 days = 120 tablets",
  "assumptions": [],
  "uncertainties": []
}
```

**Why GPT-5 for math**: Mathematical calculations need to be 100% accurate. GPT-5's reasoning capabilities ensure the math is correct, and it shows its work so we can verify the calculation.

### Step 3: Optimize Package Selection

**What it does**: Takes the total quantity needed and all available NDC products, then determines the best combination of packages to dispense.

**How it works**: Uses GPT-4o to apply an optimization algorithm that balances multiple factors:
- **Minimize overfill**: Don't dispense too much extra medication (aim for ≤20% overfill)
- **Minimize number of packages**: Prefer fewer packages for convenience
- **Prefer active products**: Always choose active NDCs over inactive ones
- **Consider package sizes**: Larger packages are often more cost-effective

**Optimization algorithm**:
1. Sort all available packages by size (largest first)
2. For each package size, check if a single package covers the quantity needed with acceptable overfill (≤20%)
3. If no single package works, try combinations of packages
4. Generate multiple alternatives so the pharmacist has options

**Input example**:
```
Drug: metformin
Total Quantity Needed: 120 tablets
Available Packages:
  - NDC: 12345-678-90, Size: 100 tablets, Active: true
  - NDC: 12345-678-91, Size: 30 tablets, Active: true
  - NDC: 12345-678-92, Size: 120 tablets, Active: true
```

**Output example**:
```json
{
  "recommended": {
    "packages": [
      { "ndc": "12345-678-92", "quantity": 1 }
    ],
    "totalDispensed": 120,
    "overfillPercentage": 0
  },
  "alternatives": [
    {
      "packages": [
        { "ndc": "12345-678-90", "quantity": 1 },
        { "ndc": "12345-678-91", "quantity": 1 }
      ],
      "totalDispensed": 130,
      "overfillPercentage": 8.3
    }
  ]
}
```

**Why AI for optimization**: Package optimization involves balancing multiple competing factors (cost, convenience, waste, availability). AI can consider all these factors simultaneously and make intelligent trade-offs, similar to how a human pharmacist would think.

### Step 4: Generate Human-Readable Explanation

**What it does**: Takes all the calculation results and creates a clear, professional explanation that a pharmacist can understand and use.

**How it works**: Uses GPT-4o to write natural language explanations that:
- Summarize the prescription requirements
- Explain the recommended package selection
- Highlight any warnings or concerns
- Present alternative options clearly

**Output example**:
```
Based on your prescription of 2 tablets twice daily for 30 days, you will need 120 tablets total. 

We recommend 1 bottle of 120 tablets from Teva Pharmaceuticals (NDC: 12345-678-92), which provides exactly the required quantity with no overfill. This is the most efficient option.

Alternative options:
- Option 2: 1 bottle of 100 tablets + 1 bottle of 30 tablets = 130 tablets (8.3% overfill)
- Option 3: 1 bottle of 500 tablets = 500 tablets (317% overfill, not recommended)

Note: NDC 12345-678-90 is currently inactive and has been excluded from recommendations.
```

**Why AI for explanations**: Explanations need to be clear, professional, and tailored to the audience (pharmacists). AI can generate explanations that are both technically accurate and easy to understand.

---

## Final Result Assembly

After all these steps complete, the app assembles a comprehensive result object that includes:

- **RxNorm data**: The normalized drug name and RxCUI identifier
- **All products**: Every NDC product found (both active and inactive)
- **Active products**: Only the products that can be dispensed now
- **Inactive products**: Products that are discontinued or expired (shown for reference)
- **Parsed instructions**: The structured data from the prescription
- **Quantity calculation**: The total amount needed and how it was calculated
- **Package optimization**: The recommended packages and alternatives
- **Explanation**: The human-readable summary
- **Warnings**: Any concerns or issues that need attention

This complete result is then displayed to the pharmacist in a user-friendly interface, saved to the calculation history, and can be exported or shared as needed.

---

## Performance and Caching

To ensure fast response times, the app caches API responses at multiple levels:

**Client-side caching (in browser memory)**:
- **Autocomplete searches**: Cached for 1 hour (users often search for the same drugs)
- **Drug normalization**: Cached for 7 days (drug names don't change often)
- **FDA searches**: Cached for 24 hours (FDA updates daily)
- **NDC validation**: Cached for 24 hours

**Server-side caching (in Firestore database)**:
- **Autocomplete searches**: Cached for 1 hour
- **Drug normalization**: Cached for 7 days
- All caches are shared across all users, so if one user searches for "metformin", the next user gets instant results

**Why caching matters**: Without caching, every calculation would require multiple API calls, which would be slow and expensive. With caching, repeat searches are nearly instantaneous, and the app uses fewer API calls overall.

---

## Error Handling and Resilience

The normalization process includes multiple layers of error handling:

**If autocomplete fails**: Falls back to RxNorm approximateTerm API
**If RxNorm normalization fails**: Shows an error message asking the user to verify the drug name
**If FDA search fails**: Tries multiple search strategies before giving up
**If OpenAI calculation fails**: Retries up to 3 times with exponential backoff (waits longer between each retry)
**If all else fails**: Shows a clear error message explaining what went wrong and suggesting next steps

The goal is to handle edge cases gracefully and still provide useful results even when some APIs are having issues.

---

## Summary: Why Normalization Matters

Normalization is the foundation of accurate prescription calculations. Without it:

- **Drug names vary**: "Metformin 500mg", "metformin hydrochloride 500 mg", and "Glucophage 500mg" would be treated as different drugs
- **NDC codes vary**: "12345-678-90" and "12345678900" would be treated as different codes
- **Systems can't communicate**: Different databases use different formats, making it impossible to match prescriptions to products

With normalization:

- **All drug name variations map to the same identifier**: Ensures we're always talking about the same drug
- **All NDC formats convert to the same standard**: Enables reliable lookups and comparisons
- **Systems can communicate**: Different APIs and databases can work together seamlessly

This is why the normalization process is so detailed and includes multiple fallback strategies—it's critical that it works correctly every time.


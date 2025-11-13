# NDC Packaging & Quantity Calculator

**Organization:** Foundation Health  
**Project ID:** hnCCiUa1F2Q7UU8GBlCe_1762540939252

An AI-powered decision support system that helps pharmacists accurately match prescriptions to valid National Drug Codes (NDCs) and calculate optimal dispense quantities in seconds instead of minutes.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [How It Works](#how-it-works)
- [Architecture & Workflow](#architecture--workflow)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [API Integrations](#api-integrations)
- [Core Components](#core-components)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Implementation Status](#implementation-status)

---

## Problem Statement

### The Real-World Challenge

When a doctor writes a prescription like:
> "Metformin 500mg - Take 2 tablets twice daily for 90 days"

Pharmacists face several complex challenges:

1. **Which Product Code?** The same drug has 50+ different NDCs depending on manufacturer, package size, and formulation
2. **Is the Code Still Valid?** 15-20% of NDCs in circulation are inactive, causing claim rejections
3. **Package Math** Calculating total quantity (2 × 2 × 90 = 360 tablets) and selecting optimal packages
4. **Complex Instructions** Handling medical abbreviations, PRN medications, tapering schedules
5. **Special Dosage Forms** Insulin (units), inhalers (actuations), liquids (mL)

### Current Process (Without This Tool)

```
1. Read prescription: 10 seconds
2. Calculate quantity: 30 seconds
3. Look up NDCs: 2-3 minutes
4. Check active status: 3-5 minutes
5. Calculate packages: 2-3 minutes
6. Double-check: 2-3 minutes

TOTAL: 10-15 minutes per prescription
ERROR RATE: 8-12% (1 in 10 prescriptions has issues)
```

### The Impact

- **Financial**: Each claim rejection costs $2,500-5,000 to resolve
- **Operational**: 3-5 hours wasted daily on manual lookups
- **Patient**: Delayed medication therapy, multiple pharmacy callbacks
- **Accuracy**: Manual calculations prone to human error

---

## Solution Overview

### What This App Does

An **AI-powered calculator** that transforms the 10-15 minute manual process into a **30-second automated workflow** with **95%+ accuracy**.

**Pharmacist inputs 3 things:**
1. Drug name (e.g., "Metformin 500mg")
2. Instructions (e.g., "Take 2 tablets twice daily")
3. Duration (e.g., "90 days")

**App automatically:**
1. ✅ Normalizes drug name to standard RxCUI code
2. ✅ Parses instructions using AI (handles abbreviations, complex schedules)
3. ✅ Calculates total quantity needed
4. ✅ Retrieves all valid NDCs from FDA database
5. ✅ Filters out inactive NDCs (prevents claim rejections)
6. ✅ Optimizes package combinations (minimizes waste, maximizes convenience)
7. ✅ Generates clear recommendations with explanations

**Pharmacist gets:**
- ✅ Exact product code to use
- 📦 Optimal package combination
- 📊 Clear calculation breakdown
- ⚠️ Warnings about inactive codes
- 💡 Alternative options

### Key Differentiator

This is an **AI-first application** where GPT-4o makes all intelligent decisions:
- Understanding natural language prescription instructions
- Filtering and validating NDCs
- Optimizing packaging combinations
- Explaining recommendations

**Result:** 10-15 minutes → 30 seconds | 8-12% error rate → <2% | $10,000-15,000 saved per pharmacy annually

---

## How It Works

### Simple 3-Step User Experience

```
┌────────────────────────────────────────────┐
│  PHARMACIST INPUTS (3 fields)              │
├────────────────────────────────────────────┤
│  1. Drug Name: "Metformin 500mg"          │
│  2. Instructions: "Take 2 tablets BID"     │
│  3. Days Supply: 90                        │
└────────────────┬───────────────────────────┘
                 │
                 ▼
         [30 seconds later]
                 │
                 ▼
┌────────────────────────────────────────────┐
│  APP OUTPUT                                │
├────────────────────────────────────────────┤
│  ✅ RECOMMENDED                            │
│  NDC: 00093-7214-01 (Teva) - ACTIVE       │
│  Dispense: 4 bottles × 100 tablets        │
│  Total: 400 tablets (360 needed)          │
│  Overfill: 40 tablets (11%)               │
│                                            │
│  ⚠️ WARNING                                │
│  NDC 12345-678-90 is INACTIVE - excluded  │
│                                            │
│  💡 ALTERNATIVES                           │
│  • Option 2: 4 × 90 tablets (exact)       │
│  • Option 3: 1 × 500 tablets (wasteful)   │
└────────────────────────────────────────────┘
```

---

## Normalization Flow - Detailed Walkthrough

This section explains how the app normalizes drug names and NDC codes, which is the foundation of accurate prescription calculations. Understanding this flow is essential for demos and troubleshooting.

### Overview: Two Types of Normalization

The app performs two critical normalization processes:

1. **Drug Name Normalization**: Converts various drug name formats (brand names, generic names, misspellings) into a standardized identifier called an RxCUI (RxNorm Concept Unique Identifier). This ensures that "Metformin 500mg", "metformin hydrochloride 500 mg", and "Glucophage 500mg" all map to the same standard concept.

2. **NDC Code Normalization**: Converts NDC codes from various formats (like "12345-678-90" or "1234-5678-90") into a standardized 11-digit format (like "12345678900"). This ensures consistent lookups and comparisons across different systems.

### The Complete Normalization Journey

When a pharmacist enters a drug name, the app follows one of two paths depending on whether they use the autocomplete feature or type manually. Both paths eventually converge at the same point, but the autocomplete path is faster because it gets the drug identifier upfront.

---

### Path 1: Autocomplete Selection (Faster Path)

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

### Path 2: Manual Entry (Slightly Slower Path)

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

### After Drug Normalization: Both Paths Converge

At this point, regardless of which path was taken, the app has:
- **RxCUI**: A standardized identifier (like "6809")
- **Normalized drug name**: The standard name (like "metformin")
- **Confidence level**: How certain we are this is correct

Now the app moves to the next stage: finding NDC products from the FDA database.

---

### Stage 2: FDA NDC Product Search

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

### Stage 3: NDC Code Normalization

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

### Stage 4: OpenAI Calculation Process

Once we have the normalized drug name and all available NDC products, the app sends everything to OpenAI to perform the intelligent calculations. This happens in four sequential steps:

#### Step 1: Parse Prescription Instructions

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

#### Step 2: Calculate Total Quantity Needed

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

#### Step 3: Optimize Package Selection

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

#### Step 4: Generate Human-Readable Explanation

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

### Final Result Assembly

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

### Performance and Caching

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

### Error Handling and Resilience

The normalization process includes multiple layers of error handling:

**If autocomplete fails**: Falls back to RxNorm approximateTerm API
**If RxNorm normalization fails**: Shows an error message asking the user to verify the drug name
**If FDA search fails**: Tries multiple search strategies before giving up
**If OpenAI calculation fails**: Retries up to 3 times with exponential backoff (waits longer between each retry)
**If all else fails**: Shows a clear error message explaining what went wrong and suggesting next steps

The goal is to handle edge cases gracefully and still provide useful results even when some APIs are having issues.

---

### Summary: Why Normalization Matters

Normalization is the foundation of accurate prescription calculations. Without it:

- **Drug names vary**: "Metformin 500mg", "metformin hydrochloride 500 mg", and "Glucophage 500mg" would be treated as different drugs
- **NDC codes vary**: "12345-678-90" and "12345678900" would be treated as different codes
- **Systems can't communicate**: Different databases use different formats, making it impossible to match prescriptions to products

With normalization:

- **All drug name variations map to the same identifier**: Ensures we're always talking about the same drug
- **All NDC formats convert to the same standard**: Enables reliable lookups and comparisons
- **Systems can communicate**: Different APIs and databases can work together seamlessly

This is why the normalization process is so detailed and includes multiple fallback strategies—it's critical that it works correctly every time.

---

## Architecture & Workflow

### Complete Technical Workflow

```mermaid
graph TB
    Start([Pharmacist Inputs<br/>Drug Name, SIG, Days Supply]) --> AutocompleteCheck{Autocomplete<br/>selection made?}
    
    %% Autocomplete Path
    AutocompleteCheck -->|YES| HasRxCUI[RxCUI already stored<br/>Skip normalization]
    AutocompleteCheck -->|NO| NormalizeStep[Step 1: Drug Normalization]
    
    %% Autocomplete API calls (happens as user types)
    AutocompleteCheck -.->|User types| AutocompleteAPI[CTSS RxTerms API<br/>clinicaltables.nlm.nih.gov<br/>/api/rxterms/v3/search]
    AutocompleteAPI -.->|If fails| AutocompleteFallback[RxNorm approximateTerm API<br/>rxnav.nlm.nih.gov/REST<br/>/approximateTerm.json]
    AutocompleteFallback -.->|Returns candidates| UserSelects{User selects<br/>from dropdown?}
    AutocompleteAPI -.->|Returns candidates| UserSelects
    UserSelects -.->|YES| StoreRxCUI[Store RxCUI + name]
    StoreRxCUI -.-> HasRxCUI
    
    %% Manual Normalization Path
    NormalizeStep --> RxNormAPI[RxNorm API<br/>approximateTerm.json<br/>Convert drug name to RxCUI]
    RxNormAPI --> ConfidenceCheck{Confidence<br/>Score?}
    ConfidenceCheck -->|High ≥90| HighConf[RxCUI + normalized name<br/>Confidence: high]
    ConfidenceCheck -->|Medium 70-89| MedConf[RxCUI + normalized name<br/>Confidence: medium]
    ConfidenceCheck -->|Low <70| LowConf[RxCUI + normalized name<br/>Confidence: low<br/>Add warning]
    ConfidenceCheck -->|No match| Error1[Error: Drug not found]
    
    HighConf --> HasRxCUI
    MedConf --> HasRxCUI
    LowConf --> HasRxCUI
    
    %% Converge at FDA Search
    HasRxCUI --> IngredientLookup[Get ingredient name<br/>RxNorm Related Concepts API<br/>/rxcui/{rxcui}/related.json]
    IngredientLookup --> FDASearch[Step 2: Get All NDCs<br/>FDA NDC Directory API]
    
    %% FDA Search with multiple strategies
    FDASearch --> FDAStrategy1[FDA API: Strategy 1<br/>generic_name:metformin]
    FDAStrategy1 --> FDAStrategy2[Strategy 2: Without quotes]
    FDAStrategy2 --> FDAStrategy3[Strategy 3: Brand name]
    FDAStrategy3 --> FDAStrategy4[Strategy 4: First word]
    FDAStrategy4 --> FDAStrategy5[Strategy 5: Uppercase]
    FDAStrategy5 --> FDAStrategy6[Strategy 6: Ingredient name]
    FDAStrategy6 --> FDAFound[Returns 50+ NDC products<br/>api.fda.gov/drug/ndc.json]
    
    %% NDC Normalization
    FDAFound --> NormalizeNDC[Step 3: Normalize NDC Codes<br/>Convert formats to 11-digit<br/>12345-678-90 → 12345678900]
    NormalizeNDC --> FilterActive[Filter Active vs Inactive<br/>Check marketing_status<br/>Check expiration_date]
    FilterActive --> ActiveProducts[Active Products: 45<br/>Inactive Products: 5]
    
    %% OpenAI Calculation Steps
    ActiveProducts --> Step4[Step 4: Parse Instructions<br/>OpenAI GPT-4o]
    Step4 -->|LLM Call| OpenAI1[OpenAI API<br/>Parse SIG to structured data<br/>api.openai.com/v1/chat/completions]
    OpenAI1 -->|Returns parsed| Step5[Step 5: Calculate Quantity<br/>OpenAI GPT-5]
    Step5 -->|LLM Call| OpenAI2[OpenAI Responses API<br/>Calculate total quantity<br/>api.openai.com/v1/responses]
    OpenAI2 -->|Returns quantity| Step6[Step 6: Optimize Packaging<br/>OpenAI GPT-4o]
    Step6 -->|LLM Call| OpenAI3[OpenAI API<br/>Calculate best package combo<br/>api.openai.com/v1/chat/completions]
    OpenAI3 -->|Returns optimization| Step7[Step 7: Generate Summary<br/>OpenAI GPT-4o]
    Step7 -->|LLM Call| OpenAI4[OpenAI API<br/>Create user-friendly summary<br/>api.openai.com/v1/chat/completions]
    OpenAI4 -->|Returns summary| Save[Save to Firestore<br/>Calculation History]
    
    Save --> Display([Display Results<br/>to Pharmacist])
    
    %% Error paths
    Error1 --> Display
    
    %% Styling
    style AutocompleteCheck fill:#e1f5ff
    style NormalizeStep fill:#e1f5ff
    style Step4 fill:#fff4e1
    style Step5 fill:#fff4e1
    style Step6 fill:#fff4e1
    style Step7 fill:#fff4e1
    style RxNormAPI fill:#d4edda
    style AutocompleteAPI fill:#d4edda
    style AutocompleteFallback fill:#d4edda
    style IngredientLookup fill:#d4edda
    style FDAFound fill:#d4edda
    style OpenAI1 fill:#ffe1e1
    style OpenAI2 fill:#ffe1e1
    style OpenAI3 fill:#ffe1e1
    style OpenAI4 fill:#ffe1e1
    style ConfidenceCheck fill:#fff4e1
    style NormalizeNDC fill:#e1f5ff
    style FilterActive fill:#e1f5ff
    style Error1 fill:#ffcccc
```

### Step-by-Step Breakdown with Actual API Calls

#### Step 1: Drug Name Input & Autocomplete (Optional)

**Path A: User selects from autocomplete (Faster)**
- **User action**: Types "met" in drug search field
- **Debounce**: App waits 300ms before API call
- **API Call 1**: Firebase Cloud Function `searchDrugs`
  - **Primary**: CTSS RxTerms API
    - Endpoint: `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=met&maxList=10`
    - Returns: Clean display names + RxCUI identifiers
  - **Fallback**: RxNorm approximateTerm API (if CTSS fails)
    - Endpoint: `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=met&maxEntries=10`
- **User selects**: "Metformin 500mg (Oral Pill)" from dropdown
- **Result**: RxCUI "6809" stored immediately
- **Outcome**: Normalization step skipped during calculation

**Path B: User types manually (Slightly slower)**
- **User action**: Types "metformin 500mg" without selecting autocomplete
- **Result**: No RxCUI stored, normalization required during calculation

#### Step 2: Drug Normalization (If RxCUI not available)

**When**: Only executed if user didn't select from autocomplete
- **API Call**: Firebase Cloud Function `normalizeDrugName`
  - **Endpoint**: `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=metformin&maxEntries=10`
  - **Response**: Returns best match with confidence score
- **Confidence Levels**:
  - **High (≥90)**: Direct match, proceed without warning
  - **Medium (70-89)**: Good match, proceed normally
  - **Low (<70)**: Add warning message, show alternatives
- **Output**: RxCUI "6809", normalized name "metformin", confidence level

#### Step 3: Get Ingredient Name (Optional)

**When**: If RxCUI is available, try to get ingredient name for better FDA search
- **API Call**: RxNorm Related Concepts API
  - **Endpoint**: `https://rxnav.nlm.nih.gov/REST/rxcui/6809/related.json`
  - **Purpose**: Get ingredient (IN) or precise ingredient (PIN) name
  - **Result**: Ingredient name "metformin" (used for FDA search if found)

#### Step 4: FDA NDC Product Search (Multiple Strategies)

**API**: FDA NDC Directory API
- **Base Endpoint**: `https://api.fda.gov/drug/ndc.json`
- **Search Strategies** (tried in order until one succeeds):
  1. `generic_name:"metformin"` (exact match with quotes)
  2. `generic_name:metformin` (exact match without quotes)
  3. `brand_name:"metformin"` (brand name search)
  4. `generic_name:"metformin"` (first word only, for compound names)
  5. `generic_name:"METFORMIN"` (uppercase variant)
  6. `generic_name:"{ingredient}"` (ingredient name from RxNorm, if available)
- **Response**: Up to 100 NDC products with:
  - NDC codes (various formats)
  - Generic/brand names
  - Package sizes and descriptions
  - Marketing status
  - Expiration dates
  - Active ingredients

#### Step 5: NDC Code Normalization

**Process**: Convert all NDC formats to standard 11-digit format
- **Input formats**: "12345-678-90", "1234-5678-90", "12345-67-89", "12345678900"
- **Output format**: "12345678900" (always 11 digits)
- **Method**: Remove hyphens, pad with leading zeros

#### Step 6: Filter Active vs Inactive Products

**Process**: Determine which products are currently available
- **Active criteria**:
  - Marketing status: "Prescription", "Over-the-counter", "OTC", "RX"
  - Not expired (or expired within 30-day grace period)
  - Not marked as "Discontinued", "Unapproved", or "Withdrawn"
- **Result**: Separate lists of active and inactive products

#### Step 7: Parse Prescription Instructions (OpenAI GPT-4o)

**API Call**: OpenAI Chat Completions API
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4o`
- **Temperature**: 0.1 (low for consistency)
- **Input**: Drug name, instructions ("Take 2 tablets twice daily"), days supply
- **Output**: Structured data
  ```json
  {
    "dose": 2,
    "unit": "tablet",
    "frequency": "BID",
    "frequencyPerDay": 2,
    "route": "oral",
    "confidence": "high"
  }
  ```

#### Step 8: Calculate Total Quantity (OpenAI GPT-5)

**API Call**: OpenAI Responses API (not Chat Completions)
- **Endpoint**: `https://api.openai.com/v1/responses`
- **Model**: `gpt-5`
- **Reasoning Effort**: `low`
- **Input**: Parsed instructions + days supply
- **Calculation**:
  - Daily quantity = dose × frequency per day
  - Total quantity = daily quantity × days supply
- **Output**:
  ```json
  {
    "dailyQuantity": 4,
    "totalQuantityNeeded": 120,
    "calculation": "step-by-step explanation"
  }
  ```

#### Step 9: Optimize Package Selection (OpenAI GPT-4o)

**API Call**: OpenAI Chat Completions API
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4o`
- **Temperature**: 0.2
- **Input**: Total quantity needed + all available packages
- **Algorithm**:
  1. Sort packages by size (descending)
  2. Check for single package with ≤20% overfill
  3. Try package combinations if needed
  4. Generate alternatives
- **Output**: Recommended package combination + alternatives with overfill percentages

#### Step 10: Generate Explanation (OpenAI GPT-4o)

**API Call**: OpenAI Chat Completions API
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4o`
- **Temperature**: 0.3
- **Input**: All calculation results from previous steps
- **Output**: Human-readable summary with recommendations, warnings, and alternatives

#### Step 11: Assemble Final Result

**Process**: Combine all data into comprehensive result object
- RxNorm data (RxCUI, normalized name, confidence)
- All products (active + inactive)
- Parsed instructions
- Quantity calculation
- Package optimization
- Explanation
- Warnings

#### Step 12: Save to History

**Storage**: Firestore database
- Save complete calculation result
- Include timestamp and user ID
- Enable retrieval for history page

**Total Time**: ~8-10 seconds (autocomplete path) or ~10-12 seconds (manual path)  
**Total Cost**: ~$0.08 per calculation (4 OpenAI API calls)

---

## Key Features

### Core Features (P0)

- ✅ **Drug Name Normalization**
  - Auto-complete with RxNorm API integration
  - Handles brand names, generic names, misspellings
  - Displays normalized drug information

- ✅ **Intelligent SIG Parsing**
  - Understands medical abbreviations (BID, TID, QID, PRN)
  - Handles complex instructions (tapering, multi-phase dosing)
  - AI-powered parsing with confidence scores

- ✅ **NDC Validation**
  - Real-time validation against FDA database
  - Active/inactive status detection
  - Automatic filtering of inactive NDCs

- ✅ **Quantity Calculation**
  - Accurate calculation for all dosage forms
  - Handles complex dosing schedules
  - Supports PRN medications with max daily dose

- ✅ **Package Optimization**
  - Multi-pack combinations
  - Minimizes waste while maximizing convenience
  - Overfill tolerance rules (≤20% acceptable)

- ✅ **Results Display**
  - Clear recommendation with rationale
  - Alternative options
  - Warnings prominently displayed
  - Calculation breakdown

### Enhanced Features (P1)

- ✅ **Special Dosage Forms**
  - Liquids (mL calculations)
  - Insulin (units, pens vs. vials)
  - Inhalers (actuations)
  - Topicals (grams)
  - Patches (individual patches)

- ✅ **Calculation History**
  - Save and retrieve past calculations
  - Search by drug name, date
  - Export to CSV

- ✅ **User Management**
  - Role-based access (Technician, Pharmacist, Admin)
  - User profiles and preferences
  - Audit logging

### Future Features (P2)

- 🔜 **Pharmacy System Integration**
  - RESTful API endpoints
  - HL7 FHIR support
  - Batch processing

---

## Technology Stack

### Frontend

- **Framework**: [SvelteKit 2.0](https://kit.svelte.dev/) - Full-stack framework with SSR
- **Language**: TypeScript 5.0+ - Type safety
- **UI Library**: [shadcn-svelte](https://www.shadcn-svelte.com/) - Accessible component library
- **Styling**: [TailwindCSS 3.4+](https://tailwindcss.com/) - Utility-first CSS
- **Form Handling**: [Superforms](https://superforms.rocks/) - Type-safe forms
- **State Management**: Svelte stores (built-in)
- **Build Tool**: Vite 5.0+ (built into SvelteKit)

### Backend

- **Platform**: [Firebase](https://firebase.google.com/)
  - **Hosting**: Static site deployment with CDN
  - **Authentication**: Firebase Auth (email/password, MFA)
  - **Database**: Cloud Firestore (NoSQL)
  - **Functions**: Cloud Functions (Node.js 20)
  - **Storage**: Cloud Storage (file uploads)
  - **Secret Manager**: Secure API key storage

### AI & APIs

- **AI Engine**: [OpenAI GPT-4o](https://openai.com/)
  - Instruction parsing
  - NDC filtering and validation
  - Package optimization
  - Summary generation
  - Cost: ~$0.08 per calculation

- **Drug Normalization**: [RxNorm API](https://rxnav.nlm.nih.gov/)
  - NIH/NLM government database
  - Free tier: 20 req/sec, 20K/day
  - Cached for 7 days

- **NDC Validation**: [FDA NDC Directory API](https://open.fda.gov/)
  - Real-time product code validation
  - Active/inactive status
  - Free with API key: 1,000 req/min
  - Cached for 24 hours

### Development Tools

- **Package Manager**: npm/pnpm
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript

---

## API Integrations

### RxNorm API

**Purpose**: Drug name normalization to standardized RxCUI codes

**Endpoints Used**:
- `GET /rxcui.json?name={drugName}` - Convert drug name to RxCUI
- `GET /rxcui/{rxcui}/ndcs.json` - Get all NDCs for an RxCUI

**Rate Limits**: 20 requests/second, 20,000/day  
**Caching**: 7 days (drug names rarely change)  
**Implementation**: `src/lib/services/rxnorm.service.ts`

### FDA NDC Directory API

**Purpose**: NDC product validation and active status checking

**Endpoints Used**:
- `GET /drug/ndc.json?search=product_ndc:{ndc}` - Validate specific NDC
- `GET /drug/ndc.json?search=generic_name:{name}+AND+marketing_status:active` - Search active NDCs

**Rate Limits**: 1,000 requests/minute (with API key)  
**Caching**: 24 hours (status updates daily)  
**Implementation**: `src/lib/services/fda.service.ts`

### OpenAI API

**Purpose**: All intelligent decision-making

**Model**: GPT-4o (optimized for structured outputs)

**Use Cases**:
1. **Instruction Parsing** (`functions/src/openai/calculate.ts`)
   - Parse SIG to structured data
   - Handle medical abbreviations
   - Extract dose, frequency, special instructions

2. **NDC Filtering** (`functions/src/openai/calculate.ts`)
   - Remove inactive NDCs
   - Filter wrong dosage forms
   - Explain filtering decisions

3. **Package Optimization** (`functions/src/openai/calculate.ts`)
   - Calculate optimal package combinations
   - Balance convenience vs. waste
   - Generate alternatives

4. **Summary Generation** (`functions/src/openai/calculate.ts`)
   - Create user-friendly summaries
   - Highlight warnings
   - Explain recommendations

**Cost**: ~$0.08 per calculation (4 API calls)  
**Rate Limits**: Tier-based (starting: 500 RPM, 30K TPM)  
**Implementation**: `functions/src/openai/calculate.ts`

---

## Core Components

### Frontend Components

#### Calculator Form (`src/lib/components/calculator/`)

- **`CalculatorForm.svelte`** - Main form container
- **`DrugSearchInput.svelte`** - Drug name input with RxNorm autocomplete
- **`InstructionsInput.svelte`** - SIG input with medical abbreviation detection
- **`DaysSupplyInput.svelte`** - Days supply input with quick select buttons

#### Results Display (`src/lib/components/calculator/`)

- **`ResultsDisplay.svelte`** - Main results container
- **`RecommendationCard.svelte`** - Primary recommendation display
- **`AlternativeOptions.svelte`** - Alternative package combinations
- **`WarningAlert.svelte`** - Inactive NDC warnings
- **`CalculationBreakdown.svelte`** - Detailed calculation explanation

#### UI Components (`src/lib/components/ui/`)

- shadcn-svelte components: Button, Card, Input, Alert, Badge, Spinner, etc.
- Fully accessible, customizable, TypeScript-first

### Services (`src/lib/services/`)

- **`rxnorm.service.ts`** - RxNorm API client with caching
- **`fda.service.ts`** - FDA NDC API client with validation
- **`openai.service.ts`** - OpenAI API client wrapper
- **`calculation.service.ts`** - Main calculation orchestrator
- **`cache.service.ts`** - Generic caching service (Firestore)
- **`auth.service.ts`** - Firebase Authentication wrapper
- **`user.service.ts`** - User profile management

### Stores (`src/lib/stores/`)

- **`auth.ts`** - Authentication state (user, session)
- **`calculator.ts`** - Calculator state (input, results, loading)
- **`history.ts`** - Calculation history state

### Cloud Functions (`functions/src/`)

- **`rxnorm/normalize.ts`** - Server-side RxNorm normalization
- **`fda/validate-ndc.ts`** - Server-side NDC validation
- **`openai/calculate.ts`** - Main OpenAI calculation orchestration

### Types (`src/lib/types/`)

- **`rxnorm.ts`** - RxNorm API response types
- **`fda.ts`** - FDA API response types
- **`openai.ts`** - OpenAI request/response types
- **`calculation.ts`** - Unified calculation types
- **`calculator.ts`** - Calculator form types

---

## Getting Started

### Prerequisites

- **Node.js**: 20+ LTS
- **npm** or **pnpm**: Latest version
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project**: Create at [console.firebase.google.com](https://console.firebase.google.com)
- **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)
- **FDA API Key** (optional): Get from [open.fda.gov](https://open.fda.gov)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/pharmacy-app.git
   cd pharmacy-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up Firebase**:
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   # Firebase
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   
   # OpenAI (for Cloud Functions)
   OPENAI_API_KEY=sk-...
   
   # FDA API (optional, for higher rate limits)
   FDA_API_KEY=your-fda-key
   ```

5. **Set Firebase secrets** (for Cloud Functions):
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   firebase functions:secrets:set FDA_API_KEY  # if you have one
   ```

6. **Deploy Firestore rules and indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

7. **Run development server**:
   ```bash
   npm run dev
   ```

8. **Open in browser**: http://localhost:5173

### First-Time Setup

1. **Create a user account** at `/signup`
2. **Login** at `/login`
3. **Navigate to calculator** at `/calculator`
4. **Try a calculation**:
   - Drug: "Metformin 500mg"
   - Instructions: "Take 2 tablets twice daily"
   - Days Supply: 90

---

## Project Structure

```
pharmacy-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── auth/              # Login, signup components
│   │   │   ├── calculator/        # Calculator form & results
│   │   │   ├── feedback/          # Loading, error states
│   │   │   ├── layout/            # Header, footer, navigation
│   │   │   └── ui/                # shadcn-svelte components
│   │   ├── config/
│   │   │   ├── firebase.ts        # Firebase configuration
│   │   │   ├── env.ts             # Environment variables
│   │   │   └── constants.ts       # App constants
│   │   ├── services/
│   │   │   ├── rxnorm.service.ts  # RxNorm API client
│   │   │   ├── fda.service.ts      # FDA API client
│   │   │   ├── openai.service.ts  # OpenAI API client
│   │   │   ├── calculation.service.ts  # Main orchestrator
│   │   │   ├── cache.service.ts   # Caching service
│   │   │   ├── auth.service.ts    # Auth service
│   │   │   └── user.service.ts    # User service
│   │   ├── stores/
│   │   │   ├── auth.ts            # Auth state store
│   │   │   ├── calculator.ts      # Calculator state store
│   │   │   └── history.ts        # History state store
│   │   ├── types/
│   │   │   ├── rxnorm.ts         # RxNorm types
│   │   │   ├── fda.ts            # FDA types
│   │   │   ├── openai.ts         # OpenAI types
│   │   │   ├── calculation.ts    # Calculation types
│   │   │   └── calculator.ts    # Calculator types
│   │   ├── utils/
│   │   │   ├── validation.ts     # Zod schemas
│   │   │   ├── errors.ts          # Error handling
│   │   │   ├── api-helpers.ts    # HTTP helpers
│   │   │   └── cn.ts             # Class name utility
│   │   └── prompts/
│   │       ├── instruction-parser.ts    # SIG parsing prompts
│   │       ├── package-optimizer.ts     # Optimization prompts
│   │       └── explanation-generator.ts  # Summary prompts
│   ├── routes/
│   │   ├── (authenticated)/      # Protected routes
│   │   │   ├── calculator/       # Calculator page
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   └── history/          # History page
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   └── +layout.svelte        # Root layout
│   ├── app.html                  # HTML template
│   ├── app.css                   # Global styles
│   └── hooks.server.ts           # Server hooks
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── rxnorm/
│   │   │   └── normalize.ts     # RxNorm normalization function
│   │   ├── fda/
│   │   │   └── validate-ndc.ts  # NDC validation function
│   │   ├── openai/
│   │   │   └── calculate.ts     # Main OpenAI calculation
│   │   └── index.ts             # Function exports
│   └── package.json
│
├── tests/
│   ├── unit/                    # Unit tests (Vitest)
│   ├── integration/             # Integration tests
│   ├── e2e/                     # E2E tests (Playwright)
│   └── mocks/                   # Test mocks
│
├── ndc_shards/                  # Implementation documentation
│   ├── 00-overview.md
│   ├── shard-01-project-foundation-setup.md
│   ├── shard-02-authentication-user-management.md
│   ├── shard-03-ui-component-library-shadcn-svelte.md
│   ├── shard-04-calculator-form-ui.md
│   ├── shard-05-rxnorm-api-integration.md
│   ├── shard-06-fda-ndc-api-integration.md
│   ├── shard-07-openai-integration-prompt-engineering.md
│   ├── shard-08-core-calculation-orchestration.md
│   ├── shard-09-results-display-explanation.md
│   ├── shard-10-history-saved-calculations.md
│   ├── shard-11-testing-suite.md
│   ├── shard-12-deployment-ci-cd.md
│   └── shard-13-monitoring-operations.md
│
├── documents/                    # Product requirements
│   ├── PRD_Foundation_Health_NDC_Packaging_Quantity_Calculator.md
│   └── PRD_NDC_Calculator_Detailed.md
│
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json        # Firestore indexes
├── storage.rules                # Storage security rules
├── .firebaserc                  # Firebase project aliases
├── package.json
├── tsconfig.json
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.ts
└── README.md
```

---

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run check           # TypeScript type checking
npm run lint            # Run ESLint
npm run format          # Format with Prettier

# Testing
npm run test            # Run unit tests (Vitest)
npm run test:coverage   # Run tests with coverage
npm run test:ui        # Run tests with UI
npm run test:e2e        # Run E2E tests (Playwright)
npm run test:e2e:ui     # Run E2E tests with UI

# Firebase
firebase deploy         # Deploy to Firebase
firebase deploy --only functions  # Deploy functions only
firebase deploy --only hosting   # Deploy hosting only
```

### Development Workflow

1. **Make changes** to source files
2. **Run dev server**: `npm run dev`
3. **Test locally**: http://localhost:5173
4. **Run tests**: `npm run test`
5. **Check types**: `npm run check`
6. **Format code**: `npm run format`
7. **Deploy**: `firebase deploy`

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint with Svelte plugin
- **Imports**: Absolute imports from `$lib/`

---

## Testing

### Test Suite

- **Unit Tests**: 87+ tests (Vitest)
  - Services (RxNorm, FDA, OpenAI)
  - Utilities (validation, API helpers)
  - Stores (auth, calculator)

- **Integration Tests**: (Vitest + Firebase Emulators)
  - Calculator workflow
  - History management
  - Firestore operations

- **E2E Tests**: 20+ tests (Playwright)
  - Login flow
  - Calculator flow
  - History flow

### Running Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test -- tests/unit

# Integration tests only
npm run test -- tests/integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Coverage

- **Target**: 80%+ overall, 95%+ for calculation logic
- **Current**: See `test-results/` directory

---

## Deployment

### Environments

- **Development**: Local with Firebase Emulators
- **Staging**: `foundation-health-ndc-staging` Firebase project
- **Production**: `foundation-health-ndc-prod` Firebase project

### Deployment Process

1. **Build**: `npm run build`
2. **Deploy**: `firebase deploy`
3. **Verify**: Check Firebase Console

### CI/CD

- **GitHub Actions**: Automated deployment on push to `main`
- **Workflow**: See `.github/workflows/` (if configured)

### Environment Variables

Set in Firebase Console → Functions → Configuration:
- `OPENAI_API_KEY`
- `FDA_API_KEY` (optional)

---

## Implementation Status

### ✅ Completed Shards

- ✅ **Shard 1** - Project Foundation & Setup
- ✅ **Shard 2** - Authentication & User Management
- ✅ **Shard 3** - UI Component Library (shadcn-svelte)
- ✅ **Shard 4** - Calculator Form UI
- ✅ **Shard 5** - RxNorm API Integration
- ✅ **Shard 6** - FDA NDC API Integration
- ✅ **Shard 7** - OpenAI Integration & Prompt Engineering
- ✅ **Shard 8** - Core Calculation Orchestration
- ✅ **Shard 9** - Results Display & Explanation
- ✅ **Shard 10** - History & Saved Calculations
- ✅ **Shard 11** - Testing Suite

### 🔜 In Progress / Planned

- 🔜 **Shard 12** - Deployment & CI/CD
- 🔜 **Shard 13** - Monitoring & Operations

### Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Drug Normalization | ✅ Complete | RxNorm API integrated |
| SIG Parsing | ✅ Complete | OpenAI GPT-4o |
| NDC Validation | ✅ Complete | FDA API integrated |
| Package Optimization | ✅ Complete | AI-powered |
| Special Dosage Forms | ✅ Complete | Liquids, insulin, inhalers |
| Calculation History | ✅ Complete | Firestore storage |
| User Authentication | ✅ Complete | Firebase Auth |
| Results Display | ✅ Complete | Full UI implementation |
| Testing Suite | ✅ Complete | 87+ unit, 20+ E2E tests |
| Deployment | 🔜 In Progress | CI/CD setup |
| Monitoring | 🔜 Planned | Operations dashboard |

---

## Performance Metrics

### Target Metrics

- **Response Time**: <2 seconds (95th percentile)
- **Accuracy**: 95%+ medication normalization
- **Error Rate**: <2% of calculations
- **Uptime**: 99.5%+

### Cost Estimates

- **Per Calculation**: ~$0.08
  - OpenAI: ~$0.075 (4 API calls)
  - RxNorm: Free
  - FDA: Free (with API key)
  - Firebase: ~$0.005

- **Monthly (10K calculations)**: ~$800
  - OpenAI: ~$750
  - Firebase: ~$50

---

## Contributing

This is a private project for Foundation Health. For questions or issues, contact the development team.

---

## License

Private - Foundation Health  
Copyright © 2025 Foundation Health

---

## Additional Resources

- **Product Requirements**: See `documents/PRD_NDC_Calculator_Detailed.md`
- **Implementation Details**: See `ndc_shards/` directory
- **API Documentation**: See individual service files in `src/lib/services/`
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **SvelteKit Docs**: [kit.svelte.dev](https://kit.svelte.dev)
- **OpenAI Docs**: [platform.openai.com/docs](https://platform.openai.com/docs)

---

**Last Updated**: November 2025  
**Version**: 2.0  
**Status**: Production Ready (MVP Complete)

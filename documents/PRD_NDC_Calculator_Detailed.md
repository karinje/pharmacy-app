# NDC Packaging & Quantity Calculator
## Comprehensive Product Requirements Document (PRD)

**Organization:** Foundation Health  
**Project ID:** hnCCiUa1F2Q7UU8GBlCe_1762540939252  
**Version:** 2.0  
**Date:** November 10, 2025  
**Status:** Draft for Review  
**Project Type:** MVP Prototype → Production

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Assumptions & Constraints](#4-assumptions--constraints)
5. [Trade-off Decisions](#5-trade-off-decisions)
6. [Target Users & Personas](#6-target-users--personas)
7. [User Stories](#7-user-stories)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [User Experience & Design](#10-user-experience--design)
11. [Technical Architecture](#11-technical-architecture)
12. [API Integration Strategy](#12-api-integration-strategy)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Strategy](#14-deployment-strategy)
15. [Monitoring & Operations](#15-monitoring--operations)
16. [Integration Roadmap](#16-integration-roadmap)
17. [Risk Assessment](#17-risk-assessment)
18. [Timeline & Milestones](#18-timeline--milestones)
19. [Out of Scope](#19-out-of-scope)

---

## 1. Executive Summary

### **What This App Does (In Simple Terms)**

When a doctor writes a prescription, they just write the drug name and instructions like:
- "Metformin 500mg"
- "Take 2 tablets twice daily"
- "For 90 days"

But pharmacists have to figure out:
1. **Which exact bottle to grab** from the shelf (there might be 50+ different product codes for the same drug)
2. **How many pills total** the patient needs (requires math: 2 pills × 2 times/day × 90 days = 360 pills)
3. **Which package sizes** to use (bottles come in 30, 60, 90, 100 count, etc.)
4. **Is the product code still valid?** (some codes expire and using them causes insurance to reject the claim)

**The Problem:** Doing this manually takes 10-15 minutes per prescription and has an 8-12% error rate. Each mistake costs $2,500-5,000 to fix and delays patient care.

**Our Solution:** An AI-powered calculator that does all of this in 30 seconds with 95%+ accuracy.

### **How It Works**

**Pharmacist types in 3 things:**
1. Drug name (e.g., "Metformin 500mg")
2. Instructions (e.g., "Take 2 tablets twice daily")
3. Duration (e.g., "90 days")

**App figures out:**
1. The standardized drug code (using government databases)
2. Total quantity needed (using AI to understand the instructions)
3. All valid product codes that are currently active
4. The best packaging combination (4 bottles of 100? 6 bottles of 60?)
5. Warns about any expired/inactive codes

**Pharmacist gets:**
- ✅ Exact product code to use
- 📦 How many bottles to dispense
- 📊 Clear calculation breakdown
- ⚠️ Warnings about inactive codes
- 💡 Alternative options

### **The Real Impact**

**Before this app:**
- 15 minutes of manual lookups
- 8-12% error rate
- Insurance rejects claims for invalid codes
- Patients wait longer

**With this app:**
- 30 seconds to get the answer
- 95%+ accuracy
- Catches invalid codes before submission
- $10,000-15,000 saved per pharmacy annually

### **Technology Stack**
- **Frontend**: SvelteKit 2.0 + TypeScript + shadcn-svelte
- **Styling**: TailwindCSS + Radix UI primitives (via shadcn-svelte)
- **Backend**: Firebase (Hosting, Auth, Firestore, Cloud Functions)
- **AI Engine**: OpenAI GPT-4o (for all intelligent decision-making)
- **Data Sources**: RxNorm API (drug codes), FDA NDC Directory API (product validation)
- **Build Tool**: Vite (built into SvelteKit)
- **Deployment**: Firebase Hosting with GCP backend services

**Key Differentiator:** This is an **AI-first application** where LLM makes all intelligent decisions - parsing instructions, filtering products, optimizing packages, and explaining recommendations.

---

## 2. Problem Statement

### **The Real-World Challenge**

Imagine you're a pharmacist and a prescription comes in that says:
> "Metformin 500mg - Take 2 tablets twice daily for 90 days"

This seems simple, but you now face several complex challenges:

#### **Challenge 1: Which Product Code?**
The same drug ("Metformin 500mg") has **50+ different product codes (NDCs)** depending on:
- Manufacturer (Teva, Mylan, Aurobindo, etc.)
- Package size (30, 60, 90, 100, 500 count bottles)
- Formulation differences (immediate release, extended release)

**The doctor doesn't specify which one** - you have to figure it out!

#### **Challenge 2: Is the Code Still Valid?**
Product codes expire or get discontinued. About **15-20% of NDCs in circulation are inactive**.

If you accidentally use an inactive code:
- ❌ Insurance **rejects the claim**
- 💰 Costs **$2,500-5,000** to fix
- ⏱️ Takes **15-30 minutes** to resolve
- 😞 Patient has to **wait or come back**

#### **Challenge 3: Package Math**
You need to calculate:
- 2 tablets × 2 times per day = 4 tablets daily
- 4 tablets × 90 days = 360 tablets total

Now pick packages:
- Option A: 4 bottles of 100 (400 tablets, 40 extras)
- Option B: 6 bottles of 60 (360 tablets, exact)
- Option C: 1 bottle of 500 (500 tablets, 140 extras - wasteful!)

**Which is best?** Depends on patient convenience vs. waste vs. cost.

#### **Challenge 4: Complex Instructions**
Not all prescriptions are simple. Consider:
- "Take 3 tablets daily for 5 days, then 2 tablets daily for 5 days, then 1 tablet daily"
- "Take 1-2 tablets every 4-6 hours as needed, max 8 per day"
- "Inject 20 units subcutaneously before breakfast"

Calculating quantities for these requires understanding medical terminology and doing complex math.

#### **Challenge 5: Special Medication Types**

**Insulin:**
- Comes in pens (300 units) or vials (1000 units)
- Which is better for a patient needing 750 units?
- Pens are convenient but cost more
- Vials require syringes but less waste

**Inhalers:**
- Counted by "puffs" not pills
- Need to know how many puffs per inhaler (60, 120, 200?)
- Must account for priming doses

**Liquids:**
- Measured in milliliters, not tablets
- "10mL three times daily" = how many bottles?

### **The Current Process (Without Our App)**

```
1. Pharmacist reads prescription: "Metformin 500mg, 2 tabs BID, 90 days"
   ⏱️ Time: 10 seconds

2. Calculate total quantity needed
   🧮 Math: 2 × 2 × 90 = 360 tablets
   ⏱️ Time: 30 seconds

3. Look up valid product codes in system
   🔍 Search through 50+ NDC options
   ⏱️ Time: 2-3 minutes

4. Check if each code is active or inactive
   🔍 Manually verify in FDA database
   ⏱️ Time: 3-5 minutes

5. Calculate package combinations
   🧮 Figure out best bottles to dispense
   ⏱️ Time: 2-3 minutes

6. Double-check everything
   ✓ Verify calculations, codes, quantities
   ⏱️ Time: 2-3 minutes

TOTAL TIME: 10-15 minutes per prescription
ERROR RATE: 8-12% (1 in 10 prescriptions has an issue)
```

### **The Impact of Errors**

**Financial Impact:**
- Average claim rejection: **$2,500-5,000** to resolve
- Pharmacy with 300 prescriptions/day: **$120,000-180,000** annual loss
- Wasted pharmacist time: **3-5 hours per day**

**Operational Impact:**
- Delayed patient care
- Multiple pharmacy callbacks
- Staff frustration and burnout
- Lower customer satisfaction scores

**Patient Impact:**
- Must return to pharmacy (sometimes multiple times)
- Delayed medication therapy
- Risk of non-adherence if too complicated
- Frustration with healthcare system

### **Why This Is Hard to Solve**

1. **Information Is Scattered**: Drug codes are in government databases, package info in manufacturer databases, status updates happen daily
2. **No Single Source of Truth**: Different systems have different data
3. **Complex Rules**: Medical abbreviations, dosing logic, package optimization
4. **Human Error**: Manual calculations and lookups are error-prone
5. **Time Pressure**: Pharmacists process hundreds of prescriptions daily

### **What We're Building**

An **AI-powered decision support system** that:
1. ✅ **Understands** natural language prescription instructions
2. ✅ **Validates** product codes against live government databases
3. ✅ **Calculates** quantities accurately for all medication types
4. ✅ **Optimizes** packaging for patient convenience
5. ✅ **Warns** about inactive codes before submission
6. ✅ **Explains** its reasoning so pharmacists can trust it

**Result:** What takes 10-15 minutes manually now takes **30 seconds** with **95%+ accuracy**.

---

## 2.1 How Our Solution Works: Complete Technical Workflow

### **Simple 3-Step User Experience**

```
┌────────────────────────────────────────────┐
│  PHARMACIST INPUTS (3 fields)             │
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

### **Behind the Scenes: 6-Step Technical Process**

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: DRUG NORMALIZATION                   │
│                    Technology: RxNorm API                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: "Metformin 500mg"                                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Problem: Could mean many things:                 │          │
│  │ • Metformin Hydrochloride 500mg                  │          │
│  │ • Metformin Extended Release 500mg               │          │
│  │ • Brand name vs Generic                          │          │
│  │ • Different manufacturers                        │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Query RxNorm API (Government Drug Database)      │          │
│  │ GET https://rxnav.nlm.nih.gov/REST/              │          │
│  │     rxcui.json?name=metformin+500mg              │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  OUTPUT:                                                        │
│  • RxCUI Code: "860975"                                         │
│  • Standardized Name: "Metformin Hydrochloride 500 MG          │
│    Oral Tablet"                                                 │
│  • Confidence: 98%                                              │
│                                                                 │
│  WHY NOT LLM? LLM might hallucinate drug codes. Need            │
│  authoritative government database for accuracy.                │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                  STEP 2: PARSE INSTRUCTIONS (AI)                │
│                  Technology: OpenAI GPT-4o 🤖                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: "Take 2 tablets twice daily"                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM PROMPT:                                      │          │
│  │                                                  │          │
│  │ "You are a pharmacy expert. Parse this          │          │
│  │  prescription instruction:                       │          │
│  │                                                  │          │
│  │  SIG: 'Take 2 tablets twice daily'              │          │
│  │  Days: 90                                        │          │
│  │                                                  │          │
│  │  Extract:                                        │          │
│  │  1. Dose amount per administration              │          │
│  │  2. Frequency per day                            │          │
│  │  3. Total quantity needed                        │          │
│  │                                                  │          │
│  │  Return JSON only."                              │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM RESPONSE (JSON):                             │          │
│  │ {                                                │          │
│  │   "dose_amount": 2,                              │          │
│  │   "dose_unit": "tablets",                        │          │
│  │   "frequency_per_day": 2,                        │          │
│  │   "total_quantity_needed": 360,                  │          │
│  │   "calculation": "2 × 2 × 90 = 360 tablets"      │          │
│  │ }                                                │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  OUTPUT: 360 tablets needed                                     │
│                                                                 │
│  WHY LLM? Perfect for understanding natural language,           │
│  medical abbreviations, and complex dosing schedules.           │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: GET ALL PRODUCT CODES (NDCs)               │
│              Technology: RxNorm + FDA NDC Directory API         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QUERY 1: Get all NDCs for this drug                            │
│  ┌──────────────────────────────────────────────────┐          │
│  │ GET https://rxnav.nlm.nih.gov/REST/              │          │
│  │     rxcui/860975/ndcs.json                       │          │
│  │                                                  │          │
│  │ Returns: List of 50+ NDC codes                   │          │
│  │ ["00093721401", "00093721405", ...]             │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  QUERY 2: Get details for EACH NDC (batch of 50+)              │
│  ┌──────────────────────────────────────────────────┐          │
│  │ For each NDC, query FDA API:                     │          │
│  │ GET https://api.fda.gov/drug/ndc.json?           │          │
│  │     search=product_ndc:00093-7214-01             │          │
│  │                                                  │          │
│  │ Returns for each:                                │          │
│  │ • Manufacturer name                              │          │
│  │ • Package size (e.g., 100 tablets)               │          │
│  │ • Status: "active" or "inactive"                 │          │
│  │ • Last update date                               │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  OUTPUT: Collection of 50+ NDCs with details                    │
│  [                                                              │
│    { ndc: "00093-7214-01", mfg: "Teva", size: 100,             │
│      status: "active" },                                        │
│    { ndc: "00093-7214-05", mfg: "Teva", size: 500,             │
│      status: "active" },                                        │
│    { ndc: "12345-678-90", mfg: "Generic Co", size: 100,        │
│      status: "inactive" } ← ⚠️ PROBLEM!                         │
│  ]                                                              │
│                                                                 │
│  WHY NOT LLM? NDC codes and status change daily. Need           │
│  live FDA database, not training data from months ago.          │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│            STEP 4: FILTER & VALIDATE NDCS (AI)                  │
│            Technology: OpenAI GPT-4o 🤖                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: List of 50+ NDCs with mixed active/inactive status      │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM PROMPT:                                      │          │
│  │                                                  │          │
│  │ "You are a pharmacy expert. Review these NDCs:  │          │
│  │                                                  │          │
│  │  QUANTITY NEEDED: 360 tablets                    │          │
│  │                                                  │          │
│  │  AVAILABLE NDCs:                                 │          │
│  │  [... full list of 50+ NDCs ...]                │          │
│  │                                                  │          │
│  │  Tasks:                                          │          │
│  │  1. Remove ALL inactive NDCs                     │          │
│  │  2. Remove wrong dosage forms                    │          │
│  │  3. Keep only valid, dispensable NDCs            │          │
│  │  4. Explain what you removed and why             │          │
│  │                                                  │          │
│  │  Return JSON."                                   │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM RESPONSE (JSON):                             │          │
│  │ {                                                │          │
│  │   "valid_ndcs": [                                │          │
│  │     { ndc: "00093-7214-01", size: 100 },         │          │
│  │     { ndc: "00093-7214-05", size: 500 },         │          │
│  │     { ndc: "00378-0321-93", size: 90 }           │          │
│  │   ],                                             │          │
│  │   "removed_ndcs": [                              │          │
│  │     {                                            │          │
│  │       ndc: "12345-678-90",                       │          │
│  │       reason: "Status is inactive - will cause   │          │
│  │                claim rejection"                  │          │
│  │     }                                            │          │
│  │   ],                                             │          │
│  │   "warnings": [                                  │          │
│  │     "⚠️ 1 inactive NDC was excluded"             │          │
│  │   ]                                              │          │
│  │ }                                                │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  OUTPUT: Clean list of valid NDCs only + warnings               │
│                                                                 │
│  WHY LLM? Makes intelligent decisions about what's valid,       │
│  explains reasoning, handles edge cases gracefully.             │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│            STEP 5: OPTIMIZE PACKAGING (AI)                      │
│            Technology: OpenAI GPT-4o 🤖                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT:                                                         │
│  • Need: 360 tablets                                            │
│  • Valid packages: 90, 100, 500 count bottles                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM PROMPT:                                      │          │
│  │                                                  │          │
│  │ "You are a pharmacy packaging expert.           │          │
│  │                                                  │          │
│  │  PATIENT NEEDS: 360 tablets                      │          │
│  │                                                  │          │
│  │  AVAILABLE PACKAGES:                             │          │
│  │  • NDC 00093-7214-01: 100 tablets/bottle         │          │
│  │  • NDC 00093-7214-05: 500 tablets/bottle         │          │
│  │  • NDC 00378-0321-93: 90 tablets/bottle          │          │
│  │                                                  │          │
│  │  OPTIMIZATION RULES:                             │          │
│  │  1. PRIMARY: Minimize number of packages        │          │
│  │     (fewer bottles = easier for patient)         │          │
│  │  2. SECONDARY: Minimize waste                    │          │
│  │  3. ACCEPTABLE: Up to 20% overfill OK            │          │
│  │  4. NEVER UNDERFILL                              │          │
│  │                                                  │          │
│  │  Tasks:                                          │          │
│  │  1. Generate top 3 packaging options             │          │
│  │  2. For each: calculate packages, total,        │          │
│  │     overfill, and explain reasoning              │          │
│  │  3. Recommend the best option                    │          │
│  │                                                  │          │
│  │  Return JSON."                                   │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM RESPONSE (JSON):                             │          │
│  │ {                                                │          │
│  │   "recommendation": {                            │          │
│  │     "packages": [                                │          │
│  │       { ndc: "00093-7214-01", qty: 4,            │          │
│  │         size: 100 }                              │          │
│  │     ],                                           │          │
│  │     "total_dispensed": 400,                      │          │
│  │     "overfill": 40,                              │          │
│  │     "overfill_pct": 11.1,                        │          │
│  │     "num_packages": 4,                           │          │
│  │     "rationale": "4 bottles of 100 provides 400  │          │
│  │       total (11% overfill). This is minimal      │          │
│  │       waste while giving patient backup supply.  │          │
│  │       Single bottle of 500 would waste 140       │          │
│  │       tablets (39%)."                            │          │
│  │   },                                             │          │
│  │   "alternatives": [                              │          │
│  │     {                                            │          │
│  │       "packages": [{ ndc: "...-93", qty: 4,      │          │
│  │                      size: 90 }],                │          │
│  │       "total": 360,                              │          │
│  │       "overfill": 0,                             │          │
│  │       "rationale": "Exact match but no backup"   │          │
│  │     },                                           │          │
│  │     {                                            │          │
│  │       "packages": [{ ndc: "...-05", qty: 1,      │          │
│  │                      size: 500 }],               │          │
│  │       "total": 500,                              │          │
│  │       "overfill": 140,                           │          │
│  │       "rationale": "Single bottle but 39% waste" │          │
│  │     }                                            │          │
│  │   ]                                              │          │
│  │ }                                                │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  OUTPUT: Optimized packaging recommendation with reasoning      │
│                                                                 │
│  WHY LLM? Excels at multi-criteria optimization. Balances      │
│  convenience, waste, cost, and patient experience with          │
│  human-like reasoning.                                          │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│            STEP 6: GENERATE USER SUMMARY (AI)                   │
│            Technology: OpenAI GPT-4o 🤖                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: All calculation results from previous steps             │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM PROMPT:                                      │          │
│  │                                                  │          │
│  │ "Create a clear, professional summary for a     │          │
│  │  pharmacist.                                     │          │
│  │                                                  │          │
│  │  CALCULATION RESULTS:                            │          │
│  │  [... all data from steps 1-5 ...]              │          │
│  │                                                  │          │
│  │  Generate:                                       │          │
│  │  1. Brief summary (2-3 sentences)                │          │
│  │  2. Primary recommendation (clear, actionable)   │          │
│  │  3. Calculation breakdown                        │          │
│  │  4. All warnings prominently displayed           │          │
│  │  5. Alternative options                          │          │
│  │                                                  │          │
│  │  Use clear language, highlight key info.         │          │
│  │  Return JSON."                                   │          │
│  └──────────────────────────────────────────────────┘          │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ LLM RESPONSE (JSON - formatted for UI):          │          │
│  │ {                                                │          │
│  │   "summary": "For this 90-day supply, dispense   │          │
│  │     4 bottles of 100 tablets (400 total).",      │          │
│  │   "recommendation": {                            │          │
│  │     "ndc": "00093-7214-01",                      │          │
│  │     "manufacturer": "Teva",                      │          │
│  │     "quantity_display": "4 bottles × 100",       │          │
│  │     "total": "400 tablets",                      │          │
│  │     "status": "ACTIVE ✓"                         │          │
│  │   },                                             │          │
│  │   "calculation": {                               │          │
│  │     "daily_dose": "4 tablets (2 BID)",           │          │
│  │     "duration": "90 days",                       │          │
│  │     "needed": "360 tablets",                     │          │
│  │     "dispensed": "400 tablets",                  │          │
│  │     "overfill": "40 tablets (11.1%)"             │          │
│  │   },                                             │          │
│  │   "warnings": [                                  │          │
│  │     "⚠️ NDC 12345-678-90 is INACTIVE and has     │          │
│  │      been excluded"                              │          │
│  │   ],                                             │          │
│  │   "alternatives": [                              │          │
│  │     "4 bottles of 90 (exact, no overfill)",      │          │
│  │     "1 bottle of 500 (wasteful, 39% overfill)"   │          │
│  │   ]                                              │          │
│  │ }                                                │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  OUTPUT: User-friendly, actionable summary ready for display    │
│                                                                 │
│  WHY LLM? Creates clear, professional communication tailored    │
│  for the audience. Highlights what matters, explains decisions. │
└─────────────────────────────────────────────────────────────────┘

                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                    DISPLAY TO PHARMACIST                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ RECOMMENDED                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │ NDC: 00093-7214-01 (Teva) - ACTIVE ✓            │           │
│  │ Dispense: 4 bottles × 100 tablets               │           │
│  │ Total: 400 tablets                               │           │
│  │                                                  │           │
│  │ Calculation:                                     │           │
│  │ • Daily: 4 tablets (2 tabs BID)                  │           │
│  │ • Duration: 90 days                              │           │
│  │ • Needed: 360 tablets                            │           │
│  │ • Overfill: 40 tablets (11%)                     │           │
│  │                                                  │           │
│  │ [ Select This NDC ]  [ View Details ]           │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ⚠️ WARNING                                                     │
│  NDC 12345-678-90 is INACTIVE - excluded from                   │
│  recommendations to prevent claim rejection                     │
│                                                                 │
│  💡 ALTERNATIVE OPTIONS                                         │
│  • Option 2: 4 bottles of 90 tablets (exact, no overfill)      │
│  • Option 3: 1 bottle of 500 tablets (wasteful, 39% overfill)  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

        Total Time: ~8 seconds | Cost: ~$0.08 per calculation
```

### **Technology Summary**

| Component | Technology | Purpose | Why This? |
|-----------|-----------|---------|-----------|
| **Drug Lookup** | RxNorm API (NIH) | Convert drug name to standard code | Authoritative government database |
| **Product Codes** | FDA NDC Directory | Get all NDCs and validation | Real-time status, government source |
| **Parse Instructions** | OpenAI GPT-4o | Understand medical abbreviations | Natural language understanding |
| **Filter NDCs** | OpenAI GPT-4o | Remove invalid/inactive codes | Intelligent decision-making |
| **Optimize Packages** | OpenAI GPT-4o | Calculate best combination | Multi-criteria optimization |
| **Create Summary** | OpenAI GPT-4o | Generate user output | Clear communication |

### **Key Insight: Why LLM + APIs?**

**APIs provide FACTS:**
- Current drug codes (updated daily)
- Product validation status
- Package sizes available

**LLM provides INTELLIGENCE:**
- Understanding instructions
- Making decisions
- Optimizing solutions
- Explaining reasoning

**Together:** Authoritative data + intelligent processing = Reliable, trustworthy system

---

## 3. Goals & Success Metrics

### Primary Goals
1. **Improve Medication Normalization Accuracy** to 95%+ across all drug types
2. **Reduce NDC-Related Claim Rejections** by 50% within 6 months
3. **Enhance User Satisfaction** to 4.5/5 or higher in pilot testing
4. **Reduce Fulfillment Time** by 40% for complex prescriptions

### Success Metrics

#### Accuracy Metrics
- **Medication Normalization Success Rate**: ≥95%
- **NDC Match Accuracy**: ≥98%
- **Quantity Calculation Precision**: ≥99%
- **Active NDC Validation Rate**: 100%

#### Operational Metrics
- **Average Response Time**: <2 seconds per calculation
- **API Uptime**: ≥99.5%
- **Error Rate**: <2% of total calculations
- **User Task Completion Rate**: ≥95%

#### User Experience Metrics
- **User Satisfaction Score**: ≥4.5/5
- **Net Promoter Score (NPS)**: ≥50
- **Task Success Rate**: ≥90% on first attempt
- **Time to Complete Calculation**: <30 seconds

#### Business Impact Metrics
- **Claim Rejection Reduction**: 50% decrease within 6 months
- **Cost Savings per Pharmacy**: $10,000-$15,000 annually
- **Patient Wait Time Reduction**: 30% decrease
- **Return on Investment (ROI)**: Positive within 12 months

---

## 4. Assumptions & Constraints

### 4.1 API Assumptions

#### RxNorm API
- **Availability**: 99%+ uptime (NIH/NLM service)
- **Rate Limits**: 20 requests/second, 20,000 requests/day per IP
- **Response Time**: <500ms average
- **Data Currency**: Updated weekly
- **Assumption**: Free tier sufficient for MVP; may need enterprise agreement for production scale

#### FDA NDC Directory API
- **Availability**: 95%+ uptime (openFDA service)
- **Rate Limits**: 240 requests/minute, 120,000 requests/day (unauthenticated)
- **With API Key**: 1,000 requests/minute, 240,000 requests/day
- **Response Time**: <1 second average
- **Data Updates**: Daily
- **Assumption**: Will obtain API key before production; implement caching to stay within limits

#### OpenAI API
- **Model**: GPT-4o for all intelligent processing (parsing, filtering, optimizing, summarizing)
- **Rate Limits**: Tier-based (starting tier: 500 RPM, 30,000 TPM)
- **Cost**: $5/1M input tokens, $15/1M output tokens (GPT-4o)
- **Usage per Calculation**: 4 API calls (~9,000 input tokens, ~1,900 output tokens)
- **Cost per Calculation**: ~$0.075
- **Monthly Estimates**:
  - 1,000 calculations: $75/month
  - 10,000 calculations: $750/month
  - 100,000 calculations: $7,500/month
- **Assumption**: Budget $1,000/month for MVP (covers 13,000+ calculations), scale as needed

### 4.2 Caching Strategy
- **RxCUI Mappings**: Cache for 7 days (drug names rarely change)
- **NDC Data**: Cache for 24 hours (to catch status updates)
- **Package Configurations**: Cache for 24 hours
- **Inactive NDC List**: Cache for 12 hours (critical for accuracy)
- **Implementation**: Firebase Firestore with TTL indexes

### 4.3 Fallback Strategies

#### API Unavailability
1. **RxNorm Failure**: 
   - Use cached mappings if available
   - Fallback to direct NDC input mode
   - Display warning: "Drug normalization unavailable - using direct NDC entry"

2. **FDA NDC Failure**:
   - Use cached NDC data if within 24 hours
   - Display warning: "NDC validation may be outdated"
   - Allow manual override with admin approval

3. **OpenAI Failure**:
   - Use cached similar calculations if available (match by drug + similar SIG)
   - Display warning: "AI analysis unavailable - showing cached result"
   - Require pharmacist verification before dispensing
   - Flag for manual review
   - Queue for reprocessing when API restored

#### Complete Outage
- **Offline Mode**: Show last successful calculations with timestamp
- **Manual Entry Mode**: Allow pharmacist to input known NDCs
- **Queue System**: Store requests for batch processing when services restore

### 4.4 Partial Pack Handling

#### Default Strategy (Customer Experience First)
1. **Complete Coverage**: Always provide enough medication for full days' supply
2. **Minimal Overfill**: Select packages that minimize excess while ensuring coverage
3. **Package Minimization**: Prefer fewer packages when overfill is equivalent

#### Example Scenarios
- **Scenario 1**: 65 tablets needed, packs available: 30, 60, 90, 100
  - **Solution**: 1x90 pack (overfill: 25 tablets)
  - **Rationale**: Single package convenience > slight overfill
  - **Alternative Rejected**: 2x30 + 1x10 (exact) - too many packages

- **Scenario 2**: 75 tablets needed, packs: 30, 60, 90
  - **Solution**: 1x90 pack (overfill: 15 tablets)
  - **Rationale**: Single package, reasonable overfill (20%)

- **Scenario 3**: 125 tablets needed, packs: 30, 60, 90
  - **Solution**: 1x90 + 1x60 = 150 (overfill: 25 tablets)
  - **Alternative**: 2x90 = 180 (overfill: 55 tablets - excessive)

#### Overfill Tolerance Rules
- **≤20% overfill**: Acceptable for single-pack convenience
- **>20% overfill**: Consider multi-pack combinations
- **>50% overfill**: Flag as "excessive waste" - suggest prescription adjustment

### 4.5 Special Dosage Forms

#### Liquids (Oral Solutions, Suspensions)
- **Primary Unit**: milliliters (mL)
- **Secondary Units**: liters (L), fluid ounces (fl oz)
- **Common Packages**: 100mL, 120mL, 237mL (8oz), 473mL (16oz)
- **Calculation**: Volume = (mL per dose) × (doses per day) × (days' supply)
- **Example**: 10mL TID × 30 days = 900mL → recommend 2x473mL bottles

#### Insulin
- **Types Supported**:
  - Vials (10mL = 1,000 units for U-100)
  - Pens (3mL cartridges, typically 300 units)
  - Prefilled pens (FlexPen, KwikPen, etc.)
- **Unit Calculations**: 
  - Standard: U-100 (100 units/mL)
  - High concentration: U-200, U-300, U-500
- **Package Selection**: Prefer pens for <50 units/day, vials for higher doses
- **Example**: 40 units daily × 30 days = 1,200 units → 4 pens or 2 vials

#### Inhalers
- **Metered Dose Inhalers (MDI)**: Count by actuations
  - Common: 60, 120, 200 actuations per inhaler
- **Dry Powder Inhalers (DPI)**: Count by doses
  - Common: 30, 60, 90 doses per device
- **Calculation**: (Puffs per dose) × (doses per day) × (days' supply)
- **Example**: 2 puffs BID × 30 days = 120 actuations → 1 inhaler (120-count)

#### Topicals (Creams, Ointments, Gels)
- **Unit**: grams (g)
- **Common Packages**: 15g, 30g, 45g, 60g tubes
- **Estimation**: Based on application area and frequency
- **Example**: Apply BID to forearm → ~2g/day × 30 days = 60g → 1x60g or 2x30g tube

#### Patches (Transdermal)
- **Unit**: Individual patches
- **Common Packages**: 4, 8, 10, 30 patches per box
- **Calculation**: (Patches per application) × (frequency) × (days' supply)
- **Example**: Change Q3days × 30 days = 10 patches → 1x10 box

#### Eye/Ear Drops
- **Unit**: milliliters (mL)
- **Common Packages**: 2.5mL, 5mL, 10mL, 15mL bottles
- **Drop Estimation**: ~20 drops/mL
- **Example**: 2 drops OU BID × 30 days = 240 drops = 12mL → 1x15mL bottle

### 4.6 Business Rule Assumptions

#### NDC Selection Priority (Customer Experience First)
1. **Active Status**: Only active NDCs (mandatory)
2. **Package Convenience**: Fewest packages preferred
3. **Overfill Minimization**: Within tolerance (<20% for single pack)
4. **Generic First**: Generic over brand (unless specified)
5. **Availability**: In-stock items prioritized (future integration)
6. **Cost**: Considered last (unless specifically requested)

#### Manufacturer Preferences
- **Default**: No preference (select based on above criteria)
- **Future**: Allow pharmacy-specific preferred manufacturer lists
- **Override**: Pharmacist can manually select alternative NDC

#### Generic vs. Brand
- **Default Behavior**: Prefer generic equivalent
- **Brand Necessary**: If prescription is "DAW" (Dispense As Written)
- **Display**: Show both options with price difference when available

### 4.7 User Role Assumptions

#### Pharmacist Role
- **Permissions**: Full access to all features
- **Capabilities**:
  - Override system recommendations
  - Approve unusual quantity calculations
  - Flag NDCs for review
  - Access audit logs
  
#### Pharmacy Technician Role
- **Permissions**: Standard calculation features
- **Capabilities**:
  - Input prescriptions
  - View calculations
  - Generate reports
  - Cannot override system recommendations
  - Requires pharmacist approval for warnings

#### Administrator Role
- **Permissions**: System configuration
- **Capabilities**:
  - Manage user accounts
  - Configure business rules
  - Access analytics dashboard
  - System health monitoring

### 4.8 Testing Data Assumptions

#### Test Prescription Set
We will compile 200+ test cases covering:
- **Common Medications**: 50 high-volume drugs (e.g., metformin, lisinopril, atorvastatin)
- **Special Dosage Forms**: 30 cases (insulin, inhalers, liquids)
- **Edge Cases**: 40 cases (unusual strengths, compound medications)
- **Multi-pack Scenarios**: 30 cases requiring package optimization
- **Error Scenarios**: 20 cases (inactive NDCs, missing data)
- **SIG Variations**: 30 cases (different instruction formats)

#### Data Sources
- **FDA Orange Book**: Generic drug listings
- **DailyMed**: Package insert information
- **Open FDA**: NDC directory data
- **Pharmacy Associations**: Sample prescription patterns
- **Synthetic Data**: Generated edge cases

---

## 5. Trade-off Decisions

### 5.1 Customer Experience vs. Cost Optimization

#### Decision: Prioritize Customer Experience
**Rationale**: Patient convenience and medication adherence outweigh minimal cost differences in most scenarios.

**Specific Trade-offs:**

1. **Single Package vs. Exact Quantity**
   - **Choice**: Recommend 1x90 pack over 2x30 + 1x10 even with slight overfill
   - **CX Benefit**: Simpler for patient, fewer bottles to manage
   - **Cost Impact**: $2-5 additional cost, ~15% more medication
   - **Justification**: Reduced confusion, better adherence, lower error risk

2. **Overfill Tolerance**
   - **Choice**: Allow up to 20% overfill for single-pack solutions
   - **CX Benefit**: Convenience, backup for missed doses
   - **Cost Impact**: 5-20% medication waste
   - **Justification**: Reduced pharmacy callbacks, improved patient satisfaction

3. **Package Size Selection**
   - **Choice**: Prefer larger single packages over multiple small packages
   - **CX Benefit**: Fewer refills, less frequent pharmacy visits
   - **Cost Impact**: Higher upfront cost per unit
   - **Justification**: Improved adherence, reduced administrative burden

### 5.2 API Response Time vs. Accuracy

#### Decision: Prioritize Accuracy with Performance Guardrails
**Rationale**: Incorrect dispensing has serious health and legal consequences.

**Implementation:**
- Target <2 seconds total response time
- Cache aggressively (NDC data for 24 hours)
- Use AI for ambiguous SIG parsing (slight delay acceptable)
- Timeout after 5 seconds, fallback to manual review

### 5.3 Feature Completeness vs. Launch Speed

#### Decision: Phased Rollout with MVP Focus
**Rationale**: Deliver core value quickly, iterate based on user feedback.

**MVP (Phase 1 - 8 weeks):**
- P0 features: Basic calculation, NDC matching, JSON output
- Common dosage forms only (tablets, capsules)
- Simple UI with essential features

**Phase 2 (12 weeks):**
- P1 features: Special dosage forms, multi-pack optimization
- Enhanced UI, notifications
- User role management

**Phase 3 (16 weeks):**
- P2 features: Pharmacy system integration
- Advanced analytics
- Batch processing

### 5.4 Build vs. Buy for SIG Parsing

#### Decision: Use OpenAI for ALL Parsing
**Rationale:** Reliability and accuracy outweigh marginal cost savings.

**Why All-LLM Instead of Hybrid:**
- **Consistency**: Same parsing logic for all instructions (simple or complex)
- **Accuracy**: LLM handles edge cases and variations better than regex
- **Maintainability**: No need to maintain two separate systems
- **Cost**: At ~$0.02 per parse, the cost is acceptable ($200-400/month for 10K calculations)
- **Reliability**: LLM gracefully handles typos, variations, unusual phrasings

**Cost Analysis:**
- All OpenAI: ~$400/month for 10,000 calculations
- Hybrid (70% regex, 30% OpenAI): ~$150/month
- **Decision**: Pay extra $250/month for better reliability and consistency

**Fallback Strategy:**
- If OpenAI unavailable, use cached similar calculations
- Display reduced confidence score
- Require pharmacist verification

### 5.5 Client-Side vs. Server-Side Processing

#### Decision: Server-Side Processing with Client-Side Validation
**Rationale**: Security, consistency, and auditability.

**Implementation:**
- All API calls server-side (protect keys, rate limiting)
- Calculations server-side (consistency, logging)
- Client-side input validation only (UX improvement)
- Offline mode uses cached results (limited functionality)

### 5.6 Data Storage Strategy

#### Decision: Firebase Firestore with Structured Caching
**Rationale**: Serverless simplicity, real-time sync, integrated with hosting.

**Alternative Considered**: PostgreSQL on Cloud SQL
- **Rejected**: Added complexity, manual scaling, separate hosting
- **Firestore Advantages**: Auto-scaling, offline support, simpler architecture
- **Firestore Limitations**: Query flexibility (acceptable for MVP scope)

---

## 6. Target Users & Personas

### Persona 1: Sarah - Retail Pharmacist

**Demographics:**
- Age: 34
- Experience: 8 years as licensed pharmacist
- Location: Suburban pharmacy (300 prescriptions/day)
- Tech Savviness: Medium-high

**Goals:**
- Accurately fill prescriptions without delays
- Minimize claim rejections and callbacks
- Maintain patient safety and satisfaction
- Reduce time spent on calculations

**Pain Points:**
- Spends 10-15 minutes resolving NDC errors daily
- Manual package calculations prone to errors
- Uncertainty with unusual dosage forms
- System doesn't catch inactive NDCs until claim submission

**Use Case:**
Sarah receives a prescription for metformin 500mg, take 2 tablets daily for 90 days. She needs 180 tablets. Her system shows multiple NDCs with different package sizes. She uses the calculator to instantly find that 2x100-count bottles are optimal, confirms NDCs are active, and dispenses with confidence.

**Success Criteria:**
- Calculations completed in <30 seconds
- 95%+ confidence in recommendations
- Proactive warnings about issues

---

### Persona 2: Mike - Pharmacy Technician

**Demographics:**
- Age: 26
- Experience: 3 years as certified pharmacy technician
- Location: Hospital outpatient pharmacy
- Tech Savviness: Medium

**Goals:**
- Process prescriptions accurately for pharmacist review
- Reduce back-and-forth with pharmacist on quantity questions
- Learn proper calculation methods
- Handle routine cases independently

**Pain Points:**
- Lacks confidence in complex calculations
- Frequently needs pharmacist verification
- Unsure about package selection logic
- No systematic way to check NDC validity

**Use Case:**
Mike prepares an insulin prescription: Lantus 20 units daily for 30 days. He's uncertain whether to dispense pens or vials. The calculator recommends 2 prefilled pens (600 units total), explains the rationale, and flags that this is the most convenient option for the patient.

**Success Criteria:**
- Can handle 80% of calculations without pharmacist assistance
- Clear explanations for learning
- Confidence in recommendations

---

### Persona 3: Dr. Patricia Chen - Hospital Administrator

**Demographics:**
- Age: 52
- Role: Director of Pharmacy Operations
- Oversight: 5 hospital pharmacies, 40 staff members
- Tech Savviness: Medium

**Goals:**
- Reduce operational costs and inefficiencies
- Improve patient satisfaction scores
- Monitor and improve quality metrics
- Ensure regulatory compliance

**Pain Points:**
- High rate of claim rejections (8-12% NDC-related)
- Inconsistent practices across staff
- Limited visibility into root causes
- Manual reporting and analysis

**Use Case:**
Dr. Chen accesses the analytics dashboard to review monthly performance. She identifies that 60% of claim rejections are from inactive NDCs, and 30% from quantity mismatches. She uses this data to implement focused training and tracks improvement to 2% rejection rate over 6 months.

**Success Criteria:**
- Measurable reduction in rejection rates
- Standardized processes across locations
- Data-driven decision making
- ROI demonstration

---

## 7. User Stories

### Epic 1: Basic Prescription Calculation (P0)

#### Story 1.1: Input Drug Information
**As a** pharmacist  
**I want to** input a drug name or NDC along with SIG and days' supply  
**So that** I can quickly initiate a calculation  

**Acceptance Criteria:**
- Drug name search with auto-complete (minimum 3 characters)
- Direct NDC input field (11-digit format: 5-4-2)
- SIG field with common abbreviation suggestions
- Days' supply numeric input (1-365 range)
- Clear form validation messages
- Support for copy-paste from prescription systems

**Technical Notes:**
- Implement debounced search (300ms delay)
- Auto-format NDC with hyphens
- Store recent searches for quick access

---

#### Story 1.2: Drug Normalization
**As a** pharmacist  
**I want to** see my drug name normalized to RxCUI  
**So that** I can confirm the system identified the correct medication  

**Acceptance Criteria:**
- Display normalized drug name, strength, and form
- Show RxCUI identifier
- Provide alternative matches if multiple drugs found
- Allow user to select correct match from alternatives
- Display confidence score for match quality
- Support both brand and generic names

**Technical Notes:**
- Use RxNorm API `/rxcui.json` endpoint
- Implement fuzzy matching for misspellings
- Cache common drug mappings

---

#### Story 1.3: NDC Retrieval and Validation
**As a** pharmacist  
**I want to** see all valid, active NDCs for the normalized drug  
**So that** I can choose appropriate package sizes  

**Acceptance Criteria:**
- Display list of active NDCs with package details
- Show package size, quantity, and manufacturer
- Highlight inactive NDCs in red with warning icon
- Filter by dosage form if multiple exist
- Sort by package size (ascending/descending)
- Display last update date for NDC status

**Technical Notes:**
- Use FDA NDC Directory API
- Cross-reference with RxNorm NDC mappings
- Implement 24-hour cache with refresh option

---

#### Story 1.4: Quantity Calculation
**As a** pharmacist  
**I want to** see the total quantity needed based on SIG and days' supply  
**So that** I can understand the patient's total medication needs  

**Acceptance Criteria:**
- Display total quantity with units (tablets, mL, units, etc.)
- Show calculation breakdown (dose × frequency × days)
- Handle complex SIG instructions (e.g., "take 2 tabs TID for 7 days, then 1 tab TID")
- Support PRN (as needed) medications with max daily dose
- Calculate for multiple dosage forms correctly
- Display warnings for unusual quantities (>180 days' supply)

**Technical Notes:**
- Implement SIG parser (rule-based + OpenAI fallback)
- Support standard medical abbreviations
- Validate against typical dosing ranges

---

#### Story 1.5: Optimal NDC Selection
**As a** pharmacist  
**I want to** receive a recommendation for optimal NDC package combination  
**So that** I can efficiently dispense with minimal waste and maximum patient convenience  

**Acceptance Criteria:**
- Display recommended NDC(s) with quantities
- Show total dispensed quantity and any overfill
- Calculate overfill percentage
- Provide alternative package combinations
- Explain selection rationale (e.g., "Single package minimizes confusion")
- Allow manual override with reason code

**Technical Notes:**
- Implement greedy algorithm for package optimization
- Consider overfill tolerance (≤20%)
- Prefer fewer packages when overfill is equivalent

---

#### Story 1.6: Structured Output
**As a** system integrator  
**I want to** receive calculation results in JSON format  
**So that** I can integrate with other pharmacy systems  

**Acceptance Criteria:**
- JSON output includes all input parameters
- Contains normalized drug information
- Lists all considered NDCs with metadata
- Shows selected NDC(s) with quantities
- Includes calculation details and warnings
- Provides timestamp and calculation ID
- API endpoint returns standardized schema

**Example JSON Schema:**
```json
{
  "calculation_id": "calc_123456789",
  "timestamp": "2025-11-10T14:30:00Z",
  "input": {
    "drug_name": "Metformin 500mg",
    "ndc": null,
    "sig": "Take 2 tablets daily",
    "days_supply": 90
  },
  "normalization": {
    "rxcui": "860975",
    "drug_name": "Metformin Hydrochloride 500 MG Oral Tablet",
    "confidence": 0.98
  },
  "calculation": {
    "total_quantity": 180,
    "unit": "tablets",
    "calculation_breakdown": "2 tablets/day × 90 days = 180 tablets"
  },
  "recommendation": {
    "selected_ndcs": [
      {
        "ndc": "00093-7214-01",
        "quantity": 2,
        "package_size": 100,
        "total_dispensed": 200
      }
    ],
    "overfill": {
      "amount": 20,
      "percentage": 11.1
    },
    "rationale": "Single package size minimizes patient confusion"
  },
  "warnings": [],
  "alternatives": [...]
}
```

---

### Epic 2: Inactive NDC Detection (P0)

#### Story 2.1: Inactive NDC Highlighting
**As a** pharmacist  
**I want to** see inactive NDCs clearly marked  
**So that** I can avoid using them and prevent claim rejections  

**Acceptance Criteria:**
- Inactive NDCs displayed with red background/border
- Warning icon next to inactive status
- Tooltip explaining inactive status
- Option to hide inactive NDCs from list
- Search filter to show only active NDCs
- Display inactivation date if available

**Technical Notes:**
- FDA status field check: "active" vs. "inactive"
- Real-time validation on NDC entry
- Update cache immediately on status change

---

#### Story 2.2: Inactive NDC Notification
**As a** pharmacy technician  
**I want to** receive an alert if I attempt to use an inactive NDC  
**So that** I can correct the error before processing  

**Acceptance Criteria:**
- Modal warning if inactive NDC selected
- Explanation of why NDC is inactive
- Automatic suggestion of active alternative
- Require explicit acknowledgment to proceed
- Log all inactive NDC usage attempts
- Send daily summary report to administrators

---

### Epic 3: Multi-Pack Handling (P1)

#### Story 3.1: Multi-Pack Optimization
**As a** pharmacist  
**I want to** see optimized combinations of multiple package sizes  
**So that** I can dispense the exact quantity with minimal waste  

**Acceptance Criteria:**
- Display top 3 package combinations
- Show total dispensed quantity for each option
- Calculate and display overfill/underfill for each
- Highlight recommended option with reasoning
- Allow user to compare options side-by-side
- Consider package count in optimization

**Example:**
```
Prescription: 240 tablets needed
Available packages: 30, 60, 90, 100 count

Options:
1. [RECOMMENDED] 2 × 120 count = 240 tablets (exact match)
2. 1 × 100 + 1 × 90 + 1 × 60 = 250 tablets (+10 overfill, 4.2%)
3. 4 × 60 count = 240 tablets (exact, but 4 packages)

Recommendation: Option 1 - exact quantity with minimal packages
```

---

#### Story 3.2: Overfill/Underfill Warnings
**As a** pharmacist  
**I want to** be notified of significant overfill or any underfill  
**So that** I can make informed dispensing decisions  

**Acceptance Criteria:**
- Yellow warning for 10-20% overfill
- Orange warning for 20-50% overfill
- Red warning for >50% overfill
- Red error for any underfill
- Suggest prescription adjustment for excessive overfill
- Display cost impact of overfill when available

---

### Epic 4: Special Dosage Forms (P1)

#### Story 4.1: Liquid Medication Handling
**As a** pharmacist  
**I want to** calculate volumes for liquid medications correctly  
**So that** I can dispense oral solutions and suspensions accurately  

**Acceptance Criteria:**
- Support mL, L, fl oz units
- Convert between units automatically
- Handle concentration calculations (mg/mL)
- Display volume per dose and total volume
- Recommend bottle sizes that minimize waste
- Account for dropper calibration if relevant

**Example:**
```
Input: Amoxicillin 250mg/5mL, take 10mL TID × 10 days
Calculation: 10mL × 3 times/day × 10 days = 300mL
Recommendation: 2 × 150mL bottles (exact) OR 1 × 473mL bottle (convenience)
```

---

#### Story 4.2: Insulin Calculation
**As a** pharmacist  
**I want to** calculate insulin quantities in units, accounting for vials vs. pens  
**So that** I can provide appropriate insulin packages  

**Acceptance Criteria:**
- Calculate total units needed
- Support U-100, U-200, U-300, U-500 concentrations
- Recommend vials (10mL = 1000 units) or pens (3mL = 300 units)
- Consider patient preference (pens for convenience, vials for high doses)
- Display both options with trade-offs
- Handle sliding scale calculations

**Example:**
```
Input: Lantus 25 units daily × 30 days
Calculation: 25 units × 30 days = 750 units

Options:
1. [RECOMMENDED] 3 × pens (900 units total, +150 overfill)
   - Pros: Convenient, portable, accurate dosing
   - Cons: 17% overfill, higher cost
   
2. 1 × vial (1000 units, +250 overfill)
   - Pros: Lower cost, less waste at scale
   - Cons: Requires syringes, 33% overfill
```

---

#### Story 4.3: Inhaler Actuation Counting
**As a** pharmacist  
**I want to** calculate inhaler doses by actuations  
**So that** I can ensure patients have adequate medication  

**Acceptance Criteria:**
- Support MDI (metered dose) and DPI (dry powder) inhalers
- Calculate total actuations needed
- Account for priming doses if applicable
- Recommend inhalers with appropriate actuation counts
- Display doses remaining after dispensing
- Warning if quantity requires multiple inhalers

**Example:**
```
Input: Albuterol HFA, 2 puffs QID PRN × 30 days (max)
Calculation: 2 puffs × 4 times/day × 30 days = 240 actuations
Available: 60, 120, 200 actuation inhalers
Recommendation: 2 × 120-actuation inhalers (240 total)
Note: Actual usage may be less (PRN medication)
```

---

#### Story 4.4: Topical and Patch Calculations
**As a** pharmacist  
**I want to** estimate quantities for topicals and patches  
**So that** I can provide appropriate amounts  

**Acceptance Criteria:**
- Support grams for creams/ointments
- Calculate based on application area and frequency
- Support patches with dosing intervals
- Provide usage guidelines
- Warn if quantity seems excessive
- Allow pharmacist notes on application

**Example:**
```
Topical:
Input: Triamcinolone 0.1% cream, apply BID × 14 days to hands
Estimation: ~1g per application × 2 times/day × 14 days = 28g
Recommendation: 1 × 30g tube

Patches:
Input: Fentanyl 25mcg patch, change every 72 hours × 30 days
Calculation: 30 days ÷ 3 days per patch = 10 patches
Recommendation: 1 × 10-patch box
```

---

### Epic 5: User Interface & Experience (P0-P1)

#### Story 5.1: Simple Input Form
**As a** pharmacy technician  
**I want** an intuitive input form with clear labels  
**So that** I can quickly enter prescription information  

**Acceptance Criteria:**
- Clean, uncluttered layout
- Logical tab order for keyboard navigation
- Auto-focus on first input field
- Real-time validation feedback
- Clear placeholder examples
- Mobile-responsive design

---

#### Story 5.2: Results Summary Display
**As a** pharmacist  
**I want** a clear, scannable results summary  
**So that** I can quickly review and act on recommendations  

**Acceptance Criteria:**
- Visual hierarchy (recommended NDC most prominent)
- Color-coded warnings and status indicators
- Collapsible sections for detailed information
- Print-friendly format
- Copy-to-clipboard functionality
- Save/bookmark calculation option

---

#### Story 5.3: Error Handling and Notifications
**As a** user  
**I want** clear error messages and helpful guidance  
**So that** I can resolve issues quickly  

**Acceptance Criteria:**
- Specific error messages (not generic)
- Suggested actions for resolution
- Non-blocking notifications for warnings
- Toast notifications for background updates
- Error logging for technical issues
- Help documentation links

---

### Epic 6: User Management & Roles (P1)

#### Story 6.1: User Authentication
**As a** pharmacy administrator  
**I want** secure user authentication  
**So that** only authorized personnel can access the system  

**Acceptance Criteria:**
- Email/password login
- Firebase Authentication integration
- Password complexity requirements
- Multi-factor authentication option
- Session timeout after 30 minutes inactivity
- Password reset workflow

---

#### Story 6.2: Role-Based Access Control
**As a** pharmacy administrator  
**I want** different access levels for different user roles  
**So that** I can control who can perform certain actions  

**Acceptance Criteria:**
- Three roles: Technician, Pharmacist, Administrator
- Technicians: Read-only, no overrides
- Pharmacists: Full calculation access, can override
- Administrators: User management, system configuration
- Role assignment at account creation
- Audit log of role changes

---

### Epic 7: Analytics & Reporting (P1)

#### Story 7.1: Usage Dashboard
**As an** administrator  
**I want** to see system usage metrics  
**So that** I can understand adoption and performance  

**Acceptance Criteria:**
- Daily/weekly/monthly calculation volume
- User activity statistics
- Average response time
- Error rate trends
- Most common drugs calculated
- Peak usage times

---

#### Story 7.2: Quality Metrics
**As an** administrator  
**I want** to track accuracy and quality indicators  
**So that** I can measure system impact  

**Acceptance Criteria:**
- Normalization success rate
- NDC match accuracy
- Inactive NDC detection rate
- Override frequency and reasons
- User satisfaction scores
- Claim rejection correlation

---

### Epic 8: Pharmacy System Integration (P2)

#### Story 8.1: API Endpoints for Integration
**As a** pharmacy system developer  
**I want** RESTful API endpoints  
**So that** I can integrate the calculator into our workflow  

**Acceptance Criteria:**
- POST /api/v1/calculate endpoint
- GET /api/v1/ndc/{ndc} for NDC lookup
- GET /api/v1/drug/search for drug search
- API key authentication
- Rate limiting (100 requests/minute)
- Comprehensive API documentation
- Webhook support for async calculations

---

#### Story 8.2: Batch Processing
**As a** pharmacy administrator  
**I want** to process multiple prescriptions at once  
**So that** I can validate large batches efficiently  

**Acceptance Criteria:**
- CSV upload for batch processing
- Background job processing
- Progress tracking
- Downloadable results report
- Error handling for invalid entries
- Processing time: <1 second per calculation

---

#### Story 8.3: HL7 FHIR Support
**As a** healthcare IT director  
**I want** FHIR-compliant data exchange  
**So that** I can integrate with modern healthcare systems  

**Acceptance Criteria:**
- FHIR MedicationRequest resource support
- FHIR MedicationDispense resource output
- FHIR Medication resource for NDC data
- Support for R4 specification
- Standard FHIR endpoints
- SMART on FHIR authentication

---

## 8. Functional Requirements

### 8.1 Core Calculation Engine (P0)

#### REQ-8.1.1: Drug Name Input & Search
- Support free-text drug name entry with auto-complete
- Minimum 3 characters to trigger search
- Return up to 10 matching results
- Search both brand and generic names
- Display strength and dosage form in results
- Handle common misspellings (fuzzy matching)

#### REQ-8.1.2: NDC Direct Entry
- Accept 11-digit NDC format (5-4-2)
- Validate format and checksum
- Auto-format with hyphens during entry
- Verify NDC exists in FDA database
- Display associated drug information

#### REQ-8.1.3: SIG (Signa) Parsing
- Support standard medical abbreviations (BID, TID, QID, QD, etc.)
- Parse complex instructions (e.g., "take 2 tabs TID for 7 days, then 1 tab TID")
- Handle PRN medications with max daily dose
- Extract dose amount, frequency, and special instructions
- **Use OpenAI GPT-4o for ALL SIG parsing** (reliable, accurate, handles edge cases)
- Display parsed interpretation for user verification
- Validate extracted data against reasonable medical ranges

#### REQ-8.1.4: Days' Supply Input
- Accept numeric input (1-365 days)
- Validate reasonable range based on drug type
- Warning for >90 days' supply (insurance limitations)
- Support decimal values for tapering schedules

#### REQ-8.1.5: RxNorm Normalization
- Query RxNorm API with drug name
- Return RxCUI identifier
- Provide normalized name, strength, and dosage form
- Display confidence score for match
- Offer alternative matches if ambiguous
- Cache mappings for 7 days

#### REQ-8.1.6: NDC Retrieval
- Query FDA NDC Directory API with RxCUI or drug name
- Filter by active status
- Return all matching NDCs with package details
- Include manufacturer, package size, and unit
- Display last update timestamp
- Cache for 24 hours

#### REQ-8.1.7: Quantity Calculation
- Multiply dose × frequency × days' supply
- Handle different units (tablets, mL, units, actuations, etc.)
- Support complex dosing schedules
- Calculate total and per-package requirements
- Display calculation breakdown

#### REQ-8.1.8: Package Optimization Algorithm
```
Algorithm: Greedy Package Selection with Overfill Minimization

Input: total_quantity_needed, available_packages[]
Output: selected_packages[], total_dispensed, overfill_percentage

1. Sort available_packages by size (descending)
2. For each package size:
   a. If single package covers quantity with ≤20% overfill:
      - Return single package (prioritize convenience)
   b. If multiple packages needed:
      - Use greedy approach (largest first)
      - Continue until quantity covered
3. Evaluate alternative combinations:
   a. Generate top 3 alternatives
   b. Score based on:
      - Package count (fewer better)
      - Overfill percentage (lower better)
      - Convenience factor
4. Return recommended + alternatives with rationale
```

#### REQ-8.1.9: Inactive NDC Detection
- Check FDA status field for each NDC
- Flag inactive NDCs with visual indicator
- Prevent selection of inactive NDCs (warning override required)
- Log attempts to use inactive NDCs
- Suggest active alternatives

#### REQ-8.1.10: JSON Output Generation
- Generate structured JSON for all calculations
- Include input parameters, results, and metadata
- Provide unique calculation ID
- Timestamp in ISO 8601 format
- Include warnings and alternatives

### 8.2 Special Dosage Form Support (P1)

#### REQ-8.2.1: Liquid Medications
- Support mL, L, fl oz units
- Auto-convert between units
- Handle concentration (mg/mL) calculations
- Calculate total volume needed
- Recommend bottle sizes
- Display volume per dose

#### REQ-8.2.2: Insulin Products
- Support U-100, U-200, U-300, U-500 concentrations
- Calculate total units needed
- Recommend vials (10mL = 1000 units) vs. pens (3mL = 300 units)
- Consider patient convenience (prefer pens for <50 units/day)
- Display both options with trade-offs

#### REQ-8.2.3: Inhalers
- Support MDI and DPI types
- Calculate total actuations needed
- Account for priming doses (typically 4 actuations)
- Recommend inhaler count
- Display remaining doses

#### REQ-8.2.4: Topical Products
- Support gram measurements
- Estimate usage based on application area
- Calculate total grams needed
- Recommend tube sizes

#### REQ-8.2.5: Transdermal Patches
- Count individual patches
- Calculate based on dosing interval
- Recommend package quantities

#### REQ-8.2.6: Ophthalmic/Otic Drops
- Support mL for drops
- Estimate drops per mL (~20 drops/mL)
- Calculate total drops needed
- Recommend bottle sizes

### 8.3 User Interface (P0-P1)

#### REQ-8.3.1: Input Form
- Responsive design (desktop, tablet)
- Keyboard navigation support
- Auto-complete with debounce (300ms)
- Real-time validation
- Clear button to reset form
- Recent searches dropdown

#### REQ-8.3.2: Results Display
- Primary recommendation prominently displayed
- Color-coded status indicators (green=good, yellow=warning, red=error)
- Collapsible sections for details
- Alternative options in tabbed interface
- Copy to clipboard button
- Print-friendly view

#### REQ-8.3.3: Notifications
- Toast notifications for background events
- Modal warnings for critical issues
- Inline validation messages
- Success confirmations
- Error recovery suggestions

#### REQ-8.3.4: Accessibility
- WCAG 2.1 Level AA compliance
- Screen reader support
- Keyboard-only navigation
- High contrast mode
- Font size adjustment
- Alternative text for images/icons

### 8.4 User Management (P1)

#### REQ-8.4.1: Authentication
- Firebase Authentication integration
- Email/password login
- Password requirements: min 8 chars, uppercase, number, special char
- Optional MFA (TOTP)
- Session timeout: 30 minutes inactivity
- Secure password reset workflow

#### REQ-8.4.2: User Roles
- Three roles: Technician, Pharmacist, Administrator
- Role-based UI (hide/show features based on role)
- Permission checks on all sensitive operations
- Audit log for role changes

#### REQ-8.4.3: User Profile
- Display name, email, role
- Last login timestamp
- Activity statistics
- Preference settings (theme, default units)
- Change password option

### 8.5 Data Management (P0-P1)

#### REQ-8.5.1: Calculation History
- Store last 100 calculations per user
- Searchable by drug name, date, user
- Rerun calculation option
- Export to CSV
- Retention: 90 days

#### REQ-8.5.2: Caching Strategy
- RxCUI mappings: 7-day cache
- NDC data: 24-hour cache
- Package configurations: 24-hour cache
- Inactive NDC list: 12-hour cache
- Firestore TTL indexes for auto-cleanup

#### REQ-8.5.3: Data Export
- Export calculation results to JSON
- Export user activity to CSV
- Export analytics data to spreadsheet
- Batch export for multiple calculations

### 8.6 Analytics & Reporting (P1)

#### REQ-8.6.1: Usage Metrics
- Total calculations per day/week/month
- Calculations per user
- Average response time
- Peak usage hours
- Most calculated drugs (top 20)
- Error rates by type

#### REQ-8.6.2: Quality Metrics
- Normalization success rate
- NDC match accuracy
- Active/inactive NDC ratio
- Override frequency
- User satisfaction scores (collected via feedback)

#### REQ-8.6.3: Dashboard
- Visual charts (bar, line, pie)
- Date range filters
- Export to PDF option
- Real-time updates
- Drill-down capability

### 8.7 Integration (P2)

#### REQ-8.7.1: RESTful API
- POST /api/v1/calculate - Main calculation endpoint
- GET /api/v1/ndc/{ndc} - NDC lookup
- GET /api/v1/drug/search?q={query} - Drug search
- POST /api/v1/batch - Batch processing
- GET /api/v1/calculation/{id} - Retrieve past calculation
- API key authentication
- Rate limiting: 100 req/min per key
- OpenAPI 3.0 specification

#### REQ-8.7.2: Webhook Support
- Register webhook URL
- Receive calculation completion events
- Retry on failure (3 attempts, exponential backoff)
- Webhook signature verification

#### REQ-8.7.3: Batch Processing
- Accept CSV upload (max 1000 rows)
- Process in background
- Email notification on completion
- Downloadable results CSV
- Error report for failed rows

---

## 9. Non-Functional Requirements

### 9.1 Performance

#### REQ-9.1.1: Response Time
- Drug search auto-complete: <200ms
- RxNorm normalization: <500ms
- NDC retrieval: <1 second
- Complete calculation: <2 seconds (95th percentile)
- Page load time: <1 second

#### REQ-9.1.2: Throughput
- Support 100 concurrent users
- Handle 1000 calculations/hour
- API rate limit: 100 requests/minute per user

#### REQ-9.1.3: Resource Utilization
- Frontend bundle size: <500KB gzipped
- Firebase Firestore reads: <10,000/day per user
- OpenAI API: <500 requests/day (cost optimization)

### 9.2 Scalability

#### REQ-9.2.1: Horizontal Scaling
- Firebase Hosting auto-scales
- Cloud Functions scale to demand
- Firestore auto-scales to storage needs

#### REQ-9.2.2: Data Growth
- Support 10,000 users
- Store 1M calculation records
- Handle 100K NDCs in database

### 9.3 Reliability

#### REQ-9.3.1: Availability
- Target: 99.5% uptime
- Planned maintenance windows: <2 hours/month
- Graceful degradation on API failures

#### REQ-9.3.2: Error Handling
- All errors logged to Cloud Logging
- Automatic retry on transient failures
- User-friendly error messages
- Fallback modes for API unavailability

#### REQ-9.3.3: Data Integrity
- Transaction support for critical operations
- Backup calculations before recommendations
- Audit trail for all modifications

### 9.4 Security

#### REQ-9.4.1: Authentication & Authorization
- Firebase Authentication (industry standard)
- Role-based access control (RBAC)
- Session management with timeout
- MFA option for administrators

#### REQ-9.4.2: Data Protection
- Encryption at rest (Firebase default)
- Encryption in transit (HTTPS only)
- API keys stored in Firebase Secret Manager
- No PHI (Protected Health Information) stored

#### REQ-9.4.3: Input Validation
- Sanitize all user inputs
- Prevent SQL injection (not applicable - NoSQL)
- Prevent XSS attacks
- Rate limiting to prevent abuse

#### REQ-9.4.4: Compliance
- HIPAA considerations (no PHI stored)
- FDA guidance compliance
- Data privacy regulations (GDPR, CCPA ready)

### 9.5 Maintainability

#### REQ-9.5.1: Code Quality
- TypeScript for type safety
- ESLint for code standards
- Prettier for code formatting
- 80%+ test coverage

#### REQ-9.5.2: Documentation
- Inline code comments
- API documentation (OpenAPI)
- User guide and tutorials
- Architecture decision records (ADRs)

#### REQ-9.5.3: Monitoring
- Cloud Logging integration
- Performance monitoring (Firebase Performance)
- Error tracking (Firebase Crashlytics)
- Custom dashboards for key metrics

### 9.6 Usability

#### REQ-9.6.1: Learning Curve
- New users productive within 15 minutes
- Contextual help available
- Tooltips for complex fields
- Video tutorials

#### REQ-9.6.2: Efficiency
- Common tasks in <5 clicks
- Keyboard shortcuts for power users
- Bulk operations support
- Smart defaults reduce input

### 9.7 Compatibility

#### REQ-9.7.1: Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

#### REQ-9.7.2: Device Support
- Desktop (1920x1080 and above)
- Tablet (iPad, Android tablets)
- No mobile phone support (complex UI)

#### REQ-9.7.3: Network
- Works on 3G+ connections
- Offline mode for cached data
- Progressive enhancement

---

## 10. User Experience & Design

### 10.1 Design Principles

1. **Clarity First**: Medical calculations require absolute clarity - avoid ambiguity
2. **Efficiency**: Minimize clicks and keystrokes for common workflows
3. **Safety**: Prominent warnings, confirmation dialogs for critical actions
4. **Accessibility**: Usable by all, including those with disabilities
5. **Progressive Disclosure**: Show essential info first, details on demand

### 10.2 Key User Flows

#### Flow 1: Basic Calculation (Happy Path)
```
1. User lands on homepage
2. Enters drug name (e.g., "metformin 500mg")
   → Auto-complete shows matches
3. Selects drug from dropdown
   → System displays normalized drug name
4. Enters SIG: "Take 2 tablets daily"
5. Enters days' supply: 90
6. Clicks "Calculate"
   → System processes (2 seconds)
7. Results displayed:
   - Recommended: 2 × 100-count bottles
   - Total: 200 tablets (180 needed, 20 overfill)
   - Status: All NDCs active ✓
8. User clicks "Copy NDC" or "Print"
```

**Time to complete**: ~30 seconds

---

#### Flow 2: Complex Prescription with Warning
```
1. User enters: "Insulin glargine 20 units daily"
2. Days' supply: 30
3. System calculates: 600 units needed
4. Results show:
   - Option 1: 2 pens (600 units) ✓
   - Option 2: 1 vial (1000 units)
   - Warning: "One NDC for pens is inactive"
5. User reviews active alternatives
6. Selects active pen NDC
7. Confirms and dispenses
```

**Key UX**: System prevents error before claim submission

---

#### Flow 3: Multi-Pack Optimization
```
1. User enters: "Amoxicillin 500mg, 1 cap TID × 10 days"
2. System calculates: 30 capsules needed
3. Available packs: 20, 30, 40, 100 count
4. System recommends: 1 × 30-count (exact match)
5. Also shows:
   - Alternative 1: 2 × 20-count (40 total, 33% overfill)
   - Alternative 2: 1 × 40-count (33% overfill)
6. User sees rationale: "Single pack recommended for convenience"
7. Accepts recommendation
```

**Key UX**: Transparency in decision-making builds trust

---

### 10.3 Page Layouts

#### 10.3.1 Main Calculation Page
```
┌─────────────────────────────────────────────────────┐
│ [Logo] NDC Calculator           [User] [Settings] │
├─────────────────────────────────────────────────────┤
│                                                     │
│   Enter Prescription Information                    │
│                                                     │
│   Drug Name or NDC *                                │
│   [________________________] 🔍                     │
│                                                     │
│   SIG (Instructions) *                              │
│   [________________________] ⓘ                      │
│                                                     │
│   Days' Supply *                                    │
│   [____] days                                       │
│                                                     │
│   [ Calculate ]  [ Clear ]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### 10.3.2 Results Display
```
┌─────────────────────────────────────────────────────┐
│ Calculation Results                     [Print] [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✓ RECOMMENDED                                       │
│ ┌─────────────────────────────────────────────┐   │
│ │ NDC: 00093-7214-01                          │   │
│ │ Quantity: 2 bottles × 100 tablets           │   │
│ │ Total: 200 tablets (180 needed)             │   │
│ │ Overfill: 20 tablets (11.1%)                │   │
│ │                                              │   │
│ │ Rationale: Single package size minimizes    │   │
│ │ patient confusion and provides backup supply │   │
│ │                                              │   │
│ │ [ Select This NDC ]  [ View Details ]       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ALTERNATIVE OPTIONS (2)                             │
│ ▶ Option 2: 1 × 180 count (exact match)            │
│ ▶ Option 3: 3 × 60 count (exact, 3 packages)       │
│                                                     │
│ [ View JSON ]  [ Save Calculation ]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

#### 10.3.3 Warning Display
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ WARNINGS (2)                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🚫 Inactive NDC Detected                            │
│    NDC 12345-678-90 is marked inactive as of        │
│    2025-08-15. Using this may result in claim       │
│    rejection.                                        │
│                                                     │
│    Active Alternative: 00093-7214-01                │
│    [ Use Alternative ]                              │
│                                                     │
│ ⚠️ High Overfill                                     │
│    Selected package results in 35% overfill (70     │
│    extra tablets). Consider prescription adjustment │
│    or alternative package.                          │
│                                                     │
│    [ View Alternatives ]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 10.4 Visual Design System

#### 10.4.1 Color Palette
- **Primary**: #2563EB (blue) - buttons, links
- **Success**: #059669 (green) - active status, confirmations
- **Warning**: #D97706 (amber) - caution states
- **Error**: #DC2626 (red) - inactive NDCs, errors
- **Neutral**: #64748B (slate) - text, borders
- **Background**: #F8FAFC (light gray)

#### 10.4.2 Typography
- **Headings**: Inter, semi-bold, 20-32px
- **Body**: Inter, regular, 16px
- **Monospace**: JetBrains Mono (for NDCs, codes)
- **Line Height**: 1.5 (optimal readability)

#### 10.4.3 Spacing
- Base unit: 8px
- Margins: 16px, 24px, 32px
- Padding: 12px, 16px, 24px
- Grid: 12-column responsive

#### 10.4.4 Components
- **Buttons**: Rounded (6px), shadow on hover
- **Input Fields**: 44px height (touch-friendly), clear labels
- **Cards**: White background, subtle shadow, 8px radius
- **Icons**: Lucide icons, 20px standard size

### 10.5 Responsive Breakpoints
- **Desktop**: 1280px+ (full layout)
- **Tablet**: 768px-1279px (simplified layout)
- **Mobile**: <768px (not supported - complex medical UI)

### 10.6 Accessibility Features
- **ARIA labels**: All interactive elements
- **Focus indicators**: Visible 2px outline
- **Color contrast**: 4.5:1 minimum (WCAG AA)
- **Keyboard navigation**: Full support, logical tab order
- **Screen reader**: Descriptive announcements for all actions

---

## 11. Technical Architecture

### 11.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │         SvelteKit Web Application                  │    │
│  │  - SvelteKit 2.0 + TypeScript                      │    │
│  │  - shadcn-svelte (UI components)                   │    │
│  │  - TailwindCSS                                     │    │
│  │  - Firebase SDK (Auth, Firestore client)          │    │
│  │                                                    │    │
│  │  User inputs 3 fields:                             │    │
│  │  1. Drug name                                      │    │
│  │  2. Instructions (SIG)                             │    │
│  │  3. Days supply                                    │    │
│  └───────────────────────────────────────────────────┘    │
│                           │                                 │
│                           │ HTTPS                           │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    FIREBASE/GCP TIER                         │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Firebase Hosting                            │   │
│  │  - Static asset serving                             │   │
│  │  - CDN distribution                                 │   │
│  │  - SSL/TLS termination                              │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Firebase Authentication                      │   │
│  │  - Email/password                                    │   │
│  │  - Session management                                │   │
│  │  - Role-based access control                         │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Cloud Functions (Node.js)                    │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ MAIN: orchestrateCalculation                │   │   │
│  │  │  Coordinates all 6 steps:                    │   │   │
│  │  │  1. Call RxNorm API (drug normalization)     │   │   │
│  │  │  2. Call OpenAI (parse instructions) 🤖      │   │   │
│  │  │  3. Call FDA API (get all NDCs)              │   │   │
│  │  │  4. Call OpenAI (filter NDCs) 🤖             │   │   │
│  │  │  5. Call OpenAI (optimize packaging) 🤖      │   │   │
│  │  │  6. Call OpenAI (generate summary) 🤖        │   │   │
│  │  │  Returns: Complete structured results        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Function: normalizeWithRxNorm                │   │   │
│  │  │  - Calls RxNorm API                          │   │   │
│  │  │  - Caches results (7 days)                   │   │   │
│  │  │  - Returns RxCUI and standardized name       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Function: getAllNDCs                         │   │   │
│  │  │  - Queries FDA API for all product codes     │   │   │
│  │  │  - Validates status (active/inactive)        │   │   │
│  │  │  - Caches results (24 hours)                 │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Function: callOpenAI                         │   │   │
│  │  │  - Wrapper for all OpenAI calls              │   │   │
│  │  │  - Handles retries and errors                │   │   │
│  │  │  - Rate limiting and cost tracking           │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Function: refreshNDCCache                    │   │   │
│  │  │  - Scheduled daily (Cloud Scheduler)         │   │   │
│  │  │  - Updates inactive NDC list                 │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Cloud Firestore (NoSQL)                      │   │
│  │  Collections:                                        │   │
│  │  - users (profiles, roles, preferences)              │   │
│  │  - calculations (history, 90-day retention)          │   │
│  │  - cache_rxnorm (RxCUI mappings, 7-day TTL)         │   │
│  │  - cache_ndc (NDC data, 24-hour TTL)                │   │
│  │  - inactive_ndcs (12-hour TTL)                      │   │
│  │  - audit_logs (all actions for compliance)          │   │
│  │  - api_usage (track costs and rate limits)          │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │         Cloud Storage                                │   │
│  │  - Batch upload files (CSV)                          │   │
│  │  - Export reports                                    │   │
│  │  - Backup data                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Secret Manager                               │   │
│  │  - FDA API keys                                      │   │
│  │  - OpenAI API keys 🤖                                │   │
│  │  - RxNorm credentials (if needed)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ External API Calls
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│                          │                                   │
│  ┌───────────────────────▼──────────────────────────┐       │
│  │  RxNorm API (NIH/NLM)                            │       │
│  │  Role: Drug normalization                        │       │
│  │  Usage: Step 1 - Convert drug names to RxCUI    │       │
│  │  Calls per calculation: 1-2                      │       │
│  │  Cache: 7 days                                   │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  FDA NDC Directory API (openFDA)                │       │
│  │  Role: Product code validation                  │       │
│  │  Usage: Step 3 - Get all NDCs and status        │       │
│  │  Calls per calculation: 20-50 (batched)         │       │
│  │  Cache: 24 hours                                │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  OpenAI API (GPT-4o) 🤖                          │       │
│  │  Role: ALL intelligent processing                │       │
│  │  Usage:                                          │       │
│  │   • Step 2: Parse instructions                   │       │
│  │   • Step 4: Filter & validate NDCs               │       │
│  │   • Step 5: Optimize packaging                   │       │
│  │   • Step 6: Generate user summary                │       │
│  │  Calls per calculation: 4                        │       │
│  │  Cost per calculation: ~$0.08                    │       │
│  │  No cache (needs fresh analysis each time)       │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

KEY: 🤖 = LLM-Powered Intelligence
```

### **Data Flow: Single Calculation Request**

```
User Input
   ↓
Firebase Auth (validate user)
   ↓
Cloud Function: orchestrateCalculation()
   ↓
   ├─→ Step 1: RxNorm API ──→ Get RxCUI
   │                          ↓
   ├─→ Step 2: OpenAI 🤖 ────→ Parse "Take 2 tabs BID" → 360 tablets
   │                          ↓
   ├─→ Step 3: FDA API ──────→ Get 50+ NDCs with details
   │                          ↓
   ├─→ Step 4: OpenAI 🤖 ────→ Filter out inactive NDCs
   │                          ↓
   ├─→ Step 5: OpenAI 🤖 ────→ Optimize: "4 × 100 tablets"
   │                          ↓
   └─→ Step 6: OpenAI 🤖 ────→ Generate friendly summary
                              ↓
Save to Firestore (calculation history)
   ↓
Return JSON to client
   ↓
Display to user

Total Time: ~8 seconds
Total Cost: ~$0.08
```

### 11.2 Technology Stack Details

#### 11.2.1 Frontend
- **Framework**: SvelteKit 2.0+
- **Language**: TypeScript 5.0+
- **UI Library**: shadcn-svelte (Svelte port of shadcn/ui)
- **Styling**: TailwindCSS 3.4+
- **State Management**: Svelte stores (built-in)
- **Form Handling**: Superforms (type-safe forms for SvelteKit)
- **HTTP Client**: Fetch API (native)
- **Build Tool**: Vite 5.0+ (built into SvelteKit)
- **Package Manager**: pnpm

**Key Dependencies:**
```json
{
  "@sveltejs/kit": "^2.0.0",
  "svelte": "^4.2.0",
  "typescript": "^5.4.0",
  "vite": "^5.1.0",
  
  "firebase": "^10.7.0",
  
  "shadcn-svelte": "^0.11.0",
  "bits-ui": "^0.21.0",
  "tailwindcss": "^3.4.0",
  "tailwind-variants": "^0.1.20",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0",
  
  "sveltekit-superforms": "^2.0.0",
  "zod": "^3.22.4"
}
```

---

### **11.2.1.1 Complete Tech Stack: SvelteKit + shadcn-svelte + Firebase**

#### **Project Structure**

```
ndc-calculator/
│
├── frontend/                          # SvelteKit app
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn-svelte components
│   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── button.svelte
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── card/
│   │   │   │   │   ├── input/
│   │   │   │   │   ├── dialog/
│   │   │   │   │   ├── toast/
│   │   │   │   │   └── select/
│   │   │   │   ├── CalculationForm.svelte
│   │   │   │   ├── ResultsDisplay.svelte
│   │   │   │   ├── NDCCard.svelte
│   │   │   │   └── WarningAlert.svelte
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts              # Tailwind class merging
│   │   │   │   └── firebase.ts        # Firebase config
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── auth.ts            # Auth store
│   │   │   │   └── calculation.ts     # Calculation state
│   │   │   │
│   │   │   └── types/
│   │   │       └── index.ts           # TypeScript types
│   │   │
│   │   ├── routes/
│   │   │   ├── +page.svelte           # Home page
│   │   │   ├── +layout.svelte         # Root layout
│   │   │   ├── login/
│   │   │   │   └── +page.svelte
│   │   │   ├── dashboard/
│   │   │   │   └── +page.svelte
│   │   │   └── history/
│   │   │       └── +page.svelte
│   │   │
│   │   └── app.html                   # HTML template
│   │
│   ├── static/                        # Static assets
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── components.json                # shadcn-svelte config
│
├── functions/                         # Firebase Functions
│   ├── src/
│   │   ├── index.ts                   # Main entry
│   │   ├── calculate.ts               # Main calculation orchestrator
│   │   ├── services/
│   │   │   ├── rxnorm.service.ts
│   │   │   ├── fda.service.ts
│   │   │   └── openai.service.ts
│   │   ├── utils/
│   │   │   ├── cache.ts
│   │   │   └── logger.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── firebase.json                      # Firebase config
├── firestore.rules                    # Security rules
├── firestore.indexes.json             # DB indexes
└── .firebaserc                        # Firebase projects
```

---

#### **Setup Commands**

```bash
# 1. Create SvelteKit app
npm create svelte@latest ndc-calculator-frontend
# Choose:
# - Skeleton project
# - TypeScript syntax
# - ESLint, Prettier

cd ndc-calculator-frontend

# 2. Install dependencies
npm install

# 3. Add TailwindCSS
npx svelte-add@latest tailwindcss
npm install

# 4. Install shadcn-svelte
npx shadcn-svelte@latest init
# This will:
# - Create components.json
# - Set up tailwind.config
# - Add required dependencies

# 5. Add shadcn-svelte components
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add input
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add toast
npx shadcn-svelte@latest add select
npx shadcn-svelte@latest add label

# 6. Install Firebase
npm install firebase

# 7. Install form handling
npm install sveltekit-superforms zod

# 8. Setup Firebase Functions
cd ..
firebase init functions
# Choose TypeScript

cd functions
npm install openai axios

# 9. Run development server
cd ../ndc-calculator-frontend
npm run dev
```

---

#### **Frontend Package.json**

```json
{
  "name": "ndc-calculator-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.1",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^4.2.0",
    "svelte-check": "^3.6.0",
    "typescript": "^5.4.0",
    "vite": "^5.1.0",
    
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18",
    
    "eslint": "^8.56.0",
    "eslint-plugin-svelte": "^2.35.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    
    "prettier": "^3.2.0",
    "prettier-plugin-svelte": "^3.1.0"
  },
  "dependencies": {
    "firebase": "^10.7.0",
    
    "bits-ui": "^0.21.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "tailwind-variants": "^0.1.20",
    "lucide-svelte": "^0.344.0",
    
    "sveltekit-superforms": "^2.0.0",
    "zod": "^3.22.4"
  }
}
```

---

#### **Backend Package.json**

```json
{
  "name": "ndc-calculator-functions",
  "version": "1.0.0",
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "vitest"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    
    "openai": "^4.20.0",
    "axios": "^1.6.0",
    
    "zod": "^3.22.4",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "firebase-functions-test": "^3.1.0",
    "@types/express": "^4.17.0",
    
    "vitest": "^1.3.0",
    "eslint": "^8.56.0"
  }
}
```

---

#### **Example: SvelteKit Component with shadcn-svelte**

```svelte
<!-- src/lib/components/CalculationForm.svelte -->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { z } from 'zod';
  import { toast } from 'svelte-sonner';
  
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  
  const schema = z.object({
    drugName: z.string().min(3, 'Drug name must be at least 3 characters'),
    sig: z.string().min(5, 'Instructions required'),
    daysSupply: z.number().min(1).max(365),
  });
  
  const { form, errors, enhance, delayed } = superForm({
    validators: schema,
    onUpdate: async ({ form }) => {
      if (form.valid) {
        try {
          const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form.data),
          });
          
          const result = await response.json();
          
          toast.success('Calculation completed!');
          
          // Handle result...
          
        } catch (error) {
          toast.error('Calculation failed');
        }
      }
    }
  });
</script>

<Card class="w-full max-w-2xl">
  <CardHeader>
    <CardTitle>NDC Calculator</CardTitle>
  </CardHeader>
  <CardContent>
    <form method="POST" use:enhance class="space-y-4">
      <div>
        <Label for="drugName">Drug Name</Label>
        <Input
          id="drugName"
          name="drugName"
          placeholder="e.g., Metformin 500mg"
          bind:value={$form.drugName}
        />
        {#if $errors.drugName}
          <p class="text-sm text-red-500 mt-1">{$errors.drugName}</p>
        {/if}
      </div>
      
      <div>
        <Label for="sig">Instructions (SIG)</Label>
        <Input
          id="sig"
          name="sig"
          placeholder="e.g., Take 2 tablets twice daily"
          bind:value={$form.sig}
        />
        {#if $errors.sig}
          <p class="text-sm text-red-500 mt-1">{$errors.sig}</p>
        {/if}
      </div>
      
      <div>
        <Label for="daysSupply">Days Supply</Label>
        <Input
          id="daysSupply"
          name="daysSupply"
          type="number"
          bind:value={$form.daysSupply}
        />
        {#if $errors.daysSupply}
          <p class="text-sm text-red-500 mt-1">{$errors.daysSupply}</p>
        {/if}
      </div>
      
      <Button type="submit" disabled={$delayed} class="w-full">
        {$delayed ? 'Calculating...' : 'Calculate'}
      </Button>
    </form>
  </CardContent>
</Card>
```

---

#### **Firebase Configuration**

**firebase.json**
```json
{
  "hosting": {
    "public": "frontend/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

**SvelteKit adapter (svelte.config.js)**
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    })
  }
};

export default config;
```

---

#### **Why SvelteKit + shadcn-svelte?**

**SvelteKit Benefits:**
- ✅ **Faster Performance**: Compiled (no virtual DOM overhead)
- ✅ **Smaller Bundles**: Typically 50-70% smaller than React
- ✅ **Less Boilerplate**: More concise code
- ✅ **Built-in Features**: Routing, SSR, forms handling
- ✅ **Great TypeScript**: First-class TS support
- ✅ **Vite Built-in**: Lightning-fast dev experience

**shadcn-svelte Benefits:**
- ✅ **Copy-Paste Components**: Own the code
- ✅ **Full Customization**: Modify however needed
- ✅ **Accessible**: Built on Bits UI (Svelte's Radix)
- ✅ **Tailwind-Based**: Consistent styling
- ✅ **TypeScript-First**: Full type safety

**Firebase Integration:**
- ✅ **Static Hosting**: SvelteKit builds static output
- ✅ **Client-Side Auth**: Firebase SDK in browser
- ✅ **Serverless Functions**: API calls to Cloud Functions
- ✅ **Real-time Database**: Firestore integration

---

#### 11.2.2 Backend
- **Runtime**: Node.js 20 LTS
- **Serverless**: Firebase Cloud Functions (2nd gen)
- **Language**: TypeScript 5.0+
- **API Framework**: Express.js (for complex endpoints)

**Key Dependencies:**
```json
{
  "firebase-functions": "^5.0.0",
  "firebase-admin": "^12.0.0",
  "express": "^4.18.0",
  "axios": "^1.6.0",
  "openai": "^4.20.0",
  "zod": "^3.22.0"
}
```

#### 11.2.3 Firebase Services
- **Hosting**: Static site deployment, CDN
- **Authentication**: User management, session control
- **Firestore**: NoSQL database, real-time sync
- **Cloud Functions**: Serverless compute
- **Cloud Storage**: File storage (batch uploads, exports)
- **Secret Manager**: Secure credential storage
- **Cloud Scheduler**: Cron jobs (cache refresh)

#### 11.2.4 Monitoring & Logging
- **Firebase Crashlytics**: Error tracking
- **Firebase Performance**: Performance monitoring
- **Cloud Logging**: Centralized logs
- **Cloud Monitoring**: Custom metrics and alerts

### 11.3 Data Models

#### 11.3.1 Firestore Collections

**users**
```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'technician' | 'pharmacist' | 'administrator';
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: {
    theme: 'light' | 'dark';
    defaultUnits: 'metric' | 'imperial';
  };
}
```

**calculations**
```typescript
interface Calculation {
  id: string;                     // Auto-generated
  userId: string;                 // Reference to user
  timestamp: Timestamp;
  input: {
    drugName?: string;
    ndc?: string;
    sig: string;
    daysSupply: number;
  };
  normalization: {
    rxcui: string;
    drugName: string;
    confidence: number;
  };
  result: {
    totalQuantity: number;
    unit: string;
    selectedNDCs: Array<{
      ndc: string;
      quantity: number;
      packageSize: number;
    }>;
    overfill: {
      amount: number;
      percentage: number;
    };
    warnings: string[];
  };
  responseTimeMs: number;
  ttl: Timestamp;                 // Auto-delete after 90 days
}
```

**cache_rxnorm**
```typescript
interface RxNormCache {
  drugName: string;               // Normalized key (lowercase)
  rxcui: string;
  normalizedName: string;
  strength: string;
  dosageForm: string;
  cachedAt: Timestamp;
  ttl: Timestamp;                 // 7 days
}
```

**cache_ndc**
```typescript
interface NDCCache {
  ndc: string;                    // Primary key
  rxcui: string;
  productName: string;
  manufacturer: string;
  packageSize: number;
  packageUnit: string;
  status: 'active' | 'inactive';
  inactivatedDate?: string;
  cachedAt: Timestamp;
  ttl: Timestamp;                 // 24 hours
}
```

**inactive_ndcs**
```typescript
interface InactiveNDC {
  ndc: string;
  inactivatedDate: string;
  reason?: string;
  cachedAt: Timestamp;
  ttl: Timestamp;                 // 12 hours
}
```

**audit_logs**
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;                 // 'calculate', 'override', 'export', etc.
  timestamp: Timestamp;
  details: Record<string, any>;
  ipAddress?: string;
}
```

### 11.4 API Design

#### 11.4.1 Internal API (Cloud Functions)

**POST /api/v1/calculate**
```typescript
// Request
{
  drugName?: string;
  ndc?: string;
  sig: string;
  daysSupply: number;
}

// Response
{
  calculationId: string;
  timestamp: string;
  input: { /* echo input */ },
  normalization: {
    rxcui: string;
    drugName: string;
    confidence: number;
  },
  calculation: {
    totalQuantity: number;
    unit: string;
    breakdown: string;
  },
  recommendation: {
    selectedNDCs: Array<{
      ndc: string;
      quantity: number;
      packageSize: number;
      totalDispensed: number;
      manufacturer: string;
      status: 'active';
    }>,
    overfill: {
      amount: number;
      percentage: number;
    },
    rationale: string;
  },
  alternatives: [ /* other options */ ],
  warnings: string[];
}
```

**GET /api/v1/drug/search?q={query}**
```typescript
// Response
{
  results: Array<{
    drugName: string;
    rxcui: string;
    strength: string;
    dosageForm: string;
  }>
}
```

**GET /api/v1/ndc/{ndc}**
```typescript
// Response
{
  ndc: string;
  productName: string;
  manufacturer: string;
  packageSize: number;
  packageUnit: string;
  status: 'active' | 'inactive';
  inactivatedDate?: string;
  lastUpdated: string;
}
```

### 11.5 External API Integration

#### 11.5.1 RxNorm API Integration

**Base URL**: `https://rxnav.nlm.nih.gov/REST/`

**Key Endpoints:**
1. **Drug Name to RxCUI**
   - `GET /rxcui.json?name={drugName}`
   - Used for: Normalization
   - Rate Limit: 20/second

2. **RxCUI Details**
   - `GET /rxcui/{rxcui}/properties.json`
   - Used for: Strength, dosage form details
   
3. **NDCs for RxCUI**
   - `GET /rxcui/{rxcui}/ndcs.json`
   - Used for: Finding all NDCs for a drug

**Error Handling:**
- 404: Drug not found → Suggest alternatives
- 429: Rate limited → Use cache, queue request
- 5xx: Service unavailable → Fallback to cache

**Caching Strategy:**
- Cache successful lookups for 7 days
- Cache failed lookups for 1 hour (prevent repeated failures)

---

#### 11.5.2 FDA NDC Directory API Integration

**Base URL**: `https://api.fda.gov/drug/ndc.json`

**Key Endpoint:**
- `GET /drug/ndc.json?search=product_ndc:{ndc}`
- `GET /drug/ndc.json?search=generic_name:{drugName}+AND+marketing_status:active`

**Response Fields Used:**
- `product_ndc` - NDC number
- `generic_name` - Drug name
- `active_ingredients` - Strength info
- `dosage_form` - Form
- `marketing_status` - Active/inactive
- `packaging` - Package sizes

**Rate Limits:**
- Without key: 240/minute, 120,000/day
- With key: 1,000/minute, 240,000/day

**Error Handling:**
- 404: NDC not found → Flag as potentially invalid
- 429: Rate limited → Use cache aggressively
- 5xx: Service unavailable → Fallback to cached data with warning

**Caching Strategy:**
- Cache NDC data for 24 hours
- Refresh inactive NDC list every 12 hours
- Implement request queuing for rate limit management

---

#### 11.5.3 OpenAI API Integration

**Model**: GPT-4o (optimized for structured outputs)

**Use Case**: Complex SIG parsing (fallback only)

**Prompt Template:**
```typescript
const prompt = `You are a pharmacy expert. Parse the following prescription SIG into structured data.

SIG: "${sig}"

Extract:
1. Dose amount (number and unit, e.g., "2 tablets")
2. Frequency (e.g., "twice daily", "BID", "every 8 hours")
3. Special instructions (e.g., "with food", "before bed")
4. Duration or conditions (e.g., "for 10 days", "as needed")

Respond ONLY with valid JSON:
{
  "dose_amount": number,
  "dose_unit": "string",
  "frequency_times_per_day": number,
  "special_instructions": "string",
  "is_prn": boolean,
  "max_daily_dose": number | null
}`;
```

**Rate Limiting:**
- Max 500 requests/day (cost control)
- Prefer rule-based parsing (70% of cases)
- Only use AI for ambiguous SIGs

**Error Handling:**
- API failure → Fall back to rule-based parser
- Invalid JSON → Retry once, then manual review
- Cost alerts at 80% of daily budget

---

### 11.6 Deployment Architecture

#### 11.6.1 Firebase Project Structure

```
foundation-health-ndc-calculator/
├── (default) - Production
├── staging - Pre-production testing
└── development - Development environment
```

**Environment Variables** (stored in Secret Manager):
```
FDA_API_KEY=<secret>
OPENAI_API_KEY=<secret>
RXNORM_API_BASE_URL=https://rxnav.nlm.nih.gov/REST
FDA_API_BASE_URL=https://api.fda.gov
```

#### 11.6.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: foundation-health-ndc-calculator
          channelId: live
```

**Deployment Flow:**
1. Push to branch triggers workflow
2. Run linting and tests
3. Build production bundle
4. Deploy to corresponding Firebase project
5. Run smoke tests
6. Notify team in Slack

---

## 12. API Integration Strategy

### 12.1 Rate Limiting & Quota Management

#### 12.1.1 Request Budgets

**RxNorm API:**
- Budget: 20 requests/second, 20,000/day
- Strategy: Cache aggressively (7-day TTL)
- Expected usage: ~500 unique drugs/day → 500 requests/day
- Headroom: 97.5% under limit

**FDA NDC API:**
- Budget: 1,000 requests/minute (with key)
- Strategy: Batch requests, 24-hour cache
- Expected usage: ~2,000 NDC lookups/day → ~2 requests/minute
- Headroom: 99.8% under limit

**OpenAI API:**
- Budget: 500 requests/day (cost control at $500/month)
- Strategy: Rule-based primary, AI fallback
- Expected usage: ~150 complex SIGs/day (30%)
- Headroom: 70% under limit

#### 12.1.2 Quota Management Implementation

```typescript
// Cloud Function: Rate Limiter Middleware
export const rateLimiter = async (
  apiName: 'rxnorm' | 'fda' | 'openai',
  requestFn: () => Promise<any>
): Promise<any> => {
  const quotaDoc = await db
    .collection('api_quotas')
    .doc(apiName)
    .get();
  
  const quota = quotaDoc.data();
  
  if (quota.requestsToday >= quota.dailyLimit) {
    throw new Error(`Daily quota exceeded for ${apiName}`);
  }
  
  // Execute request
  const result = await requestFn();
  
  // Update quota
  await quotaDoc.ref.update({
    requestsToday: FieldValue.increment(1),
    lastRequestAt: FieldValue.serverTimestamp()
  });
  
  return result;
};
```

### 12.2 Caching Strategy Details

#### 12.2.1 Cache Hierarchy

**Level 1: Client-Side (Browser)**
- Session storage for current calculation
- No persistent cache (security concern)

**Level 2: Firestore (Server-Side)**
- RxNorm mappings: 7-day TTL
- NDC data: 24-hour TTL
- Inactive NDC list: 12-hour TTL
- Automatic cleanup via TTL indexes

**Level 3: API Cache Headers**
- Respect `Cache-Control` headers from APIs
- Max age: 1 day for NDC data

#### 12.2.2 Cache Invalidation

**Automatic:**
- Firestore TTL indexes (built-in)
- Daily refresh job via Cloud Scheduler

**Manual:**
- Admin trigger: "Refresh NDC data now"
- Individual cache entry deletion

**Implementation:**
```typescript
// Scheduled function (runs daily at 2 AM UTC)
export const refreshNDCCache = functions
  .pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    // Fetch latest inactive NDCs from FDA
    const inactiveNDCs = await fetchInactiveNDCs();
    
    // Update Firestore
    const batch = db.batch();
    inactiveNDCs.forEach(ndc => {
      const docRef = db.collection('inactive_ndcs').doc(ndc.ndc);
      batch.set(docRef, {
        ...ndc,
        cachedAt: FieldValue.serverTimestamp(),
        ttl: Timestamp.fromDate(new Date(Date.now() + 12 * 60 * 60 * 1000))
      });
    });
    
    await batch.commit();
    
    console.log(`Refreshed ${inactiveNDCs.length} inactive NDCs`);
  });
```

### 12.3 Error Handling & Fallback

#### 12.3.1 API Failure Scenarios

**Scenario 1: RxNorm API Unavailable**
```typescript
async function normalizeRxNorm(drugName: string) {
  try {
    // Try cache first
    const cached = await getCachedRxNorm(drugName);
    if (cached && !isCacheExpired(cached)) {
      return cached;
    }
    
    // API call
    const result = await rxNormAPI.getRxCUI(drugName);
    await cacheRxNorm(drugName, result);
    return result;
    
  } catch (error) {
    // Fallback to expired cache
    const staleCache = await getCachedRxNorm(drugName);
    if (staleCache) {
      return {
        ...staleCache,
        warning: 'Using cached data - RxNorm API unavailable'
      };
    }
    
    // Last resort: direct NDC input mode
    return {
      rxcui: null,
      fallbackMode: 'direct_ndc_input',
      message: 'Drug normalization unavailable. Please enter NDC directly.'
    };
  }
}
```

**Scenario 2: FDA NDC API Unavailable**
```typescript
async function validateNDC(ndc: string) {
  try {
    const cached = await getCachedNDC(ndc);
    if (cached && !isCacheExpired(cached)) {
      return cached;
    }
    
    const result = await fdaAPI.getNDCInfo(ndc);
    await cacheNDC(ndc, result);
    return result;
    
  } catch (error) {
    const staleCache = await getCachedNDC(ndc);
    if (staleCache) {
      return {
        ...staleCache,
        warning: 'NDC data may be outdated - FDA API unavailable'
      };
    }
    
    // Allow with warning
    return {
      ndc: ndc,
      status: 'unknown',
      warning: 'Cannot verify NDC status. Proceed with caution.',
      requiresPharmacistApproval: true
    };
  }
}
```

**Scenario 3: OpenAI API Unavailable**
```typescript
async function parseSIG(sig: string) {
  // Always try rule-based first
  const ruleBasedResult = parseWithRegex(sig);
  
  if (ruleBasedResult.confidence > 0.9) {
    return ruleBasedResult;
  }
  
  // Complex SIG - try OpenAI
  try {
    const aiResult = await openAI.parse(sig);
    return aiResult;
  } catch (error) {
    // Fallback to rule-based with warning
    return {
      ...ruleBasedResult,
      confidence: Math.max(0.5, ruleBasedResult.confidence),
      warning: 'AI parsing unavailable. Using pattern matching.',
      requiresManualReview: true
    };
  }
}
```

### 12.4 API Request Optimization

#### 12.4.1 Batching Strategy

**Batch NDC Lookups:**
```typescript
// Instead of N individual requests, batch them
async function batchNDCLookup(rxcui: string) {
  // Get all NDCs for RxCUI in one request
  const allNDCs = await rxNormAPI.getNDCsForRxCUI(rxcui);
  
  // Batch validate with FDA (up to 100 at once)
  const ndcChunks = chunk(allNDCs, 100);
  const validationResults = await Promise.all(
    ndcChunks.map(chunk => 
      fdaAPI.batchValidate(chunk)
    )
  );
  
  return validationResults.flat();
}
```

#### 12.4.2 Parallel Processing

```typescript
async function calculatePrescription(input: CalculationInput) {
  // Parallelize independent operations
  const [normalizedDrug, packageSizes, inactiveList] = await Promise.all([
    normalizeRxNorm(input.drugName),
    getPackageSizes(input.drugName),
    getInactiveNDCs()
  ]);
  
  // Sequential operations that depend on above
  const quantity = calculateQuantity(normalizedDrug, input.sig, input.daysSupply);
  const recommendation = optimizePackages(quantity, packageSizes, inactiveList);
  
  return recommendation;
}
```

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

```
                    ▲
                   ╱ ╲
                  ╱   ╲
                 ╱  E2E ╲           10% - Full user flows
                ╱───────╲
               ╱         ╲
              ╱Integration╲         20% - API integrations
             ╱─────────────╲
            ╱               ╲
           ╱  Unit Tests     ╲      70% - Logic, calculations
          ╱───────────────────╲
         ╱                     ╲
        ╱_______________________╲
```

### 13.2 Unit Testing

**Framework**: Vitest (fast, TypeScript native)

**Coverage Target**: 80%+ overall, 95%+ for calculation logic

#### 13.2.1 Test Categories

**Calculation Logic Tests:**
```typescript
// tests/unit/calculations.test.ts

describe('Quantity Calculator', () => {
  it('should calculate daily tablet quantity correctly', () => {
    const result = calculateQuantity({
      sig: 'Take 2 tablets daily',
      daysSupply: 30
    });
    
    expect(result.totalQuantity).toBe(60);
    expect(result.unit).toBe('tablets');
  });
  
  it('should handle complex SIG instructions', () => {
    const result = calculateQuantity({
      sig: 'Take 2 tablets TID for 7 days, then 1 tablet TID',
      daysSupply: 30
    });
    
    // 2 tabs × 3 times/day × 7 days = 42
    // 1 tab × 3 times/day × 23 days = 69
    expect(result.totalQuantity).toBe(111);
  });
  
  it('should handle PRN medications', () => {
    const result = calculateQuantity({
      sig: 'Take 1-2 tablets every 4-6 hours as needed',
      daysSupply: 30,
      maxDailyDose: 8
    });
    
    // Max: 2 tablets × 6 times (q4h) = 12, but limited to 8
    expect(result.totalQuantity).toBe(240); // 8 × 30
    expect(result.isPRN).toBe(true);
  });
});
```

**Package Optimization Tests:**
```typescript
describe('Package Optimizer', () => {
  it('should prefer single package when possible', () => {
    const result = optimizePackages({
      totalQuantity: 90,
      availablePackages: [30, 60, 90, 100]
    });
    
    expect(result.recommendation.packages).toEqual([
      { size: 90, quantity: 1 }
    ]);
    expect(result.recommendation.overfill).toBe(0);
  });
  
  it('should minimize overfill within tolerance', () => {
    const result = optimizePackages({
      totalQuantity: 65,
      availablePackages: [30, 60, 90, 100]
    });
    
    expect(result.recommendation.packages).toEqual([
      { size: 90, quantity: 1 }
    ]);
    expect(result.recommendation.overfill).toBe(25);
    expect(result.recommendation.overfillPercentage).toBeCloseTo(38.5, 1);
  });
  
  it('should handle multi-pack optimization', () => {
    const result = optimizePackages({
      totalQuantity: 240,
      availablePackages: [30, 60, 90, 100]
    });
    
    // Should prefer 2×120 or 3×90 (fewer packages)
    // Since 120 not available, 3×90 = 270 (30 overfill, 12.5%)
    expect(result.recommendation.packages.length).toBeLessThanOrEqual(3);
  });
});
```

**Special Dosage Form Tests:**
```typescript
describe('Liquid Medications', () => {
  it('should calculate volume correctly', () => {
    const result = calculateLiquidQuantity({
      sig: '10 mL TID',
      daysSupply: 10
    });
    
    expect(result.totalQuantity).toBe(300);
    expect(result.unit).toBe('mL');
  });
  
  it('should recommend appropriate bottle sizes', () => {
    const result = optimizeLiquidPackages({
      totalQuantity: 300,
      availableBottles: [100, 150, 237, 473] // mL
    });
    
    expect(result.recommendation.packages).toEqual([
      { size: 150, quantity: 2 }
    ]);
  });
});

describe('Insulin Calculations', () => {
  it('should calculate units correctly', () => {
    const result = calculateInsulinQuantity({
      sig: '25 units daily',
      daysSupply: 30
    });
    
    expect(result.totalQuantity).toBe(750);
    expect(result.unit).toBe('units');
  });
  
  it('should recommend pens vs vials appropriately', () => {
    const lowDose = recommendInsulinPackage({ unitsNeeded: 600 });
    expect(lowDose.type).toBe('pens');
    expect(lowDose.quantity).toBe(2); // 2 pens (300 units each)
    
    const highDose = recommendInsulinPackage({ unitsNeeded: 2500 });
    expect(highDose.type).toBe('vials');
    expect(highDose.quantity).toBe(3); // 3 vials (1000 units each)
  });
});
```

**SIG Parser Tests:**
```typescript
describe('SIG Parser - LLM-Based', () => {
  const testCases = [
    { 
      sig: 'Take 1 tablet daily', 
      expected: { dose: 1, frequency: 1, unit: 'tablet' } 
    },
    { 
      sig: '2 caps BID', 
      expected: { dose: 2, frequency: 2, unit: 'capsule' } 
    },
    { 
      sig: 'Take 2 tablets TID', 
      expected: { dose: 2, frequency: 3, unit: 'tablet' } 
    },
    { 
      sig: '1 tab QID', 
      expected: { dose: 1, frequency: 4, unit: 'tablet' } 
    },
    { 
      sig: 'Apply 5 mL to affected area BID', 
      expected: { dose: 5, frequency: 2, unit: 'mL' } 
    },
    {
      sig: 'Take 3 tablets daily for 5 days, then 2 tablets daily',
      expected: { 
        complex: true, 
        phases: [
          { dose: 3, frequency: 1, days: 5 },
          { dose: 2, frequency: 1 }
        ]
      }
    }
  ];
  
  testCases.forEach(({ sig, expected }) => {
    it(`should parse: "${sig}"`, async () => {
      const result = await parseSIGWithLLM(sig);
      
      if (expected.complex) {
        expect(result.phases).toHaveLength(expected.phases.length);
        expected.phases.forEach((phase, i) => {
          expect(result.phases[i].dose).toBe(phase.dose);
          expect(result.phases[i].frequency).toBe(phase.frequency);
        });
      } else {
        expect(result.dose).toBe(expected.dose);
        expect(result.frequency).toBe(expected.frequency);
        expect(result.unit).toBe(expected.unit);
      }
    });
  });
  
  it('should handle ambiguous instructions', async () => {
    const result = await parseSIGWithLLM('Take as directed');
    
    expect(result.requiresManualReview).toBe(true);
    expect(result.confidence).toBeLessThan(0.7);
  });
  
  it('should handle errors gracefully', async () => {
    // Mock OpenAI failure
    mockOpenAI.mockRejectedValue(new Error('API unavailable'));
    
    const result = await parseSIGWithLLM('Take 2 tablets daily');
    
    expect(result.error).toBe(true);
    expect(result.fallbackUsed).toBe(true);
  });
});
```

### 13.3 Integration Testing

**Framework**: Vitest + Firebase Emulators

**Coverage**: API integrations, Firestore operations

#### 13.3.1 API Integration Tests

```typescript
describe('RxNorm API Integration', () => {
  beforeAll(() => {
    // Use actual API in integration tests (not production)
    process.env.RXNORM_API_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';
  });
  
  it('should normalize common drug name', async () => {
    const result = await normalizeRxNorm('metformin 500mg');
    
    expect(result.rxcui).toBeTruthy();
    expect(result.drugName).toContain('Metformin');
    expect(result.confidence).toBeGreaterThan(0.9);
  }, 10000); // 10s timeout for API call
  
  it('should handle ambiguous drug names', async () => {
    const result = await normalizeRxNorm('insulin');
    
    expect(result.alternatives).toBeTruthy();
    expect(result.alternatives.length).toBeGreaterThan(1);
  });
  
  it('should cache results properly', async () => {
    const first = await normalizeRxNorm('lisinopril 10mg');
    const second = await normalizeRxNorm('lisinopril 10mg');
    
    // Second call should be from cache (much faster)
    expect(second.fromCache).toBe(true);
  });
});

describe('FDA NDC API Integration', () => {
  it('should validate active NDC', async () => {
    const result = await validateNDC('00093-7214-01'); // Teva metformin
    
    expect(result.status).toBe('active');
    expect(result.manufacturer).toBeTruthy();
  }, 10000);
  
  it('should detect inactive NDC', async () => {
    const result = await validateNDC('12345-678-90'); // Fake NDC
    
    expect(result.status).toBe('inactive' || 'not_found');
  });
});
```

#### 13.3.2 Firestore Integration Tests

```typescript
describe('Firestore Operations', () => {
  let testUserId: string;
  
  beforeAll(async () => {
    await firebase.initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'test-user' }
    });
  });
  
  it('should save calculation to Firestore', async () => {
    const calculation = {
      input: { drugName: 'metformin 500mg', sig: 'Take 2 tablets daily', daysSupply: 90 },
      result: { totalQuantity: 180, selectedNDCs: [...] }
    };
    
    const docRef = await saveCalculation(calculation);
    
    expect(docRef.id).toBeTruthy();
    
    // Verify saved
    const doc = await docRef.get();
    expect(doc.exists).toBe(true);
    expect(doc.data().result.totalQuantity).toBe(180);
  });
  
  it('should retrieve user calculation history', async () => {
    const history = await getUserCalculations('test-user');
    
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });
});
```

### 13.4 End-to-End Testing

**Framework**: Playwright

**Coverage**: Critical user flows

#### 13.4.1 E2E Test Scenarios

```typescript
// tests/e2e/calculation-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Basic Calculation Flow', () => {
  test('should calculate prescription successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Enter drug name
    await page.fill('[data-testid="drug-name-input"]', 'metformin 500mg');
    await page.waitForSelector('[data-testid="autocomplete-results"]');
    await page.click('[data-testid="autocomplete-option-0"]');
    
    // Enter SIG
    await page.fill('[data-testid="sig-input"]', 'Take 2 tablets daily');
    
    // Enter days' supply
    await page.fill('[data-testid="days-supply-input"]', '90');
    
    // Calculate
    await page.click('[data-testid="calculate-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="results-container"]');
    
    // Verify results
    const totalQuantity = await page.textContent('[data-testid="total-quantity"]');
    expect(totalQuantity).toContain('180');
    
    const recommendedNDC = await page.textContent('[data-testid="recommended-ndc"]');
    expect(recommendedNDC).toBeTruthy();
    
    const status = await page.textContent('[data-testid="ndc-status"]');
    expect(status).toContain('Active');
  });
  
  test('should handle inactive NDC warning', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Direct NDC input
    await page.fill('[data-testid="ndc-input"]', '12345-678-90'); // Inactive NDC
    await page.fill('[data-testid="sig-input"]', 'Take 1 tablet daily');
    await page.fill('[data-testid="days-supply-input"]', '30');
    
    await page.click('[data-testid="calculate-button"]');
    
    // Verify warning displayed
    await page.waitForSelector('[data-testid="warning-inactive-ndc"]');
    const warningText = await page.textContent('[data-testid="warning-inactive-ndc"]');
    expect(warningText).toContain('inactive');
    
    // Verify alternative suggested
    const alternative = await page.textContent('[data-testid="alternative-ndc"]');
    expect(alternative).toBeTruthy();
  });
});

test.describe('Special Dosage Forms', () => {
  test('should calculate insulin correctly', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    await page.fill('[data-testid="drug-name-input"]', 'insulin glargine');
    await page.click('[data-testid="autocomplete-option-0"]');
    await page.fill('[data-testid="sig-input"]', '20 units daily');
    await page.fill('[data-testid="days-supply-input"]', '30');
    
    await page.click('[data-testid="calculate-button"]');
    
    await page.waitForSelector('[data-testid="results-container"]');
    
    const totalUnits = await page.textContent('[data-testid="total-quantity"]');
    expect(totalUnits).toContain('600 units');
    
    // Check pen recommendation
    const packageType = await page.textContent('[data-testid="package-type"]');
    expect(packageType).toContain('pen' || 'Pen');
  });
});
```

### 13.5 Performance Testing

**Framework**: k6 (load testing)

```javascript
// tests/performance/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Spike to 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    http_req_failed: ['rate<0.02'],    // Error rate < 2%
  },
};

export default function () {
  const payload = JSON.stringify({
    drugName: 'metformin 500mg',
    sig: 'Take 2 tablets daily',
    daysSupply: 90,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  };
  
  const res = http.post('https://api.example.com/v1/calculate', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has calculation result': (r) => JSON.parse(r.body).recommendation !== undefined,
  });
  
  sleep(1);
}
```

### 13.6 Test Data Strategy

#### 13.6.1 Test Data Sources

**Real Drug Data:**
- Top 200 prescribed medications in US
- Common antibiotics, chronic disease medications
- Special forms (insulin, inhalers, liquids)

**Sources:**
1. **FDA Orange Book** - Generic drugs
2. **RxNorm** - Drug names and codes
3. **CMS Top Drugs** - High-volume medications
4. **Pharmacy Associations** - Common prescriptions

#### 13.6.2 Test Data Sets

**Dataset 1: Common Medications (50 drugs)**
```typescript
const commonDrugs = [
  { name: 'metformin 500mg', rxcui: '860975', category: 'diabetes' },
  { name: 'lisinopril 10mg', rxcui: '314076', category: 'cardiovascular' },
  { name: 'atorvastatin 20mg', rxcui: '617318', category: 'cholesterol' },
  { name: 'amoxicillin 500mg', rxcui: '308192', category: 'antibiotic' },
  // ... 46 more
];
```

**Dataset 2: Special Dosage Forms (30 drugs)**
```typescript
const specialForms = [
  { name: 'insulin glargine', type: 'injectable', unit: 'units' },
  { name: 'albuterol HFA', type: 'inhaler', unit: 'actuations' },
  { name: 'amoxicillin suspension', type: 'liquid', unit: 'mL' },
  // ... 27 more
];
```

**Dataset 3: Edge Cases (40 scenarios)**
```typescript
const edgeCases = [
  { scenario: 'Tapering dose', sig: 'Take 3 tabs daily for 5 days, then 2 tabs daily for 5 days, then 1 tab daily' },
  { scenario: 'Compound instruction', sig: 'Take 1 tab in AM and 2 tabs in PM' },
  { scenario: 'PRN with max', sig: 'Take 1-2 tabs every 4-6 hours as needed, max 8 tablets/day' },
  // ... 37 more
];
```

**Dataset 4: Error Scenarios (20 cases)**
```typescript
const errorCases = [
  { type: 'inactive_ndc', ndc: '12345-678-90' },
  { type: 'invalid_ndc_format', ndc: '123-456' },
  { type: 'ambiguous_sig', sig: 'Take as directed' },
  { type: 'missing_drug', name: 'xyzabc123' },
  // ... 16 more
];
```

#### 13.6.3 Test Data Management

**Storage:**
- Test data in `/tests/fixtures/` directory
- JSON format for easy maintenance
- Version controlled in Git

**Generation:**
```bash
# Script to generate test data
pnpm run generate-test-data

# Validates against live APIs (run weekly)
pnpm run validate-test-data
```

### 13.7 Testing Checklist

**Before Each Release:**
- [ ] All unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests for critical flows passing
- [ ] Performance tests meet thresholds (<2s p95)
- [ ] Accessibility audit (WCAG AA)
- [ ] Security scan (no high/critical vulnerabilities)
- [ ] Browser compatibility checked
- [ ] Mobile responsiveness verified (tablets)
- [ ] API rate limits tested
- [ ] Error handling scenarios validated

**Smoke Tests (Production):**
- [ ] Login/authentication works
- [ ] Basic calculation completes successfully
- [ ] API keys valid and working
- [ ] Caching functioning properly
- [ ] Monitoring dashboards accessible

---

## 14. Deployment Strategy

### 14.1 Environment Setup

#### 14.1.1 Development Environment
**Purpose**: Local development, rapid iteration

**Configuration:**
- Firebase Emulator Suite (local APIs)
- Hot module reloading (HMR)
- Mock external APIs for faster testing
- Debug logging enabled

**Access**: All developers

---

#### 14.1.2 Staging Environment
**Purpose**: Pre-production testing, QA validation

**Configuration:**
- Dedicated Firebase project: `foundation-health-ndc-staging`
- Real API integrations (test keys)
- Production-like data (sanitized)
- Performance monitoring enabled

**Access**: Developers, QA, Product team

**URL**: `https://staging.ndc-calculator.foundationhealth.com`

---

#### 14.1.3 Production Environment
**Purpose**: Live user traffic

**Configuration:**
- Firebase project: `foundation-health-ndc-prod`
- Production API keys (rate-limited)
- Full monitoring and alerting
- Backup and disaster recovery

**Access**: Limited (DevOps, on-call engineers)

**URL**: `https://ndc-calculator.foundationhealth.com`

---

### 14.2 Deployment Process

#### 14.2.1 Development → Staging

**Trigger**: Merge to `staging` branch

**Steps:**
1. Automated tests run (unit, integration)
2. Build production bundle
3. Deploy to Firebase Staging
4. Run smoke tests
5. Notify in Slack: #ndc-deployments

**Rollback**: Manual via Firebase Hosting versions

---

#### 14.2.2 Staging → Production

**Trigger**: Manual approval after QA signoff

**Pre-Deployment Checklist:**
- [ ] All tests passing in staging
- [ ] QA approval obtained
- [ ] Product owner signoff
- [ ] Release notes prepared
- [ ] Monitoring dashboards ready
- [ ] Rollback plan documented

**Steps:**
1. Create release tag (e.g., `v1.2.0`)
2. Deploy to production (blue-green deployment)
3. Run smoke tests
4. Monitor error rates for 15 minutes
5. Announce in #ndc-announcements

**Rollback**: One-click revert to previous version

---

### 14.3 Blue-Green Deployment

**Strategy**: Zero-downtime deployments

**Process:**
1. Deploy new version to "green" environment
2. Run automated health checks
3. Route 10% of traffic to green (canary)
4. Monitor metrics for 5 minutes
5. If healthy, route 100% to green
6. If issues detected, instant rollback to blue

**Firebase Implementation:**
```bash
# Deploy to preview channel
firebase hosting:channel:deploy preview-v1.2.0

# Test preview
npm run smoke-test:preview

# Promote to live
firebase hosting:channel:deploy live --alias preview-v1.2.0
```

---

### 14.4 Database Migrations

**Firestore Schema Changes:**

**Process:**
1. Write migration script
2. Test in staging
3. Schedule maintenance window (if needed)
4. Run migration
5. Verify data integrity

**Example Migration:**
```typescript
// migrations/001_add_ttl_indexes.ts

export async function migrate() {
  const db = admin.firestore();
  
  // Add TTL index to cache_rxnorm collection
  await db.collection('cache_rxnorm').doc('_config').set({
    ttlEnabled: true,
    ttlField: 'ttl',
    ttlSeconds: 604800 // 7 days
  });
  
  console.log('Migration 001 complete');
}
```

---

### 14.5 Rollback Procedures

#### 14.5.1 Frontend Rollback
**Trigger**: High error rate, critical bug

**Steps:**
1. Identify previous stable version
2. Click "Rollback" in Firebase Console
3. Verify version deployed
4. Monitor metrics
5. Notify team

**Time to Rollback**: <5 minutes

---

#### 14.5.2 Backend (Cloud Functions) Rollback
**Steps:**
```bash
# List previous versions
firebase functions:list --project prod

# Rollback specific function
firebase functions:deploy calculatePrescription --version 42

# Or rollback all
firebase deploy --only functions --project prod --version 42
```

---

#### 14.5.3 Database Rollback
**Strategy**: Forward-only migrations (no rollback)

**If needed:**
1. Restore from backup
2. Replay transaction log
3. Validate data integrity

**Backup Schedule**: Daily at 3 AM UTC

---

### 14.6 Monitoring Deployment Health

#### 14.6.1 Deployment Metrics
- **Error Rate**: <2% (alert if >5%)
- **Response Time p95**: <2s (alert if >3s)
- **API Success Rate**: >98%
- **User Sessions**: Monitor for drop-offs

#### 14.6.2 Automated Alerts
**Slack Integration:**
- Deployment started/completed
- Error rate spike
- Response time degradation
- API failure

**PagerDuty Integration:**
- Critical errors (page on-call)
- Service down
- Data loss risk

---

## 15. Monitoring & Operations

### 15.1 Monitoring Stack

**Tools:**
- **Firebase Performance Monitoring** - Frontend performance
- **Cloud Logging** - Centralized logs
- **Cloud Monitoring** - Metrics and dashboards
- **Firebase Crashlytics** - Error tracking
- **Uptime Checks** - Service availability

---

### 15.2 Key Metrics & Dashboards

#### 15.2.1 User Experience Metrics

**Dashboard: "User Experience"**

**Metrics:**
1. **Page Load Time**
   - Target: <1s (p95)
   - Alert: >2s

2. **API Response Time**
   - Target: <2s (p95)
   - Alert: >3s

3. **Error Rate**
   - Target: <2%
   - Alert: >5%

4. **Session Duration**
   - Baseline: 3-5 minutes
   - Alert: >50% drop

5. **Task Success Rate**
   - Target: >90%
   - Alert: <80%

---

#### 15.2.2 System Health Metrics

**Dashboard: "System Health"**

**Metrics:**
1. **Cloud Functions Execution Count**
   - Monitor: Sudden spikes or drops

2. **Firestore Read/Write Operations**
   - Budget: 100K reads/day, 10K writes/day
   - Alert: >80% of budget

3. **API Quota Usage**
   - RxNorm: <50% of daily limit
   - FDA: <50% of daily limit
   - OpenAI: <80% of daily budget

4. **Cache Hit Rate**
   - Target: >70%
   - Alert: <50%

5. **Function Cold Start Rate**
   - Target: <10%
   - Optimize: If >20%

---

#### 15.2.3 Business Metrics

**Dashboard: "Business KPIs"**

**Metrics:**
1. **Calculations per Day**
   - Track trends
   - Compare to goals

2. **Normalization Success Rate**
   - Target: >95%
   - Alert: <90%

3. **Inactive NDC Detection Rate**
   - Track: # of inactive NDCs caught

4. **User Satisfaction (NPS)**
   - Survey: Monthly
   - Target: >50

5. **Cost per Calculation**
   - Monitor: API costs
   - Budget: <$0.10 per calculation

---

### 15.3 Logging Strategy

#### 15.3.1 Log Levels

**DEBUG**: Development only
```typescript
logger.debug('Attempting RxNorm API call', { drugName });
```

**INFO**: Normal operations
```typescript
logger.info('Calculation completed', { calculationId, duration: '1.2s' });
```

**WARNING**: Unexpected but handled
```typescript
logger.warn('Using cached data due to API unavailability', { api: 'rxnorm' });
```

**ERROR**: Errors requiring attention
```typescript
logger.error('Failed to validate NDC', { ndc, error: error.message });
```

**CRITICAL**: Service-affecting issues
```typescript
logger.critical('Database connection lost', { dbName: 'firestore' });
```

---

#### 15.3.2 Structured Logging

**Format:**
```json
{
  "timestamp": "2025-11-10T14:30:45.123Z",
  "severity": "INFO",
  "message": "Calculation completed successfully",
  "context": {
    "userId": "user_123",
    "calculationId": "calc_789",
    "drugName": "metformin 500mg",
    "durationMs": 1234,
    "apiCalls": {
      "rxnorm": 1,
      "fda": 2,
      "openai": 0
    }
  }
}
```

---

### 15.4 Alerting Rules

#### 15.4.1 Critical Alerts (PagerDuty)

**Alert 1: Service Down**
- **Condition**: Uptime check fails for >2 minutes
- **Action**: Page on-call engineer
- **Response Time**: <15 minutes

**Alert 2: High Error Rate**
- **Condition**: Error rate >10% for >5 minutes
- **Action**: Page on-call engineer
- **Response Time**: <15 minutes

**Alert 3: Database Issues**
- **Condition**: Firestore errors >20/minute
- **Action**: Page database administrator
- **Response Time**: <30 minutes

---

#### 15.4.2 Warning Alerts (Slack)

**Alert 1: Elevated Error Rate**
- **Condition**: Error rate 5-10% for >5 minutes
- **Action**: Notify #ndc-alerts
- **Review**: Within 1 hour

**Alert 2: API Rate Limit Approaching**
- **Condition**: >80% of rate limit used
- **Action**: Notify #ndc-alerts
- **Review**: Within 4 hours

**Alert 3: Cache Hit Rate Low**
- **Condition**: <50% cache hit rate for >30 minutes
- **Action**: Notify #ndc-alerts
- **Review**: Within 24 hours

**Alert 4: Slow Response Times**
- **Condition**: p95 response time >3s for >10 minutes
- **Action**: Notify #ndc-alerts
- **Review**: Within 2 hours

---

### 15.5 Incident Response

#### 15.5.1 Incident Severity Levels

**SEV-1: Critical** - Service down or major data loss
- **Response**: Immediate page
- **Resolution Target**: <1 hour
- **Post-Incident Review**: Required

**SEV-2: High** - Partial outage or high error rates
- **Response**: <15 minutes
- **Resolution Target**: <4 hours
- **Post-Incident Review**: Required

**SEV-3: Medium** - Degraded performance
- **Response**: <1 hour
- **Resolution Target**: <24 hours
- **Post-Incident Review**: Optional

**SEV-4: Low** - Minor issues or bugs
- **Response**: <4 hours
- **Resolution Target**: <1 week
- **Post-Incident Review**: No

---

#### 15.5.2 Incident Response Process

**Phase 1: Detection & Triage (0-5 minutes)**
1. Alert received (PagerDuty or Slack)
2. On-call engineer acknowledges
3. Assess severity
4. Create incident channel (#incident-YYYY-MM-DD-N)

**Phase 2: Investigation & Mitigation (5-30 minutes)**
1. Review logs and metrics
2. Identify root cause
3. Implement immediate mitigation (rollback, scaling, etc.)
4. Update incident channel with status

**Phase 3: Resolution (30 minutes - 4 hours)**
1. Deploy fix
2. Verify resolution
3. Monitor metrics
4. Close incident

**Phase 4: Post-Incident Review (Within 48 hours)**
1. Document timeline
2. Identify root cause
3. Create action items
4. Update runbooks

---

### 15.6 Operational Runbooks

#### 15.6.1 Runbook: High Error Rate

**Symptoms:** Error rate >5%

**Steps:**
1. Check Cloud Logging for error patterns
2. Identify affected component (frontend, API, database)
3. If API issue: Check external API status pages
4. If database issue: Check Firestore metrics
5. If code issue: Rollback to previous version
6. If external dependency: Enable fallback mode
7. Monitor for resolution

---

#### 15.6.2 Runbook: Slow Response Times

**Symptoms:** p95 response time >3s

**Steps:**
1. Check Cloud Monitoring dashboard
2. Identify slow component:
   - Frontend: Check bundle size, network
   - Backend: Check function cold starts
   - APIs: Check external API response times
   - Database: Check query performance
3. Mitigations:
   - Increase Cloud Function memory
   - Optimize database indexes
   - Enable more aggressive caching
   - Contact external API support
4. Monitor metrics

---

#### 15.6.3 Runbook: API Rate Limit Reached

**Symptoms:** 429 errors from external APIs

**Steps:**
1. Identify which API (RxNorm, FDA, OpenAI)
2. Check quota dashboard
3. Immediate mitigation:
   - Enable aggressive caching
   - Queue non-critical requests
   - Use cached data (with warnings)
4. Long-term:
   - Request higher rate limits
   - Optimize API usage
   - Implement request batching

---

### 15.7 Cost Monitoring

#### 15.7.1 Cost Budget

**Monthly Budget:** $2,000 (MVP), $5,000 (Production)

**Cost Breakdown:**
- Firebase Hosting: $50/month
- Cloud Functions: $200-400/month (compute)
- Firestore: $100-200/month (storage + operations)
- OpenAI API: $750-2,000/month (all intelligent processing)
  - 10K calculations: ~$750
  - 25K calculations: ~$1,875
  - Cost per calculation: ~$0.075
- FDA API: $0 (free with key)
- RxNorm API: $0 (free)
- Monitoring: $100/month

**Notes:**
- OpenAI is now the primary cost driver (50-60% of budget)
- Cost scales linearly with usage
- Break-even at ~$10 saved per calculation vs. manual errors

---

#### 15.7.2 Cost Optimization Strategies

1. **Caching**: Reduce RxNorm/FDA API calls by 80-90%
2. **Request Batching**: Minimize API round-trips for FDA queries
3. **Smart OpenAI Usage**: 
   - Cache similar calculations (same drug + similar SIG)
   - Optimize prompts to reduce token usage
   - Use structured outputs to minimize parsing
4. **Firestore Indexes**: Optimize queries to reduce reads
5. **Function Memory**: Right-size function memory allocation (512MB optimal)

---

## 16. Integration Roadmap

### 16.1 Phase 1: Standalone Web App (Weeks 1-8)

**Deliverables:**
- Fully functional web application
- User authentication and roles
- Core calculation features (P0)
- Basic reporting dashboard

**Integration Points:**
- None (standalone)

---

### 16.2 Phase 2: API-First Integration (Weeks 9-16)

**Deliverables:**
- RESTful API with authentication
- API documentation (OpenAPI spec)
- Rate limiting and monitoring
- Webhook support

**Integration Approach:**
- Pharmacy systems call our API
- We return structured JSON results
- They display in their UI

**Supported Operations:**
- POST /api/v1/calculate
- GET /api/v1/ndc/{ndc}
- GET /api/v1/drug/search

**Example Integration (Partner Pharmacy System):**
```javascript
// Their code
const response = await fetch('https://api.ndc-calculator.com/v1/calculate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    drugName: 'metformin 500mg',
    sig: 'Take 2 tablets daily',
    daysSupply: 90
  })
});

const result = await response.json();

// Display in their UI
displayRecommendation(result.recommendation);
```

---

### 16.3 Phase 3: HL7 FHIR Integration (Weeks 17-24)

**Deliverables:**
- FHIR R4 compliant endpoints
- Support for MedicationRequest resource
- SMART on FHIR authentication
- FHIR Medication and MedicationDispense resources

**Integration Approach:**
- EHR sends FHIR MedicationRequest
- We process and return FHIR MedicationDispense
- Seamless integration with EHR workflows

**FHIR Resources:**

**Input: MedicationRequest**
```json
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
      "code": "860975",
      "display": "Metformin Hydrochloride 500 MG Oral Tablet"
    }]
  },
  "subject": { "reference": "Patient/123" },
  "dosageInstruction": [{
    "text": "Take 2 tablets daily",
    "timing": {
      "repeat": { "frequency": 1, "period": 1, "periodUnit": "d" }
    },
    "doseAndRate": [{
      "doseQuantity": { "value": 2, "unit": "tablet" }
    }]
  }],
  "dispenseRequest": {
    "quantity": { "value": 180, "unit": "tablet" },
    "expectedSupplyDuration": { "value": 90, "unit": "days" }
  }
}
```

**Output: MedicationDispense**
```json
{
  "resourceType": "MedicationDispense",
  "status": "completed",
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://hl7.org/fhir/sid/ndc",
      "code": "00093-7214-01",
      "display": "Metformin HCl 500mg Tablet"
    }]
  },
  "subject": { "reference": "Patient/123" },
  "quantity": { "value": 200, "unit": "tablet" },
  "daysSupply": { "value": 90, "unit": "days" },
  "whenHandedOver": "2025-11-10T14:30:00Z",
  "note": [{
    "text": "Dispensed 2 bottles of 100 tablets. 20 tablet overfill for patient convenience."
  }]
}
```

---

### 16.4 Integration Options Summary

| Integration Type | Complexity | Timeline | Best For |
|---|---|---|---|
| **Standalone Web App** | Low | 8 weeks | MVP, pilot programs |
| **REST API** | Medium | +8 weeks | Modern pharmacy systems |
| **HL7 FHIR** | High | +8 weeks | EHR integration |
| **HL7 v2 Messages** | Medium | +6 weeks | Legacy systems |
| **Batch File Processing** | Low | +4 weeks | Nightly reconciliation |

---

### 16.5 Recommended Integration Path

**Our Recommendation: API-First (Phase 2)**

**Rationale:**
1. **Flexibility**: Works with any system that can call REST APIs
2. **Speed**: Faster to implement than FHIR
3. **Modern**: Aligns with current industry trends
4. **Scalable**: Easy to add more partners
5. **Future-Proof**: Can add FHIR later without disrupting existing integrations

**Migration Path:**
- Start with standalone web app (MVP)
- Add REST API for first partner integration
- Expand to FHIR when EHR vendors request it

---

## 17. Risk Assessment

### 17.1 Technical Risks

#### Risk 1: External API Reliability
**Description**: RxNorm, FDA, or OpenAI APIs experience outages or degradation

**Impact**: High - Core functionality impaired

**Probability**: Medium - Public APIs, occasional issues

**Mitigation:**
- Aggressive caching (reduces dependency by 80%)
- Fallback mechanisms (stale cache, manual entry)
- Multi-vendor consideration (future)
- SLA monitoring and alerts

**Contingency:**
- Display clear warnings about data freshness
- Allow pharmacist override with approval
- Queue requests for batch processing when service resumes

---

#### Risk 2: API Rate Limiting
**Description**: Exceed rate limits on external APIs

**Impact**: Medium - Temporary service disruption

**Probability**: Low-Medium - Depends on usage volume

**Mitigation:**
- Request rate limiting on our side
- Queue management for peak times
- Obtain API keys (higher limits)
- Cache aggressively

**Contingency:**
- Throttle requests intelligently
- Display "busy" message to users
- Process in batches during off-peak hours

---

#### Risk 3: Data Quality Issues
**Description**: Incorrect or outdated NDC data from FDA

**Impact**: High - Could result in medication errors

**Probability**: Low - FDA data generally reliable

**Mitigation:**
- Cross-validate with multiple sources
- Display last update timestamp
- Pharmacist review required for warnings
- Audit trail of all recommendations

**Contingency:**
- User reporting mechanism for data issues
- Manual override capability
- Regular data quality audits

---

### 17.2 Security Risks

#### Risk 1: Unauthorized Access
**Description**: Unauthorized users access the system

**Impact**: High - Privacy and data security concerns

**Probability**: Low-Medium - Common attack vector

**Mitigation:**
- Firebase Authentication (industry standard)
- Role-based access control
- MFA option for administrators
- Session timeout (30 minutes)
- API key rotation

**Contingency:**
- Immediate password reset
- Audit log review
- Revoke compromised keys

---

#### Risk 2: API Key Exposure
**Description**: API keys leaked or compromised

**Impact**: High - Unauthorized usage, cost

**Probability**: Low - Keys stored in Secret Manager

**Mitigation:**
- Secret Manager for key storage
- Never commit keys to Git
- Rotate keys quarterly
- Rate limiting per key
- Cost alerts

**Contingency:**
- Immediate key rotation
- Review usage logs
- Block suspicious IPs

---

### 17.3 Operational Risks

#### Risk 1: Insufficient Testing
**Description**: Bugs reach production due to inadequate testing

**Impact**: Medium-High - User frustration, accuracy issues

**Probability**: Medium - Complex calculations

**Mitigation:**
- Comprehensive test suite (200+ test cases)
- Multiple testing phases (unit, integration, E2E)
- QA review before production
- Pilot program with limited users
- Phased rollout

**Contingency:**
- Fast rollback capability
- Incident response procedures
- User communication plan

---

#### Risk 2: Scalability Issues
**Description**: System unable to handle user load

**Impact**: High - Service degradation

**Probability**: Low - Firebase auto-scales

**Mitigation:**
- Load testing before launch
- Firebase auto-scaling
- Monitoring and alerts
- Performance optimization

**Contingency:**
- Increase Cloud Function memory
- Optimize slow queries
- Temporary request throttling

---

### 17.4 Regulatory & Compliance Risks

#### Risk 1: HIPAA Compliance
**Description**: Inadvertent storage of PHI

**Impact**: Critical - Legal and financial consequences

**Probability**: Low - Design avoids PHI

**Mitigation:**
- No PHI storage (by design)
- Only drug names and NDCs stored
- No patient information collected
- Privacy policy and terms of service
- Regular compliance audits

**Contingency:**
- Immediate data purge if PHI detected
- Legal counsel engagement
- User notification per breach laws

---

#### Risk 2: FDA Regulatory Requirements
**Description**: System categorized as medical device requiring FDA approval

**Impact**: High - Delays, costs, restrictions

**Probability**: Low - Decision support tool, not diagnostic

**Mitigation:**
- Position as "decision support" not "prescriptive"
- Require pharmacist review for all recommendations
- Clear disclaimers
- Legal review of marketing materials

**Contingency:**
- Legal counsel consultation
- Regulatory expert engagement
- Modify messaging if needed

---

### 17.5 Business Risks

#### Risk 1: Low User Adoption
**Description**: Pharmacists don't use the tool

**Impact**: High - Project failure

**Probability**: Medium - Change management challenge

**Mitigation:**
- User-centered design
- Pilot program with early adopters
- Training and documentation
- Demonstrate ROI clearly
- Collect and act on user feedback

**Contingency:**
- Enhanced training program
- Incentive programs
- Feature adjustments based on feedback

---

#### Risk 2: Cost Overruns
**Description**: API costs exceed budget

**Impact**: Medium - Financial strain

**Probability**: Medium - Usage-based pricing

**Mitigation:**
- Cost monitoring dashboard
- Alerts at 80% of budget
- OpenAI usage optimization (rule-based primary)
- Aggressive caching
- Cost cap per month

**Contingency:**
- Reduce OpenAI usage (rule-based only)
- Request higher rate limits (sometimes free)
- Optimize inefficient queries

---

## 18. Timeline & Milestones

### 18.1 Project Phases

**Total Duration:** 24 weeks (6 months)

**Phase 1: MVP (Weeks 1-8)**
**Phase 2: Enhanced Features (Weeks 9-16)**
**Phase 3: Integration & Scale (Weeks 17-24)**

---

### 18.2 Detailed Timeline

#### **Sprint 1-2 (Weeks 1-4): Foundation**

**Goals:**
- Project setup and infrastructure
- Basic UI scaffolding
- API integrations (RxNorm, FDA)

**Deliverables:**
- [ ] Firebase project setup (dev, staging, prod)
- [ ] SvelteKit project initialized
- [ ] Authentication system (Firebase Auth)
- [ ] Basic input form UI
- [ ] RxNorm API integration
- [ ] FDA NDC API integration
- [ ] Unit tests for API clients

**Team:**
- 2 full-stack developers
- 1 DevOps engineer

---

#### **Sprint 3-4 (Weeks 5-8): Core Calculation**

**Goals:**
- Implement calculation engine
- NDC validation and selection
- ✅ Basic results display (COMPLETED - Shard 9)

**Deliverables:**
- [ ] SIG parser (rule-based)
- [ ] Quantity calculator
- [ ] Package optimization algorithm
- [ ] Inactive NDC detection
- [x] Results display UI (COMPLETED - Shard 9)
- [ ] JSON output generation
- [ ] Comprehensive unit tests (80%+ coverage)
- [ ] Integration tests

**Team:**
- 2 full-stack developers
- 1 QA engineer

**Milestone:** **MVP Demo (End of Week 8)**

---

#### **Sprint 5-6 (Weeks 9-12): Special Dosage Forms**

**Goals:**
- Support liquid, insulin, inhaler calculations
- Enhanced UI/UX
- OpenAI integration

**Deliverables:**
- [ ] Liquid medication calculator
- [ ] Insulin calculator (units, pens, vials)
- [ ] Inhaler calculator (actuations)
- [ ] OpenAI SIG parser (fallback)
- [ ] Enhanced results display
- [ ] User notifications system
- [ ] Calculation history feature
- [ ] E2E tests for special forms

**Team:**
- 2 full-stack developers
- 1 UX designer
- 1 QA engineer

---

#### **Sprint 7-8 (Weeks 13-16): User Management & Analytics**

**Goals:**
- Role-based access control
- Analytics dashboard
- Enhanced reporting

**Deliverables:**
- [ ] User roles (Technician, Pharmacist, Admin)
- [ ] User profile management
- [ ] Analytics dashboard
- [ ] Usage metrics and reporting
- [ ] Export functionality
- [ ] Performance optimizations
- [ ] Security audit

**Team:**
- 2 full-stack developers
- 1 data analyst
- 1 security engineer

**Milestone:** **Phase 2 Complete - Enhanced Features (End of Week 16)**

---

#### **Sprint 9-10 (Weeks 17-20): API & Integration**

**Goals:**
- Public API development
- Integration support
- Batch processing

**Deliverables:**
- [ ] REST API endpoints
- [ ] API authentication (API keys)
- [ ] Rate limiting
- [ ] OpenAPI documentation
- [ ] Webhook support
- [ ] Batch processing (CSV upload)
- [ ] API client libraries (optional)
- [ ] Integration testing

**Team:**
- 2 backend developers
- 1 technical writer

---

#### **Sprint 11-12 (Weeks 21-24): Production Readiness**

**Goals:**
- Production deployment
- Monitoring and operations
- User training

**Deliverables:**
- [ ] Production environment setup
- [ ] Monitoring dashboards
- [ ] Alerting configuration
- [ ] Operational runbooks
- [ ] User training materials
- [ ] User documentation
- [ ] Video tutorials
- [ ] Launch plan
- [ ] Post-launch support plan

**Team:**
- 1 DevOps engineer
- 1 technical writer
- 1 training specialist

**Milestone:** **Production Launch (End of Week 24)**

---

### 18.3 Resource Allocation

**Team Composition:**

**Core Team (Weeks 1-24):**
- 2 Full-Stack Developers (TypeScript, SvelteKit, Firebase)
- 1 DevOps Engineer (Firebase, GCP, CI/CD)

**Extended Team (Part-Time):**
- 1 UX Designer (Weeks 9-16)
- 1 QA Engineer (Weeks 5-20)
- 1 Data Analyst (Weeks 13-16)
- 1 Security Engineer (Week 16)
- 1 Technical Writer (Weeks 17-24)
- 1 Training Specialist (Weeks 21-24)

**Product/Business:**
- 1 Product Manager (ongoing)
- 1 Clinical Pharmacist Advisor (consultation)

---

### 18.4 Key Milestones

| Milestone | Week | Description |
|---|---|---|
| **Kickoff** | Week 1 | Project start, team onboarding |
| **MVP Demo** | Week 8 | Core features demo to stakeholders |
| **Alpha Release** | Week 12 | Internal testing with select users |
| **Beta Release** | Week 16 | Pilot program with partner pharmacy |
| **API Launch** | Week 20 | Public API available for integration |
| **Production Launch** | Week 24 | Full production rollout |
| **30-Day Review** | Week 28 | Post-launch review, metrics analysis |
| **90-Day Review** | Week 36 | Success metrics evaluation, ROI |

---

## 19. Out of Scope

The following features and functionalities are explicitly out of scope for the initial product (v1.0):

### 19.1 Out of Scope for MVP (Phase 1)

1. **Mobile Application**
   - Native iOS/Android apps
   - Reason: Complex UI not suitable for small screens

2. **Real-Time Inventory Management**
   - Integration with pharmacy inventory systems
   - Stock availability tracking
   - Reason: Requires integration with diverse systems

3. **Pricing and Insurance Integration**
   - Drug pricing data
   - Insurance coverage verification
   - Prior authorization workflows
   - Reason: Complex, requires partnerships

4. **Patient-Facing Features**
   - Patient portals
   - Patient notifications
   - Medication reminders
   - Reason: Focus on pharmacist workflow first

5. **Advanced Analytics**
   - Predictive analytics
   - Machine learning models
   - Trend forecasting
   - Reason: Insufficient data at launch

6. **Prescription Ordering**
   - E-prescribing functionality
   - Order management
   - Reason: Regulatory complexity

7. **Controlled Substances**
   - DEA-scheduled medications
   - EPCS (Electronic Prescriptions for Controlled Substances)
   - Reason: Additional regulatory requirements

---

### 19.2 Future Enhancements (Post-Launch)

**Planned for Phase 4 (Months 7-12):**

1. **Enhanced FHIR Support**
   - Additional FHIR resources
   - Bi-directional sync
   - EHR integration marketplace

2. **Advanced AI Features**
   - Predictive NDC recommendations
   - Anomaly detection
   - Cost optimization recommendations

3. **Patient Communication**
   - SMS notifications
   - Email summaries
   - Patient instructions in multiple languages

4. **Supply Chain Integration**
   - Wholesaler API integration
   - Automated ordering
   - Shortage alerts

5. **Mobile Application**
   - Tablet-optimized app
   - Potential smartphone app for simple queries

6. **Expanded Drug Types**
   - Compound medications
   - Veterinary medications
   - Nutritional supplements

---

### 19.3 Explicitly Not Planned

The following will NOT be developed:

1. **Prescribing Functionality**
   - Generating new prescriptions
   - Medication therapy management
   - Clinical decision support (diagnosis-based)

2. **Direct Patient Care**
   - Medication counseling
   - Adverse event reporting
   - Medication management services

3. **Financial Services**
   - Payment processing
   - Billing integration
   - Claims adjudication

4. **Regulatory Compliance Tools**
   - DEA reporting
   - State board reporting
   - Compliance auditing

**Reason for Exclusions:** These areas require specialized expertise, regulatory approvals, or partnerships beyond the current scope. The calculator remains a decision-support tool for NDC selection and quantity calculation only.

---

## Appendix A: Glossary

**BID**: Twice daily (bis in die)  
**DAW**: Dispense As Written  
**DPI**: Dry Powder Inhaler  
**E2E**: End-to-End  
**FDA**: Food and Drug Administration  
**FHIR**: Fast Healthcare Interoperability Resources  
**HFA**: Hydrofluoroalkane (inhaler propellant)  
**HL7**: Health Level 7 (healthcare data standards)  
**MDI**: Metered Dose Inhaler  
**NDC**: National Drug Code  
**NPS**: Net Promoter Score  
**PHI**: Protected Health Information  
**PRN**: As needed (pro re nata)  
**QID**: Four times daily (quater in die)  
**RBAC**: Role-Based Access Control  
**RxCUI**: RxNorm Concept Unique Identifier  
**RxNorm**: Standardized nomenclature for clinical drugs  
**SIG**: Signa (prescription instructions)  
**TID**: Three times daily (ter in die)  
**TTL**: Time To Live  

---

## Appendix B: Success Criteria Summary

### Launch Criteria (Must meet before production)

- [ ] All P0 features implemented and tested
- [ ] 80%+ unit test coverage
- [ ] All integration tests passing
- [ ] E2E tests for critical flows passing
- [ ] Performance tests: p95 < 2 seconds
- [ ] Security audit completed (no high/critical issues)
- [ ] WCAG 2.1 Level AA accessibility compliance
- [ ] Pilot program completed with 10+ pharmacists
- [ ] User satisfaction > 4.0/5 in pilot
- [ ] Documentation complete (user guide, API docs, runbooks)
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested
- [ ] Legal review completed (terms, privacy policy)
- [ ] Training materials ready

### 30-Day Success Metrics

- [ ] 50+ active users
- [ ] 500+ calculations performed
- [ ] Normalization accuracy > 90%
- [ ] Error rate < 3%
- [ ] User satisfaction > 4.2/5
- [ ] Zero data loss incidents
- [ ] Uptime > 99%

### 90-Day Success Metrics

- [ ] 100+ active users
- [ ] 3,000+ calculations performed
- [ ] Normalization accuracy > 95%
- [ ] Claim rejection reduction > 30%
- [ ] Error rate < 2%
- [ ] User satisfaction > 4.5/5
- [ ] NPS > 40
- [ ] ROI projection positive

---

## Appendix C: References

1. **FDA NDC Directory**: https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory
2. **RxNorm API Documentation**: https://rxnav.nlm.nih.gov/RxNormAPIs.html
3. **OpenAI API Documentation**: https://platform.openai.com/docs
4. **Firebase Documentation**: https://firebase.google.com/docs
5. **SvelteKit Documentation**: https://kit.svelte.dev/docs
6. **HL7 FHIR Specification**: https://www.hl7.org/fhir/
7. **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2025-11-10 | AI Assistant | Initial draft |
| 2.0 | 2025-11-10 | AI Assistant | Comprehensive PRD with all assumptions |

**Approval:**

- [ ] Product Manager: ______________________ Date: __________
- [ ] Engineering Lead: ______________________ Date: __________
- [ ] Clinical Advisor: ______________________ Date: __________
- [ ] Executive Sponsor: ______________________ Date: __________

**Next Review Date:** 2025-12-10

---

**END OF DOCUMENT**

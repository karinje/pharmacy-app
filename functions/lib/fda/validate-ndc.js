"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNDC = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Firebase Admin (only once)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
function parsePackageSize(description) {
    const match = description.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
}
function parsePackageUnit(description) {
    const match = description.match(/^\d+(?:\.\d+)?\s+(\w+)/);
    return match ? match[1].toUpperCase() : 'UNIT';
}
/**
 * Cloud Function to validate NDC using FDA API
 */
exports.validateNDC = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 30,
    memory: '256MB'
})
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { ndc } = data;
    if (!ndc || ndc.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'NDC is required');
    }
    try {
        // Use original NDC format for cache (FDA API expects hyphenated format)
        const cacheRef = admin.firestore().collection('cache').doc(`fda_ndc_${ndc}`);
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const cached = cacheDoc.data();
            if (cached && cached.expiresAt > Date.now()) {
                return cached.data;
            }
        }
        // FDA API doesn't support direct package_ndc search
        // Strategy: Extract product_ndc from package_ndc, search by product_ndc, then filter
        const parts = ndc.split('-');
        let productNDC = null;
        if (parts.length === 3) {
            // Full package NDC: labeler-product-package
            productNDC = `${parts[0]}-${parts[1]}`;
        }
        else if (parts.length === 2) {
            // Product NDC: labeler-product
            productNDC = ndc;
        }
        let fdaData = null;
        // If we have a product NDC, search by it
        if (productNDC) {
            const url = `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${productNDC}"&limit=100`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    // Find the specific package in the results
                    for (const product of data.results) {
                        if (product.packaging) {
                            const matchingPackage = product.packaging.find((pkg) => pkg.package_ndc === ndc);
                            if (matchingPackage) {
                                fdaData = { results: [product] };
                                break;
                            }
                        }
                    }
                }
            }
            else if (response.status !== 404) {
                // Non-404 error, throw it
                throw new Error(`FDA API error: ${response.status}`);
            }
        }
        // If no results found
        if (!fdaData || !fdaData.results || fdaData.results.length === 0) {
            const result = {
                isValid: false,
                isActive: false
            };
            await cacheRef.set({
                data: result,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return result;
        }
        const product = fdaData.results[0];
        // Find the exact matching package
        const matchingPackage = (_a = product.packaging) === null || _a === void 0 ? void 0 : _a.find((pkg) => pkg.package_ndc === ndc);
        const packaging = matchingPackage || ((_b = product.packaging) === null || _b === void 0 ? void 0 : _b[0]);
        // Check if active
        const isActive = product.marketing_status === 'Prescription' ||
            product.marketing_status === 'Over-the-counter';
        const result = {
            isValid: true,
            isActive,
            product: {
                ndc: (packaging === null || packaging === void 0 ? void 0 : packaging.package_ndc) || ndc,
                genericName: product.generic_name,
                brandName: product.brand_name,
                manufacturer: product.labeler_name,
                packageSize: parsePackageSize((packaging === null || packaging === void 0 ? void 0 : packaging.description) || ''),
                packageUnit: parsePackageUnit((packaging === null || packaging === void 0 ? void 0 : packaging.description) || ''),
                marketingStatus: product.marketing_status
            }
        };
        // Cache for 24 hours
        await cacheRef.set({
            data: result,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return result;
    }
    catch (error) {
        console.error('Error validating NDC:', error);
        throw new functions.https.HttpsError('internal', 'Failed to validate NDC');
    }
});
//# sourceMappingURL=validate-ndc.js.map
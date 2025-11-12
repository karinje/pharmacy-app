"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNDC = exports.searchDrugs = exports.normalizeDrugName = void 0;
var normalize_1 = require("./rxnorm/normalize");
Object.defineProperty(exports, "normalizeDrugName", { enumerable: true, get: function () { return normalize_1.normalizeDrugName; } });
Object.defineProperty(exports, "searchDrugs", { enumerable: true, get: function () { return normalize_1.searchDrugs; } });
var validate_ndc_1 = require("./fda/validate-ndc");
Object.defineProperty(exports, "validateNDC", { enumerable: true, get: function () { return validate_ndc_1.validateNDC; } });
//# sourceMappingURL=index.js.map
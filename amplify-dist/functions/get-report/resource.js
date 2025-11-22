"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReport = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.getReport = (0, backend_1.defineFunction)({
    name: 'get-report',
    entry: './handler.ts',
});

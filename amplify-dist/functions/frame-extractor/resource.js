"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frameExtractor = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.frameExtractor = (0, backend_1.defineFunction)({
    name: 'frame-extractor',
    entry: './handler.ts',
    timeoutSeconds: 300,
    memoryMB: 2048,
});

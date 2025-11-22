"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAnalysis = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.aiAnalysis = (0, backend_1.defineFunction)({
    name: 'ai-analysis',
    entry: './handler.ts',
    timeoutSeconds: 300,
    memoryMB: 1024,
    environment: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '', // Will be set in console
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadInit = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.uploadInit = (0, backend_1.defineFunction)({
    name: 'upload-init',
    entry: './handler.ts',
    timeoutSeconds: 30,
});

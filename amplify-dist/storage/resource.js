"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const backend_1 = require("@aws-amplify/backend");
exports.storage = (0, backend_1.defineStorage)({
    name: 'opscoach-storage',
    access: (allow) => ({
        'uploads/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
        ],
        'frames/{entity_id}/*': [
            allow.entity('identity').to(['read', 'write', 'delete']),
        ],
    })
});

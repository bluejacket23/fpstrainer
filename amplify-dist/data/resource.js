"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const backend_1 = require("@aws-amplify/backend");
const resource_1 = require("../functions/upload-init/resource");
const resource_2 = require("../functions/get-report/resource");
const schema = backend_1.a.schema({
    OpsCoachReport: backend_1.a
        .model({
        userId: backend_1.a.string().required(),
        reportId: backend_1.a.string().required(),
        timestamp: backend_1.a.string(),
        videoUrl: backend_1.a.string(),
        frameUrls: backend_1.a.string().array(),
        aiReportJson: backend_1.a.json(),
        aiReportMarkdown: backend_1.a.string(),
        processingStatus: backend_1.a.string(), // 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'
    })
        .identifier(['userId', 'reportId'])
        .authorization((allow) => [
        allow.owner(),
    ]),
    initUpload: backend_1.a
        .mutation()
        .arguments({
        filename: backend_1.a.string(), // Just for metadata if needed
    })
        .returns(backend_1.a.json())
        .authorization((allow) => [allow.authenticated()])
        .handler(backend_1.a.handler.function(resource_1.uploadInit)),
    getReportCustom: backend_1.a
        .query()
        .arguments({
        userId: backend_1.a.string().required(),
        reportId: backend_1.a.string().required(),
    })
        .returns(backend_1.a.json())
        .authorization((allow) => [allow.authenticated()])
        .handler(backend_1.a.handler.function(resource_2.getReport)),
});
exports.data = (0, backend_1.defineData)({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});

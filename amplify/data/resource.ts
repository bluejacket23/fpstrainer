import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { uploadInit } from '../functions/upload-init/resource';
import { getReport } from '../functions/get-report/resource';
import { listReports } from '../functions/list-reports/resource';

const schema = a.schema({
  OpsCoachReport: a
    .model({
      userId: a.string().required(),
      reportId: a.string().required(),
      timestamp: a.string(),
      videoUrl: a.string(),
      frameUrls: a.string().array(),
      thumbnailUrl: a.string(),
      aiReportJson: a.json(),
      aiReportMarkdown: a.string(),
      processingStatus: a.string(), // 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'
    })
    .identifier(['userId', 'reportId'])
    .authorization((allow) => [
      allow.owner(),
    ]),
  initUpload: a
    .mutation()
    .arguments({
      filename: a.string(), // Just for metadata if needed
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(uploadInit)),
  getReportCustom: a
    .query()
    .arguments({
      userId: a.string().required(),
      reportId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(getReport)),
  listReportsCustom: a
    .query()
    .returns(a.json().array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(listReports)),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

export type Schema = ClientSchema<typeof schema>;


import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { uploadInit } from '../functions/upload-init/resource';
import { getReport } from '../functions/get-report/resource';
import { listReports } from '../functions/list-reports/resource';
import { generateShareableGraphic } from '../functions/generate-shareable-graphic/resource';
import { generateTrainingProgram } from '../functions/generate-training-program/resource';
import { createCheckoutSession } from '../functions/create-checkout-session/resource';

const schema = a.schema({
  User: a
    .model({
      userId: a.string().required(),
      email: a.string(),
      subscriptionPlan: a.string(), // 'RECRUIT', 'ROOKIE', 'COMPETITIVE', 'ELITE', 'PRO', 'GOD'
      clipsRemaining: a.integer(),
      clipsUsedThisMonth: a.integer(),
      monthStartDate: a.string(), // ISO date string when current month started
      stripeCustomerId: a.string(),
      stripeSubscriptionId: a.string(),
      referralCode: a.string(), // Unique code for referrals
      referredBy: a.string(), // userId of referrer
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.owner(),
    ]),
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
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
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
  generateShareableGraphic: a
    .mutation()
    .arguments({
      reportId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateShareableGraphic)),
  generateTrainingProgram: a
    .mutation()
    .arguments({
      reportId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(generateTrainingProgram)),
  createCheckoutSession: a
    .mutation()
    .arguments({
      planName: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createCheckoutSession)),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

export type Schema = ClientSchema<typeof schema>;


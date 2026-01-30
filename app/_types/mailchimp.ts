export interface Mailchimp {
  _id: string;
  batchNumber: number;
  apiCallsMade: number;
  maxApiCalls: number;
  apiKeyIndex: number;
  maxApiKeys: number;
  lastUpdate: Date | string;
  lastReset: Date | string;
}
